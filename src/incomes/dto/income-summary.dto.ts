import { ApiProperty } from '@nestjs/swagger';

class UserIncomeSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  totalAmount: number;
}

export class IncomeMonthlySummaryDto {
  @ApiProperty()
  householdId: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  @ApiProperty()
  totalHouseholdAmount: number;

  @ApiProperty({ type: [UserIncomeSummaryDto] })
  users: UserIncomeSummaryDto[];
}
