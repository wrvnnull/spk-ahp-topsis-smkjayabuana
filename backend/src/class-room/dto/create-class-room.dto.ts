import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateClassRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  academic_period_id: string;

  @IsUUID()
  @IsNotEmpty()
  wali_teacher_id: string;
}
