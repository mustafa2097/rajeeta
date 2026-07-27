import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {

  ConsultationPaymentStatus,

  PaymentMethod,

  PaymentStatus,

  PaymentType,

  SubscriptionStatus,

  WalletTransactionType,

} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../common/services/audit.service';

import { AuthUser } from '../common/decorators/current-user.decorator';

import { PayConsultationDto } from './dto/pay-consultation.dto';



@Injectable()

export class PaymentsService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly config: ConfigService,

    private readonly audit: AuditService,

  ) {}



  async subscribe(user: AuthUser, ip?: string) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const doctor = await this.prisma.doctorProfile.findUnique({

      where: { id: user.doctorProfileId },

    });



    if (!doctor) {

      throw new NotFoundException('Doctor profile not found');

    }



    const amount = Number(this.config.get('SUBSCRIPTION_PRICE') ?? 35000);

    const reference = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;



    const subscriptionEndsAt = new Date();

    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);



    const result = await this.prisma.$transaction(async (tx) => {

      const payment = await tx.payment.create({

        data: {

          userId: user.id,

          amount,

          type: PaymentType.SUBSCRIPTION,

          status: PaymentStatus.SUCCESS,

          reference,

        },

      });



      const updatedDoctor = await tx.doctorProfile.update({

        where: { id: doctor.id },

        data: {

          subscriptionStatus: SubscriptionStatus.ACTIVE,

          subscriptionEndsAt,

        },

      });



      return { payment, doctor: updatedDoctor };

    });



    await this.audit.log({

      userId: user.id,

      action: 'SUBSCRIBE',

      entity: 'Payment',

      entityId: result.payment.id,

      metadata: {

        amount,

        reference,

        subscriptionEndsAt: subscriptionEndsAt.toISOString(),

      },

      ip,

    });



    return result;

  }



  /** Mock electronic consultation payment — credits doctor withdrawable balance. */

  async payConsultation(

    user: AuthUser,

    dto: PayConsultationDto,

    ip?: string,

  ) {

    if (!user.patientProfileId) {

      throw new ForbiddenException('Patient profile required');

    }



    const appointment = await this.prisma.appointment.findUnique({

      where: { id: dto.appointmentId },

      include: {

        doctor: { include: { wallet: true } },

      },

    });



    if (!appointment) {

      throw new NotFoundException('Appointment not found');

    }



    if (appointment.patientId !== user.patientProfileId) {

      throw new ForbiddenException('Not your appointment');

    }



    if (appointment.paymentMethod !== PaymentMethod.ELECTRONIC) {

      throw new BadRequestException('This appointment is not electronic');

    }



    if (

      appointment.consultationPaymentStatus === ConsultationPaymentStatus.PAID

    ) {

      throw new BadRequestException('Already paid');

    }



    const wallet = appointment.doctor.wallet;

    if (!wallet) {

      throw new BadRequestException('Doctor wallet not found');

    }



    const reference = `CON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;



    const result = await this.prisma.$transaction(async (tx) => {

      const payment = await tx.payment.create({

        data: {

          userId: user.id,

          appointmentId: appointment.id,

          amount: appointment.amountPaid,

          type: PaymentType.CONSULTATION,

          status: PaymentStatus.SUCCESS,

          reference,

        },

      });



      await tx.appointment.update({

        where: { id: appointment.id },

        data: { consultationPaymentStatus: ConsultationPaymentStatus.PAID },

      });



      await tx.wallet.update({

        where: { id: wallet.id },

        data: { balance: { increment: appointment.amountPaid } },

      });



      await tx.walletTransaction.create({

        data: {

          walletId: wallet.id,

          amount: appointment.amountPaid,

          type: WalletTransactionType.ELECTRONIC_CONSULTATION,

          description: 'دفع إلكتروني — استشارة',

          appointmentId: appointment.id,

        },

      });



      return payment;

    });



    await this.audit.log({

      userId: user.id,

      action: 'PAY_CONSULTATION',

      entity: 'Payment',

      entityId: result.id,

      metadata: {

        appointmentId: appointment.id,

        amount: appointment.amountPaid,

        reference,

      },

      ip,

    });



    return {

      payment: result,

      appointmentId: appointment.id,

      amount: appointment.amountPaid,

      reference,

    };

  }



  async findMine(user: AuthUser) {

    return this.prisma.payment.findMany({

      where: { userId: user.id },

      orderBy: { createdAt: 'desc' },

    });

  }

}


