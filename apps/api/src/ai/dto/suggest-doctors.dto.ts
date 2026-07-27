import { IsString, MinLength } from 'class-validator';

export class SuggestDoctorsDto {
  @IsString()
  @MinLength(2)
  diagnosis: string;
}
