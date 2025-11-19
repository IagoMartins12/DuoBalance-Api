import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddContributionDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
