import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateDomesticTaskEntryDto {
  @ApiProperty({
    example: 'taskTemplateId123',
    description: 'ID do template de tarefa doméstica.',
  })
  @IsString()
  templateId: string;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Horas gastas na tarefa (opcional).',
  })
  @IsOptional()
  @IsNumber()
  hours?: number;

  @ApiPropertyOptional({
    example: 'Lavei a louça inteira hoje.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: '2025-11-19T14:00:00Z',
    description: 'Data/hora da conclusão da tarefa.',
  })
  @IsOptional()
  @IsString()
  completedAt?: string; // ISO
}
