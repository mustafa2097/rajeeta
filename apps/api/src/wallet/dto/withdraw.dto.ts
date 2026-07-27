import { IsInt, Min } from 'class-validator';

export class WithdrawDto {
  @IsInt()
  @Min(1)
  amount: number;
}
