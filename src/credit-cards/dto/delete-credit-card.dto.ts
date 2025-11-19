import { ApiProperty } from '@nestjs/swagger';

export class DeleteCardResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}
