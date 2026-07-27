import { IsString, MinLength } from 'class-validator';

export class PayConsultationDto {
  @IsString()
  @MinLength(1)
  appointmentId: string;
}
