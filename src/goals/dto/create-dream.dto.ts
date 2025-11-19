import { Priority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDreamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  targetAmount: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;
}
