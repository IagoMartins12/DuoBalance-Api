import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, Min, IsOptional } from 'class-validator';

export class AddTransactionDto {
  @ApiProperty({ example: 150.9 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Compra no Mercado' })
  @IsString()
  description: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  totalInstallments: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  currentInstallment?: number;

  @ApiProperty({
    example: '2025-11-19',
    required: false,
    description: 'Data da compra',
  })
  @IsOptional()
  date?: Date;
}
