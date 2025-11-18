import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskType, TaskWeight } from '@prisma/client';

export class CreateTaskTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsEnum(TaskWeight)
  weight: TaskWeight;
}
