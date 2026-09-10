import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('api/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'GURU')
  create(
    @Body() dto: CreateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.create(dto, req);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.studentService.findAll(req);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.findOne(id, req);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'GURU')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.update(id, dto, req);
  }

  @Get(':id/scores')
  getScores(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.getScores(id, req);
  }
}
