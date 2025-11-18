import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'Mercado do mês (atualizado)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 400.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: '2025-11-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creditCardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isIndividual?: boolean;
}
