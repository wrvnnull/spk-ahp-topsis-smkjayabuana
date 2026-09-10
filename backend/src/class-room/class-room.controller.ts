import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ClassRoomService } from './class-room.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('api/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassRoomController {
  constructor(private readonly classRoomService: ClassRoomService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(
    @Body() dto: CreateClassRoomDto,
    @Request() req: any,
  ) {
    return this.classRoomService.create(dto, req.user.role);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.classRoomService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.classRoomService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassRoomDto,
    @Request() req: any,
  ) {
    return this.classRoomService.update(id, dto, req.user.role);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.classRoomService.remove(id, req.user.role);
  }
}
