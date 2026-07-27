import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class MedicationDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  dosage: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsBoolean()
  isRestricted: boolean;
}

export class CreatePrescriptionDto {
  @IsString()
  @MinLength(1)
  appointmentId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications: MedicationDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
