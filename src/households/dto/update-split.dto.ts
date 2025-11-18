import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { SplitMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { CustomSplitDto } from './custom-split.dto';

export class UpdateSplitDto {
  @ApiPropertyOptional({ enum: SplitMethod })
  @IsOptional()
  @IsEnum(SplitMethod)
  splitMethod?: SplitMethod;

  @ApiPropertyOptional({ type: CustomSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomSplitDto)
  customSplit?: CustomSplitDto;
}
