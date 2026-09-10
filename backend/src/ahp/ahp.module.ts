import { Module } from '@nestjs/common';
import { AhpController } from './ahp.controller';
import { AhpService } from './ahp.service';

@Module({
  controllers: [AhpController],
  providers: [AhpService],
  exports: [AhpService],
})
export class AhpModule {}
