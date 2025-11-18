import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateDomesticTaskEntryDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  completedAt?: string; // ISO
}
