import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  private clientIp(req: Request): string | undefined {
    return req.ip || req.socket?.remoteAddress;
  }

  @Post()
  @Roles(Role.PATIENT)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAppointmentDto,
    @Req() req: Request,
  ) {
    return this.appointmentsService.create(user, dto, this.clientIp(req));
  }

  @Get('mine')
  @Roles(Role.PATIENT)
  findMine(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.findMine(user);
  }

  @Get('doctor')
  @Roles(Role.DOCTOR)
  findDoctor(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.findDoctorAppointments(user);
  }

  @Patch(':id/confirm')
  @Roles(Role.DOCTOR)
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.appointmentsService.confirm(user, id, this.clientIp(req));
  }

  @Patch(':id/reject')
  @Roles(Role.DOCTOR)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectAppointmentDto,
    @Req() req: Request,
  ) {
    return this.appointmentsService.reject(user, id, dto, this.clientIp(req));
  }

  @Patch(':id/complete')
  @Roles(Role.DOCTOR)
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CompleteAppointmentDto,
    @Req() req: Request,
  ) {
    return this.appointmentsService.complete(user, id, dto, this.clientIp(req));
  }
}
