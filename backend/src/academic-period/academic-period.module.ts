import { Module } from '@nestjs/common';
import { AcademicPeriodController } from './academic-period.controller';
import { AcademicPeriodService } from './academic-period.service';

@Module({
  controllers: [AcademicPeriodController],
  providers: [AcademicPeriodService],
})
export class AcademicPeriodModule {}
