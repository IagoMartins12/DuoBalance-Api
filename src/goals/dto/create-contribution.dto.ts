import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateContributionDto {
  @IsOptional()
  @IsMongoId()
  goalId?: string;

  @IsOptional()
  @IsMongoId()
  dreamId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
