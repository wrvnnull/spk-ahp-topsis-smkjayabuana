import { PartialType } from '@nestjs/mapped-types';
import { IsUUID, IsString } from 'class-validator';
import { CreateScoreDto } from './create-score.dto';

export class UpdateScoreDto extends PartialType(CreateScoreDto) {
  @IsUUID()
  @IsString()
  id: string;
}
