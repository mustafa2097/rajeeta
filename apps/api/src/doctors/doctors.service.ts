import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { isSubscribed } from '../common/utils/subscription.util';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(specialty?: string) {
    const doctors = await this.prisma.doctorProfile.findMany({
      where: specialty
        ? { specialty: { contains: specialty, mode: 'insensitive' } }
        : undefined,
      include: {
        availabilitySlots: { where: { isAvailable: true } },
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    const now = new Date();
    return doctors
      .map((d) => ({
        ...d,
        isSubscribed: isSubscribed(d, now),
      }))
      .sort((a, b) => b.rating - a.rating);
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        availabilitySlots: { orderBy: { dayOfWeek: 'asc' } },
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return {
      ...doctor,
      isSubscribed: isSubscribed(doctor),
    };
  }

  async getPatientHistory(
    doctorId: string,
    patientId: string,
    user: AuthUser,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const isPatient = user.role === Role.PATIENT && user.patientProfileId === patientId;
    const isDoctor = user.role === Role.DOCTOR && user.doctorProfileId === doctorId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('Not allowed to view this history');
    }

    const [appointments, prescriptions, handwritten] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          patientId,
          status: AppointmentStatus.COMPLETED,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { doctorId, patientId },
        include: { medications: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.handwrittenPrescription.findMany({
        where: { doctorId, patientId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const conditions = appointments
      .map((a) => a.patientCondition)
      .filter((c): c is string => !!c);

    return {
      doctorId,
      patientId,
      appointments,
      prescriptions,
      handwrittenPrescriptions: handwritten,
      conditions,
    };
  }
}
