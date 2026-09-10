import { IsUUID, IsString } from 'class-validator';

export class AhpCalculateDto {
  @IsUUID()
  @IsString()
  academic_period_id: string;
}
