import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { AhpService, AhpResult } from './ahp.service';
import { CreateAhpComparisonDto } from './dto/create-ahp-comparison.dto';
import { BulkCreateAhpComparisonsDto } from './dto/bulk-create-ahp-comparisons.dto';
import { AhpCalculateDto } from './dto/ahp-calculate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/ahp')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AhpController {
  constructor(private readonly ahpService: AhpService) {}

  // ========== CRUD Perbandingan ==========

  @Post('comparisons')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'ahp_comparison' })
  createComparison(
    @Body() dto: CreateAhpComparisonDto,
    @Param() req: AuthenticatedRequest,
  ) {
    return this.ahpService.createComparison(dto, req.user!.userId);
  }

  @Post('comparisons/bulk')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'ahp_comparison' })
  bulkCreateComparisons(
    @Body() dto: BulkCreateAhpComparisonsDto,
    @Param() req: AuthenticatedRequest,
  ) {
    return this.ahpService.bulkCreateComparisons(dto, req.user!.userId);
  }

  @Get('comparisons')
  @Roles('SUPER_ADMIN')
  getComparisons(@Query('academic_period_id') academicPeriodId: string) {
    // TODO: implement list comparisons (opsional, bisa ditambahkan nanti)
    // Untuk saat ini return placeholder
    return { message: 'Endpoint list comparisons belum diimplementasi. Gunakan /matrix untuk melihat matriks.' };
  }

  @Get('comparisons/matrix')
  @Roles('SUPER_ADMIN')
  getComparisonMatrix(@Query('academic_period_id') academicPeriodId: string) {
    if (!academicPeriodId) {
      throw new BadRequestException('academic_period_id wajib diisi');
    }
    return this.ahpService.getComparisonMatrix(academicPeriodId);
  }

  // ========== Perhitungan AHP ==========

  @Post('calculate')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'ahp_calculation' })
  calculate(
    @Body() dto: AhpCalculateDto,
    @Param() req: AuthenticatedRequest,
  ) {
    return this.ahpService.calculateAHP(dto, req.user!.userId);
  }

  // ========== Baca Hasil ==========

  @Get('calculations')
  @Roles('SUPER_ADMIN', 'KEPALA_SEKOLAH')
  getCalculations(
    @Query('academic_period_id') academicPeriodId?: string,
  ) {
    return this.ahpService.getCalculations(academicPeriodId);
  }

  @Get('calculations/:id')
  @Roles('SUPER_ADMIN', 'KEPALA_SEKOLAH')
  getCalculationById(@Param('id') id: string) {
    return this.ahpService.getCalculationById(id);
  }
}
