import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { WithdrawDto } from './dto/withdraw.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  private clientIp(req: Request): string | undefined {
    return req.ip || req.socket?.remoteAddress;
  }

  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.walletService.getWallet(user);
  }

  @Post('withdraw')
  withdraw(
    @CurrentUser() user: AuthUser,
    @Body() dto: WithdrawDto,
    @Req() req: Request,
  ) {
    return this.walletService.withdraw(user, dto, this.clientIp(req));
  }
}
