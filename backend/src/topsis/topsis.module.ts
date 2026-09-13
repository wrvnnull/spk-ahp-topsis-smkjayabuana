import { Module } from '@nestjs/common';
import { TopsisController } from './topsis.controller';
import { TopsisService } from './topsis.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TopsisController],
  providers: [TopsisService],
  exports: [TopsisService],
})
export class TopsisModule {}
