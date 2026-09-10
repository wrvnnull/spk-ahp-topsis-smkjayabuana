import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CriteriaModule } from './criteria/criteria.module';
import { AcademicPeriodModule } from './academic-period/academic-period.module';
import { AhpModule } from './ahp/ahp.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CriteriaModule,
    AcademicPeriodModule,
    AhpModule,
  ],
})
export class AppModule {}
