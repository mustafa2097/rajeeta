import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreatePrescriptionDto, ip?: string) {
    if (!user.doctorProfileId) {
      throw new ForbiddenException('Doctor profile required');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { prescription: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctorId !== user.doctorProfileId) {
      throw new ForbiddenException('Not your appointment');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Prescriptions can only be created for completed appointments',
      );
    }

    if (appointment.prescription) {
      throw new BadRequestException('Prescription already exists');
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: user.doctorProfileId,
        notes: dto.notes,
        medications: {
          create: dto.medications.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            instructions: m.instructions,
            isRestricted: m.isRestricted,
          })),
        },
      },
      include: { medications: true },
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE_PRESCRIPTION',
      entity: 'Prescription',
      entityId: prescription.id,
      ip,
    });

    return prescription;
  }

  async createHandwritten(
    user: AuthUser,
    patientId: string,
    notes: string | undefined,
    file: Express.Multer.File,
    ip?: string,
  ) {
    if (!user.doctorProfileId) {
      throw new ForbiddenException('Doctor profile required');
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only jpeg, png, and webp images are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be at most 5MB');
    }

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
    const filename = `rx-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = join(uploadDir, filename);

    const { writeFileSync } = await import('fs');
    writeFileSync(filepath, file.buffer);

    const imageUrl = `/uploads/${filename}`;

    const record = await this.prisma.handwrittenPrescription.create({
      data: {
        patientId,
        doctorId: user.doctorProfileId,
        imageUrl,
        notes,
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE_HANDWRITTEN_PRESCRIPTION',
      entity: 'HandwrittenPrescription',
      entityId: record.id,
      metadata: { patientId, imageUrl },
      ip,
    });

    return record;
  }

  async findMine(user: AuthUser) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('Patient profile required');
    }

    const [prescriptions, handwritten] = await Promise.all([
      this.prisma.prescription.findMany({
        where: { patientId: user.patientProfileId },
        include: {
          medications: true,
          doctor: { select: { id: true, fullName: true, specialty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.handwrittenPrescription.findMany({
        where: { patientId: user.patientProfileId },
        include: {
          doctor: { select: { id: true, fullName: true, specialty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { prescriptions, handwrittenPrescriptions: handwritten };
  }

  async findByPatient(patientId: string, user: AuthUser) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const where =
      user.role === 'DOCTOR' && user.doctorProfileId
        ? { patientId, doctorId: user.doctorProfileId }
        : { patientId };

    const [prescriptions, handwritten] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          medications: true,
          doctor: { select: { id: true, fullName: true, specialty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.handwrittenPrescription.findMany({
        where,
        include: {
          doctor: { select: { id: true, fullName: true, specialty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { prescriptions, handwrittenPrescriptions: handwritten };
  }
}
