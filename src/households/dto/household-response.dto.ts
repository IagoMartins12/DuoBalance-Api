import { ApiProperty } from '@nestjs/swagger';
import { SplitMethod } from '@prisma/client';

class HouseholdMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  photo?: string;

  @ApiProperty()
  color: string;
}

export class HouseholdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty({ enum: SplitMethod })
  splitMethod: SplitMethod;

  @ApiProperty({
    example: { user1Percentage: 70, user2Percentage: 30 },
    required: false,
  })
  customSplit?: {
    user1Percentage: number;
    user2Percentage: number;
  } | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [HouseholdMemberDto] })
  members: HouseholdMemberDto[];
}
