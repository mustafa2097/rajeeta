import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('me')
  @Roles(Role.PATIENT)
  getMe(@CurrentUser() user: AuthUser) {
    return this.patientsService.getMe(user);
  }

  @Patch('me')
  @Roles(Role.PATIENT)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdatePatientDto) {
    return this.patientsService.updateMe(user, dto);
  }

  @Get(':id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.patientsService.findOne(id, user);
  }
}
