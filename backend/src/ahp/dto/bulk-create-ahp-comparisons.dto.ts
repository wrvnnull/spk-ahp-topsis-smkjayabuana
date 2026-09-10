import { IsString, IsNumber, IsPositive, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAhpComparisonDto } from './create-ahp-comparison.dto';

export class BulkCreateAhpComparisonsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAhpComparisonDto)
  comparisons: CreateAhpComparisonDto[];
}
