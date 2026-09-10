import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CriteriaService } from './criteria.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  @Post()
  @Roles('SUPER_ADMIN')
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCriteriaDto,
  ) {
    return this.criteriaService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.criteriaService.remove(id);
  }
}
