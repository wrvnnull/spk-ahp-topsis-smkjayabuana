import { Module } from '@nestjs/common';
import { AhpController } from './ahp.controller';
import { AhpService } from './ahp.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AhpController],
  providers: [AhpService],
  exports: [AhpService],
})
export class AhpModule {}
