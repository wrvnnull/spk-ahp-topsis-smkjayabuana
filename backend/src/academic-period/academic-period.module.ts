import { Module } from '@nestjs/common';
import { AcademicPeriodController } from './academic-period.controller';
import { AcademicPeriodService } from './academic-period.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AcademicPeriodController],
  providers: [AcademicPeriodService],
})
export class AcademicPeriodModule {}
