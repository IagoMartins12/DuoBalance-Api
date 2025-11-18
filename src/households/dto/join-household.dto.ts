import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinHouseholdDto {
  @ApiProperty({ example: 'ABCD1234' })
  @IsString()
  inviteCode: string;
}
