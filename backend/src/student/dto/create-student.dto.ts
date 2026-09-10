import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  class_id: string;

  @IsOptional()
  @IsString()
  student_code?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
