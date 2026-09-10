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
} from '@nestjs/common';
import { AcademicPeriodService } from './academic-period.service';
import { CreateAcademicPeriodDto, SemesterEnum } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('api/academic-periods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicPeriodController {
  constructor(private readonly academicPeriodService: AcademicPeriodService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateAcademicPeriodDto) {
    return this.academicPeriodService.create(dto);
  }

  @Get()
  findAll() {
    return this.academicPeriodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicPeriodService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.academicPeriodService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.academicPeriodService.remove(id);
  }

  @Patch(':id/set-active')
  @Roles('SUPER_ADMIN')
  setActive(@Param('id') id: string) {
    return this.academicPeriodService.setActive(id);
  }
}
