import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @ApiPropertyOptional({
    example: ExpenseCategory.GROCERIES,
    enum: ExpenseCategory,
    description: 'Nova categoria do orçamento (opcional).',
  })
  category?: any;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Novo valor limite do orçamento (opcional).',
  })
  amount?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Novo mes do orçamento (opcional).',
  })
  month?: number;

  @ApiPropertyOptional({
    example: 2025,
    description: 'Novo ano do orçamento (opcional).',
  })
  @ApiPropertyOptional()
  year?: number;
}
