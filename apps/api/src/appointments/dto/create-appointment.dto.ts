import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  doctorId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['CASH', 'ELECTRONIC'])
  paymentMethod?: 'CASH' | 'ELECTRONIC';
}
