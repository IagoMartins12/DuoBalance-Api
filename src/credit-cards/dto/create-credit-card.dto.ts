import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { CardBrand } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCreditCardDto {
  @ApiProperty({ example: 'Nubank Roxo' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  lastDigits: string;

  @ApiProperty({ enum: CardBrand })
  @IsEnum(CardBrand)
  brand: CardBrand;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  limit: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @ApiProperty({
    example: '#8A05BE',
    required: false,
    description: 'Cor visual associada ao cartão',
  })
  @IsOptional()
  @IsString()
  color?: string;
}
