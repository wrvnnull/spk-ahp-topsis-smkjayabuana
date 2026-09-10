import { IsString, IsUUID, IsOptional } from 'class-validator';

export class TopsisCalculateDto {
  @IsUUID()
  @IsString()
  academic_period_id: string;

  @IsOptional()
  @IsUUID()
  @IsString()
  ahp_calculation_id?: string;
}
