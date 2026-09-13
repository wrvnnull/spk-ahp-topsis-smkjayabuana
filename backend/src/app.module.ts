import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CriteriaModule } from './criteria/criteria.module';
import { AcademicPeriodModule } from './academic-period/academic-period.module';
import { AhpModule } from './ahp/ahp.module';
import { TopsisModule } from './topsis/topsis.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    CriteriaModule,
    AcademicPeriodModule,
    AhpModule,
    TopsisModule,
  ],
})
export class AppModule {}
