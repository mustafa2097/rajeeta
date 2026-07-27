import { IsString, MinLength } from 'class-validator';

export class RejectAppointmentDto {
  @IsString()
  @MinLength(1)
  message: string;
}
