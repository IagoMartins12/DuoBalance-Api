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
  @ApiPropertyOptional({
    example: 'Mercado do mês (atualizado)',
    description: 'Nova descrição da despesa.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 400.5,
    description: 'Novo valor da despesa.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    enum: ExpenseCategory,
    description: 'Nova categoria da despesa.',
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({
    example: '2025-11-20T00:00:00.000Z',
    description: 'Nova data da despesa (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Novo método de pagamento.',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Atualiza o cartão de crédito associado, se houver.',
  })
  @IsOptional()
  @IsString()
  creditCardId?: string;

  @ApiPropertyOptional({
    description: 'Se true, marca a despesa como individual.',
  })
  @IsOptional()
  @IsBoolean()
  isIndividual?: boolean;
}
