import { IsEnum, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ExpenseCategory } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    enum: ExpenseCategory,
    description: 'Categoria de despesa do orçamento.',
    example: ExpenseCategory.GROCERIES,
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({
    example: 1500,
    description: 'Valor limite do orçamento para essa categoria.',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 11,
    description: 'Mês de referência (1-12).',
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    example: 2025,
    description: 'Ano de referência (2000-2100).',
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
