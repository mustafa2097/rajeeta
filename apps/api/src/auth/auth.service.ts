import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { stripPassword } from '../common/utils/subscription.util';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private async ensureUnique(email: string, phone: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  private async signTokens(user: {
    id: string;
    email: string;
    role: Role;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessExpires = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret',
      expiresIn: accessExpires as any,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret',
      expiresIn: refreshExpires as any,
    });
    return { accessToken, refreshToken };
  }

  private userInclude = {
    patientProfile: true,
    doctorProfile: {
      include: { wallet: true, availabilitySlots: true },
    },
    adminProfile: true,
  } as const;

  async registerPatient(dto: RegisterPatientDto, ip?: string) {
    await this.ensureUnique(dto.email, dto.phone);
    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            fullName: dto.fullName,
            age: dto.age,
            bloodType: dto.bloodType,
            chronicDiseases: dto.chronicDiseases ?? [],
          },
        },
      },
      include: this.userInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'REGISTER_PATIENT',
      entity: 'User',
      entityId: user.id,
      ip,
    });

    const tokens = await this.signTokens(user);
    return { ...tokens, user: stripPassword(user) };
  }

  async registerDoctor(dto: RegisterDoctorDto, ip?: string) {
    await this.ensureUnique(dto.email, dto.phone);
    const passwordHash = await this.hashPassword(dto.password);

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 2);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            fullName: dto.fullName,
            age: dto.age,
            specialty: dto.specialty,
            clinicName: dto.clinicName,
            clinicAddress: dto.clinicAddress,
            clinicFloor: dto.clinicFloor,
            consultationFee: dto.consultationFee,
            subscriptionStatus: SubscriptionStatus.TRIAL,
            trialEndsAt,
            wallet: { create: { balance: 0 } },
            availabilitySlots: {
              create: [0, 1, 2, 3].map((dayOfWeek) => ({
                dayOfWeek,
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true,
              })),
            },
          },
        },
      },
      include: this.userInclude,
    });

    await this.audit.log({
      userId: user.id,
      action: 'REGISTER_DOCTOR',
      entity: 'User',
      entityId: user.id,
      ip,
    });

    const tokens = await this.signTokens(user);
    return { ...tokens, user: stripPassword(user) };
  }

  async login(dto: LoginDto, ip?: string) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: dto.identifier.trim() },
        ],
      },
      include: this.userInclude,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ip,
    });

    const tokens = await this.signTokens(user);
    return { ...tokens, user: stripPassword(user) };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: Role;
      }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: this.userInclude,
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.signTokens(user);
      return { ...tokens, user: stripPassword(user) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude,
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return stripPassword(user);
  }
}
