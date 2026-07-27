import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: AuthUser) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('Patient profile not found');
    }

    const profile = await this.prisma.patientProfile.findUnique({
      where: { id: user.patientProfileId },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return profile;
  }

  async updateMe(user: AuthUser, dto: UpdatePatientDto) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('Patient profile not found');
    }

    return this.prisma.patientProfile.update({
      where: { id: user.patientProfileId },
      data: {
        fullName: dto.fullName,
        age: dto.age,
        bloodType: dto.bloodType,
        chronicDiseases: dto.chronicDiseases,
      },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
      },
    });
  }

  async findOne(id: string, user: AuthUser) {
    if (user.role === Role.PATIENT && user.patientProfileId !== id) {
      throw new ForbiddenException('Cannot view other patient profiles');
    }

    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN && user.role !== Role.PATIENT) {
      throw new ForbiddenException();
    }

    const profile = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                fullName: true,
                specialty: true,
              },
            },
          },
        },
        prescriptions: {
          include: { medications: true },
          orderBy: { createdAt: 'desc' },
        },
        handwrittenPrescriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Patient not found');
    }

    return profile;
  }
}
