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
  UseInterceptors,
} from '@nestjs/common';
import { AcademicPeriodService } from './academic-period.service';
import { CreateAcademicPeriodDto, SemesterEnum } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/academic-periods')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AcademicPeriodController {
  constructor(private readonly academicPeriodService: AcademicPeriodService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'academic_period' })
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
  @Audit({ resourceType: 'academic_period' })
  update(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.academicPeriodService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @Audit({ resourceType: 'academic_period' })
  remove(@Param('id') id: string) {
    return this.academicPeriodService.remove(id);
  }

  @Patch(':id/set-active')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'academic_period' })
  setActive(@Param('id') id: string) {
    return this.academicPeriodService.setActive(id);
  }
}
