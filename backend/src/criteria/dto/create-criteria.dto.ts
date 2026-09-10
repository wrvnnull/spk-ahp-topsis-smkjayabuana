import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateCriteriaDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsIn(['BENEFIT', 'COST'])
  type: 'BENEFIT' | 'COST';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
