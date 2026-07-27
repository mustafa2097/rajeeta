import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import {

  PaymentStatus,

  PaymentType,

  WalletTransactionType,

} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AuditService } from '../common/services/audit.service';

import { AuthUser } from '../common/decorators/current-user.decorator';

import { enrichWallet } from '../common/utils/wallet.util';

import { WithdrawDto } from './dto/withdraw.dto';



@Injectable()

export class WalletService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly audit: AuditService,

  ) {}



  async getWallet(user: AuthUser) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const wallet = await this.prisma.wallet.findUnique({

      where: { doctorId: user.doctorProfileId },

      include: {

        transactions: { orderBy: { createdAt: 'desc' } },

      },

    });



    if (!wallet) {

      throw new NotFoundException('Wallet not found');

    }



    return enrichWallet(wallet);

  }



  async withdraw(user: AuthUser, dto: WithdrawDto, ip?: string) {

    if (!user.doctorProfileId) {

      throw new ForbiddenException('Doctor profile required');

    }



    const wallet = await this.prisma.wallet.findUnique({

      where: { doctorId: user.doctorProfileId },

      include: { transactions: true },

    });



    if (!wallet) {

      throw new NotFoundException('Wallet not found');

    }



    const { withdrawableBalance } = enrichWallet(wallet);



    if (dto.amount > withdrawableBalance) {

      throw new BadRequestException('Insufficient withdrawable balance');

    }



    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;



    const result = await this.prisma.$transaction(async (tx) => {

      const updatedWallet = await tx.wallet.update({

        where: { id: wallet.id },

        data: { balance: { decrement: dto.amount } },

      });



      const transaction = await tx.walletTransaction.create({

        data: {

          walletId: wallet.id,

          amount: -dto.amount,

          type: WalletTransactionType.WITHDRAWAL,

          description: `سحب عبر بوابة الدفع (${reference})`,

        },

      });



      const payment = await tx.payment.create({

        data: {

          userId: user.id,

          amount: dto.amount,

          type: PaymentType.WITHDRAWAL,

          status: PaymentStatus.SUCCESS,

          reference,

        },

      });



      return { wallet: updatedWallet, transaction, payment };

    });



    await this.audit.log({

      userId: user.id,

      action: 'WALLET_WITHDRAWAL',

      entity: 'Wallet',

      entityId: wallet.id,

      metadata: {

        amount: dto.amount,

        reference,

        paymentId: result.payment.id,

      },

      ip,

    });



    const full = await this.prisma.wallet.findUnique({

      where: { id: wallet.id },

      include: { transactions: { orderBy: { createdAt: 'desc' } } },

    });



    return {

      ...result,

      wallet: full ? enrichWallet(full) : enrichWallet(result.wallet),

    };

  }

}


