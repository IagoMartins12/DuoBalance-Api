import { GoalType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  targetAmount: number;

  @IsEnum(GoalType)
  type: GoalType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  targetDate: string;
}
