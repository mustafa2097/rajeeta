import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  private clientIp(req: Request): string | undefined {
    return req.ip || req.socket?.remoteAddress;
  }

  @Post()
  @Roles(Role.DOCTOR)
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePrescriptionDto,
    @Req() req: Request,
  ) {
    return this.prescriptionsService.create(user, dto, this.clientIp(req));
  }

  @Post('handwritten')
  @Roles(Role.DOCTOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  createHandwritten(
    @CurrentUser() user: AuthUser,
    @Body('patientId') patientId: string,
    @Body('notes') notes: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.prescriptionsService.createHandwritten(
      user,
      patientId,
      notes,
      file,
      this.clientIp(req),
    );
  }

  @Get('mine')
  @Roles(Role.PATIENT)
  findMine(@CurrentUser() user: AuthUser) {
    return this.prescriptionsService.findMine(user);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR, Role.ADMIN)
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.prescriptionsService.findByPatient(patientId, user);
  }
}
