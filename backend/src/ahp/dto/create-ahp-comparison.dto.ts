import { IsString, IsNumber, IsPositive, IsUUID, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAhpComparisonDto {
  @IsUUID()
  @IsString()
  academic_period_id: string;

  @IsUUID()
  @IsString()
  criteria_i_id: string;

  @IsUUID()
  @IsString()
  criteria_j_id: string;

  @IsNumber()
  @IsPositive()
  comparison_value: number;
}
