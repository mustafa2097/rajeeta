import { IsOptional, IsString } from 'class-validator';

export class CompleteAppointmentDto {
  @IsOptional()
  @IsString()
  patientCondition?: string;
}
