import { ApiProperty } from '@nestjs/swagger';

export class DeleteBudgetResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}
