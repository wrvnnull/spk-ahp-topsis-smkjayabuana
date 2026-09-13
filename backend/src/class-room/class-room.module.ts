import { Module } from '@nestjs/common';
import { ClassRoomController } from './class-room.controller';
import { ClassRoomService } from './class-room.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ClassRoomController],
  providers: [ClassRoomService],
})
export class ClassRoomModule {}
