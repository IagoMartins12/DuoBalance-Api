import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IncomeType, Frequency } from '@prisma/client';

export class CreateIncomeDto {
  @ApiProperty({ example: 'Salário CLT' })
  @IsString()
  source: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: IncomeType, example: IncomeType.SALARY })
  @IsEnum(IncomeType)
  type: IncomeType;

  @ApiProperty({ enum: Frequency, example: Frequency.MONTHLY })
  @IsEnum(Frequency)
  frequency: Frequency;

  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  @IsDateString()
  receivedAt: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
