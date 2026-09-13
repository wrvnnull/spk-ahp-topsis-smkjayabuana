import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'criteria' })
  create(@Body() dto: CreateCriteriaDto) {
    return this.criteriaService.create(dto);
  }

  @Get()
  findAll() {
    return this.criteriaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.criteriaService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'criteria' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCriteriaDto,
  ) {
    return this.criteriaService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'criteria' })
  remove(@Param('id') id: string) {
    return this.criteriaService.remove(id);
  }
}
