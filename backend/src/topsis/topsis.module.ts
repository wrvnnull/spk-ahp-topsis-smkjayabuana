import { Module } from '@nestjs/common';
import { TopsisController } from './topsis.controller';
import { TopsisService } from './topsis.service';

@Module({
  controllers: [TopsisController],
  providers: [TopsisService],
  exports: [TopsisService],
})
export class TopsisModule {}
