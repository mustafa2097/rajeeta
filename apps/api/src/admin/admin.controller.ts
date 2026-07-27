import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private clientIp(req: Request): string | undefined {
    return req.ip || req.socket?.remoteAddress;
  }

  @Get('accounts')
  getAccounts(
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAccounts(role, search);
  }

  @Get('transactions')
  getTransactions() {
    return this.adminService.getTransactions();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Post('admins')
  createAdmin(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAdminDto,
    @Req() req: Request,
  ) {
    return this.adminService.createAdmin(user, dto, this.clientIp(req));
  }
}
