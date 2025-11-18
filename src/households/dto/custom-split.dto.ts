import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class CustomSplitDto {
  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  user1Percentage: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  user2Percentage: number;
}
