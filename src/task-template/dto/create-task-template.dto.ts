import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskType, TaskWeight } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskTemplateDto {
  @ApiProperty({
    example: 'Lavar louça',
    description: 'Nome da tarefa doméstica.',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Lavar a louça do jantar',
    description: 'Descrição opcional da tarefa.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TaskType,
    example: TaskType.DISHES,
    description: 'Tipo da tarefa.',
  })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({
    enum: TaskWeight,
    example: TaskWeight.MEDIUM,
    description: 'Peso da tarefa na equidade doméstica.',
  })
  @IsEnum(TaskWeight)
  weight: TaskWeight;
}
