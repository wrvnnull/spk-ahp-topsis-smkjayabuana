import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScoreDto } from './create-score.dto';

export class BulkScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScoreDto)
  scores: CreateScoreDto[];
}
