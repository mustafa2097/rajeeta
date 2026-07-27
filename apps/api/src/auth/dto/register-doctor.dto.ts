import { IsEmail, IsInt, IsString, Min, MinLength } from 'class-validator';

export class RegisterDoctorDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @MinLength(2)
  specialty: string;

  @IsString()
  @MinLength(2)
  clinicName: string;

  @IsString()
  @MinLength(2)
  clinicAddress: string;

  @IsString()
  clinicFloor: string;

  @IsInt()
  @Min(0)
  consultationFee: number;
}
