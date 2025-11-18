import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SplitMethod } from '@prisma/client';
import { CustomSplitDto } from './custom-split.dto';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Casa João & Maria' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: SplitMethod, default: SplitMethod.FIFTY_FIFTY })
  @IsOptional()
  @IsEnum(SplitMethod)
  splitMethod?: SplitMethod;

  @ApiPropertyOptional({ type: CustomSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomSplitDto)
  customSplit?: CustomSplitDto;
}
