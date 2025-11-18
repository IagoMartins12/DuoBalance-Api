import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Mercado do mês' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 350.75 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.GROCERIES })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: '2025-11-17T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Obrigatório se paymentMethod = CREDIT_CARD',
    example: '675f8a3bbd0b5d3a9c0f1234',
  })
  @IsOptional()
  @IsString()
  creditCardId?: string;

  @ApiPropertyOptional({
    description: 'Se true, despesa é individual do usuário logado',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isIndividual?: boolean;

  @ApiPropertyOptional({
    description:
      'Se true, cria parcelas automaticamente (Installments) para esta despesa',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInstallment?: boolean;

  @ApiPropertyOptional({
    description:
      'Número total de parcelas (obrigatório se isInstallment = true)',
    example: 6,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalInstallments?: number;

  @ApiPropertyOptional({
    description:
      'Data de vencimento da primeira parcela (obrigatório se isInstallment = true)',
    example: '2025-12-10T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  firstDueDate?: string;
}
