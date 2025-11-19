import { ApiProperty } from '@nestjs/swagger';
import { CardBrand } from '@prisma/client';

export class CreditCardResponseDto {
  @ApiProperty({ example: '673c4179e75b106b22af2c10' })
  id: string;

  @ApiProperty({ example: '673c40fae75b106b22af2b99' })
  userId: string;

  @ApiProperty({ example: 'Nubank Roxo' })
  name: string;

  @ApiProperty({ example: '1234', description: 'Últimos 4 dígitos do cartão.' })
  lastDigits: string;

  @ApiProperty({ enum: CardBrand })
  brand: CardBrand;

  @ApiProperty({ example: 5000 })
  limit: number;

  @ApiProperty({ example: 5, description: 'Dia de fechamento da fatura.' })
  closingDay: number;

  @ApiProperty({ example: 10, description: 'Dia de vencimento da fatura.' })
  dueDay: number;

  @ApiProperty({ example: '#8A05BE', nullable: true, required: false })
  color?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-11-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-11-10T12:34:56.000Z' })
  updatedAt: Date;
}
