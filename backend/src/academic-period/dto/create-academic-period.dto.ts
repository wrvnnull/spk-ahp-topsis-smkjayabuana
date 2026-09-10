import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum SemesterEnum {
  GANJIL = 'GANJIL',
  GENAP = 'GENAP',
}

export class CreateAcademicPeriodDto {
  @IsString()
  name: string;

  @IsString()
  school_year: string;

  @IsEnum(SemesterEnum)
  semester: SemesterEnum;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = false;
}
