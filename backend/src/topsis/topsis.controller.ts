import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TopsisService } from './topsis.service';
import { TopsisCalculateDto } from './dto/topsis-calculate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/topsis')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class TopsisController {
  constructor(private readonly topsisService: TopsisService) {}

  @Post('calculate')
  @Roles('SUPER_ADMIN')
  @Audit({ resourceType: 'topsis_calculation' })
  calculate(
    @Body() dto: TopsisCalculateDto,
    @Param() req: AuthenticatedRequest,
  ) {
    return this.topsisService.calculateTopsis(dto, req.user!.userId);
  }

  @Get('calculations/:id')
  @Roles('SUPER_ADMIN', 'KEPALA_SEKOLAH')
  getCalculationById(@Param('id') id: string) {
    return this.topsisService.getCalculationById(id);
  }

  @Get('ranking')
  @Roles('SUPER_ADMIN', 'KEPALA_SEKOLAH', 'GURU')
  async getRanking(
    @Query('academic_period_id') academicPeriodId: string,
    @Param() req: AuthenticatedRequest,
  ) {
    // GURU hanya bisa melihat ranking untuk kelasnya sendiri
    if (req.user?.role === 'GURU') {
      return this.topsisService.getRankingForGuru(academicPeriodId, req.user.ownedClassIds);
    }
    return this.topsisService.getRanking(academicPeriodId);
  }
}
