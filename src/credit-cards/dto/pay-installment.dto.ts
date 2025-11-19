import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayInstallmentDto {
  @ApiProperty({
    example: '2025-11-19',
    description: 'Data em que a parcela foi paga',
  })
  @IsDateString()
  paidAt: string;
}
