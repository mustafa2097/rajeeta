import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateDiscountCodeDto {
  @IsString()
  @MinLength(2)
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  percentage: number;
}
