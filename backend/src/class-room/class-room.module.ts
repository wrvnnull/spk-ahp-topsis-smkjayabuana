import { Module } from '@nestjs/common';
import { ClassRoomController } from './class-room.controller';
import { ClassRoomService } from './class-room.service';

@Module({
  controllers: [ClassRoomController],
  providers: [ClassRoomService],
})
export class ClassRoomModule {}
