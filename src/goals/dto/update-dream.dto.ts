import { DreamStatus, Priority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDreamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(DreamStatus)
  @IsOptional()
  status?: DreamStatus;
}
