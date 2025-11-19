import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';

export class BudgetResponseDto {
  @ApiProperty({ example: '673c40fae75b106b22af2c01' })
  id: string;

  @ApiProperty({ example: '673c40fae75b106b22af2b99' })
  householdId: string;

  @ApiProperty({ enum: ExpenseCategory })
  category: ExpenseCategory;

  @ApiProperty({ example: 1500 })
  amount: number;

  @ApiProperty({ example: 11 })
  month: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({
    example: 750,
    description: 'Total já gasto na categoria no período.',
  })
  spent: number;

  @ApiProperty({
    example: 50,
    description: 'Porcentagem gasta em relação ao limite.',
  })
  percentage: number;

  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-10T12:34:56.000Z' })
  updatedAt: Date;
}
