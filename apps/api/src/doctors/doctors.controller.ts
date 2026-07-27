import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll(@Query('specialty') specialty?: string) {
    return this.doctorsService.findAll(specialty);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history/:patientId')
  history(
    @Param('id') id: string,
    @Param('patientId') patientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.doctorsService.getPatientHistory(id, patientId, user);
  }
}
