import { GoalStatus, GoalType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;
}
