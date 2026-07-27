import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PaymentStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { stripPassword } from '../common/utils/subscription.util';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAccounts(role?: Role, search?: string) {
    const and: Prisma.UserWhereInput[] = [];

    if (role) {
      and.push({ role });
    }

    const q = search?.trim();
    if (q) {
      const or: Prisma.UserWhereInput[] = [
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];

      if (!role || role === Role.DOCTOR) {
        or.push({
          doctorProfile: { fullName: { contains: q, mode: 'insensitive' } },
        });
      }
      if (!role || role === Role.PATIENT) {
        or.push({
          patientProfile: { fullName: { contains: q, mode: 'insensitive' } },
        });
      }
      if (!role || role === Role.ADMIN) {
        or.push({
          adminProfile: { fullName: { contains: q, mode: 'insensitive' } },
        });
      }

      and.push({ OR: or });
    }

    const users = await this.prisma.user.findMany({
      where: and.length ? { AND: and } : undefined,
      include: {
        patientProfile: true,
        doctorProfile: { include: { wallet: true } },
        adminProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(stripPassword);
  }

  async getTransactions() {
    const [walletTransactions, payments] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              doctor: { select: { id: true, fullName: true } },
            },
          },
          appointment: {
            select: { id: true, scheduledAt: true, status: true },
          },
          discountCode: true,
        },
      }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              doctorProfile: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    return { walletTransactions, payments };
  }

  async getStats() {
    const [
      patients,
      doctors,
      admins,
      appointments,
      prescriptions,
      payments,
      walletTx,
    ] = await Promise.all([
      this.prisma.patientProfile.count(),
      this.prisma.doctorProfile.count(),
      this.prisma.adminProfile.count(),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.prescription.count(),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESS },
      }),
      this.prisma.walletTransaction.findMany(),
    ]);

    const revenueByType = payments.reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.type] = (acc[p.type] ?? 0) + p.amount;
        return acc;
      },
      {},
    );

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const walletCredits = walletTx
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const walletDebits = walletTx
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      counts: {
        patients,
        doctors,
        admins,
        prescriptions,
        appointments: Object.fromEntries(
          appointments.map((a) => [a.status, a._count]),
        ),
      },
      revenue: {
        total: totalRevenue,
        byType: revenueByType,
        walletCredits,
        walletDebits,
      },
    };
  }

  async createAdmin(user: AuthUser, dto: CreateAdminDto, ip?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: Role.ADMIN,
        adminProfile: {
          create: { fullName: dto.fullName },
        },
      },
      include: { adminProfile: true },
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE_ADMIN',
      entity: 'User',
      entityId: admin.id,
      metadata: { email: admin.email },
      ip,
    });

    return stripPassword(admin);
  }
}
