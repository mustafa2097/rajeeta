import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import {

  AppointmentStatus,

  ConsultationPaymentStatus,

  PaymentMethod,

  WalletTransactionType,

} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../common/services/audit.service';

import { AuthUser } from '../common/decorators/current-user.decorator';

import {

  isWithinSlot,

  toDayOfWeek,

} from '../common/utils/subscription.util';

import { CreateAppointmentDto } from './dto/create-appointment.dto';

import { RejectAppointmentDto } from './dto/reject-appointment.dto';

import { CompleteAppointmentDto } from './dto/complete-appointment.dto';



@Injectable()

export class AppointmentsService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly audit: AuditService,

  ) {}



  async create(user: AuthUser, dto: CreateAppointmentDto, ip?: string) {

    if (!user.patientProfileId) {

      throw new ForbiddenException('Patient profile required');

    }



    const doctor = await this.prisma.doctorProfile.findUnique({

      where: { id: dto.doctorId },

      include: { availabilitySlots: true, wallet: true },

    });



    if (!doctor) {

      throw new NotFoundException('Doctor not found');

    }



    const scheduledAt = new Date(dto.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {

      throw new BadRequestException('Invalid scheduledAt');

    }



    if (scheduledAt <= new Date()) {

      throw new BadRequestException('Appointment must be in the future');

    }



    const dayOfWeek = toDayOfWeek(scheduledAt);

    const slots = doctor.availabilitySlots.filter(

      (s) => s.isAvailable && s.dayOfWeek === dayOfWeek,

    );



    const inSlot = slots.some((s) =>

      isWithinSlot(scheduledAt, s.startTime, s.endTime),

    );



    if (!inSlot) {

      throw new BadRequestException('Doctor is not available at this time');

    }



    const conflict = await this.prisma.appointment.findFirst({

      where: {

        doctorId: doctor.id,

        scheduledAt,

        status: {

          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],

        },

      },

    });



    if (conflict) {

      throw new BadRequestException('Time slot already booked');

    }



    let discountAmount = 0;

    let discountCodeId: string | undefined;



    if (dto.discountCode) {

      const code = await this.prisma.discountCode.findUnique({

        where: { code: dto.discountCode.toUpperCase() },

      });



      if (!code || !code.isActive) {

        throw new BadRequestException('Invalid or inactive discount code');

      }



      discountAmount = Math.round(

        (doctor.consultationFee * code.percentage) / 100,

      );

      discountCodeId = code.id;

    }



    const amountPaid = doctor.consultationFee - discountAmount;

    const paymentMethod =

      dto.paymentMethod === 'ELECTRONIC'

        ? PaymentMethod.ELECTRONIC

        : PaymentMethod.CASH;

    const consultationPaymentStatus =

      paymentMethod === PaymentMethod.ELECTRONIC

        ? ConsultationPaymentStatus.PENDING

        : ConsultationPaymentStatus.NOT_REQUIRED;



    const appointment = await this.prisma.appointment.create({

      data: {

        patientId: user.patientProfileId,

        doctorId: doctor.id,

        scheduledAt,

        status: AppointmentStatus.PENDING,

        consultationFee: doctor.consultationFee,

        discountAmount,

        amountPaid,

        paymentMethod,

        consultationPaymentStatus,

        discountCodeId,

        notes: dto.notes,

      },

      include: {

        doctor: {

          select: { id: true, fullName: true, specialty: true },

        },

        patient: {

          select: { id: true, fullName: true },

        },

        discountCode: true,

      },

    });



    await this.audit.log({

      userId: user.id,

      action: 'CREATE_APPOINTMENT',

      entity: 'Appointment',

      entityId: appointment.id,

      metadata: {

        doctorId: doctor.id,

        amountPaid,

        discountAmount,

        paymentMethod,

      },

      ip,

    });



    return appointment;

  }



  async findMine(user: AuthUser) {

    if (!user.patientProfileId) {

      throw new ForbiddenException('Patient profile required');

    }



    return this.prisma.appointment.findMany({

      where: { patientId: user.patientProfileId },

      include: {

        doctor: {

          select: {

            id: true,

            fullName: true,

            specialty: true,

            clinicName: true,

            clinicAddress: true,

          },

        },

        prescription: { include: { medications: true } },

        discountCode: true,

      },

      orderBy: { scheduledAt: 'desc' },

    });

  }



  async findDoctorAppointments(user: AuthUser) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const appointments = await this.prisma.appointment.findMany({

      where: { doctorId: user.doctorProfileId },

      include: {

        patient: {

          select: {

            id: true,

            fullName: true,

            age: true,

            bloodType: true,

            chronicDiseases: true,

          },

        },

        prescription: { include: { medications: true } },

        discountCode: true,

      },

      orderBy: { scheduledAt: 'desc' },

    });



    return appointments.sort((a, b) => {

      if (a.status === AppointmentStatus.PENDING && b.status !== AppointmentStatus.PENDING) {

        return -1;

      }

      if (b.status === AppointmentStatus.PENDING && a.status !== AppointmentStatus.PENDING) {

        return 1;

      }

      return b.scheduledAt.getTime() - a.scheduledAt.getTime();

    });

  }



  private async getDoctorAppointment(id: string, doctorProfileId: string) {

    const appointment = await this.prisma.appointment.findUnique({

      where: { id },

      include: {

        doctor: { include: { wallet: true } },

        discountCode: true,

      },

    });



    if (!appointment) {

      throw new NotFoundException('Appointment not found');

    }



    if (appointment.doctorId !== doctorProfileId) {

      throw new ForbiddenException('Not your appointment');

    }



    return appointment;

  }



  async confirm(user: AuthUser, id: string, ip?: string) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const appointment = await this.getDoctorAppointment(

      id,

      user.doctorProfileId,

    );



    if (appointment.status !== AppointmentStatus.PENDING) {

      throw new BadRequestException('Only pending appointments can be confirmed');

    }



    if (

      appointment.paymentMethod === PaymentMethod.ELECTRONIC &&

      appointment.consultationPaymentStatus !== ConsultationPaymentStatus.PAID

    ) {

      throw new BadRequestException(

        'Cannot confirm until electronic payment is completed',

      );

    }



    const wallet = appointment.doctor.wallet;

    if (!wallet) {

      throw new BadRequestException('Doctor wallet not found');

    }



    const result = await this.prisma.$transaction(async (tx) => {

      const updated = await tx.appointment.update({

        where: { id },

        data: { status: AppointmentStatus.CONFIRMED },

        include: {

          patient: { select: { id: true, fullName: true } },

          doctor: { select: { id: true, fullName: true } },

          discountCode: true,

        },

      });



      // Cash: record earnings only (not withdrawable). E-pay credited at payment time.

      if (appointment.paymentMethod === PaymentMethod.CASH) {

        await tx.walletTransaction.create({

          data: {

            walletId: wallet.id,

            amount: appointment.amountPaid,

            type: WalletTransactionType.CASH_CONSULTATION,

            description: 'أتعاب نقدية في العيادة',

            appointmentId: appointment.id,

          },

        });

      }



      // Discount compensation always goes to withdrawable balance.

      if (appointment.discountAmount > 0) {

        await tx.wallet.update({

          where: { id: wallet.id },

          data: { balance: { increment: appointment.discountAmount } },

        });



        await tx.walletTransaction.create({

          data: {

            walletId: wallet.id,

            amount: appointment.discountAmount,

            type: WalletTransactionType.DISCOUNT_CREDIT,

            description: 'تعويض خصم',

            appointmentId: appointment.id,

            discountCodeId: appointment.discountCodeId ?? undefined,

          },

        });

      }



      if (appointment.discountCodeId) {

        await tx.discountCode.update({

          where: { id: appointment.discountCodeId },

          data: { usageCount: { increment: 1 } },

        });

      }



      return updated;

    });



    await this.audit.log({

      userId: user.id,

      action: 'CONFIRM_APPOINTMENT',

      entity: 'Appointment',

      entityId: id,

      metadata: {

        amountPaid: appointment.amountPaid,

        discountAmount: appointment.discountAmount,

        paymentMethod: appointment.paymentMethod,

      },

      ip,

    });



    return result;

  }



  async reject(

    user: AuthUser,

    id: string,

    dto: RejectAppointmentDto,

    ip?: string,

  ) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const appointment = await this.getDoctorAppointment(

      id,

      user.doctorProfileId,

    );



    if (appointment.status !== AppointmentStatus.PENDING) {

      throw new BadRequestException('Only pending appointments can be rejected');

    }



    const wallet = appointment.doctor.wallet;



    const updated = await this.prisma.$transaction(async (tx) => {

      if (

        appointment.paymentMethod === PaymentMethod.ELECTRONIC &&

        appointment.consultationPaymentStatus === ConsultationPaymentStatus.PAID &&

        wallet

      ) {

        await tx.wallet.update({

          where: { id: wallet.id },

          data: { balance: { decrement: appointment.amountPaid } },

        });



        await tx.walletTransaction.create({

          data: {

            walletId: wallet.id,

            amount: -appointment.amountPaid,

            type: WalletTransactionType.ELECTRONIC_CONSULTATION,

            description: 'استرداد دفع إلكتروني — موعد مرفوض',

            appointmentId: appointment.id,

          },

        });

      }



      return tx.appointment.update({

        where: { id },

        data: {

          status: AppointmentStatus.REJECTED,

          rejectionMessage: dto.message,

          consultationPaymentStatus:

            appointment.paymentMethod === PaymentMethod.ELECTRONIC

              ? ConsultationPaymentStatus.FAILED

              : appointment.consultationPaymentStatus,

        },

        include: {

          patient: { select: { id: true, fullName: true } },

          doctor: { select: { id: true, fullName: true } },

        },

      });

    });



    await this.audit.log({

      userId: user.id,

      action: 'REJECT_APPOINTMENT',

      entity: 'Appointment',

      entityId: id,

      metadata: { message: dto.message },

      ip,

    });



    return updated;

  }



  async complete(

    user: AuthUser,

    id: string,

    dto: CompleteAppointmentDto,

    ip?: string,

  ) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const appointment = await this.getDoctorAppointment(

      id,

      user.doctorProfileId,

    );



    if (appointment.status !== AppointmentStatus.CONFIRMED) {

      throw new BadRequestException(

        'Only confirmed appointments can be completed',

      );

    }



    const updated = await this.prisma.appointment.update({

      where: { id },

      data: {

        status: AppointmentStatus.COMPLETED,

        patientCondition: dto.patientCondition,

      },

      include: {

        patient: { select: { id: true, fullName: true } },

        doctor: { select: { id: true, fullName: true } },

      },

    });



    await this.audit.log({

      userId: user.id,

      action: 'COMPLETE_APPOINTMENT',

      entity: 'Appointment',

      entityId: id,

      metadata: { patientCondition: dto.patientCondition },

      ip,

    });



    return updated;

  }

}


