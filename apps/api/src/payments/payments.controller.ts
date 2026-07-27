import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PayConsultationDto } from './dto/pay-consultation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private clientIp(req: Request): string | undefined {
    return req.ip || req.socket?.remoteAddress;
  }

  @Post('subscribe')
  @Roles(Role.DOCTOR)
  subscribe(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.paymentsService.subscribe(user, this.clientIp(req));
  }

  @Post('consultation')
  @Roles(Role.PATIENT)
  payConsultation(
    @CurrentUser() user: AuthUser,
    @Body() dto: PayConsultationDto,
    @Req() req: Request,
  ) {
    return this.paymentsService.payConsultation(user, dto, this.clientIp(req));
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.paymentsService.findMine(user);
  }
}
