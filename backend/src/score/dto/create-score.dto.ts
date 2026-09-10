import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateScoreDto {
  @IsUUID()
  @IsString()
  student_id: string;

  @IsUUID()
  @IsString()
  criteria_id: string;

  @IsUUID()
  @IsString()
  academic_period_id: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsBoolean()
  is_missing?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
