import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicPeriodDto, SemesterEnum } from './create-academic-period.dto';

export class UpdateAcademicPeriodDto extends PartialType(CreateAcademicPeriodDto) {}
