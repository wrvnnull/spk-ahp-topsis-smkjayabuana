import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  UseInterceptors,
} from '@nestjs/common';
import { ScoreService } from './score.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { BulkScoresDto } from './dto/bulk-scores.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Audit } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/scores')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'KEPALA_SEKOLAH', 'GURU')
  async findAll(@Request() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    return this.scoreService.findByUserId(user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'GURU')
  @Audit({ resourceType: 'score' })
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateScoreDto) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    return this.scoreService.create(user, dto);
  }

  @Post('bulk')
  @Roles('SUPER_ADMIN', 'GURU')
  @Audit({ resourceType: 'score' })
  async bulkCreate(@Request() req: AuthenticatedRequest, @Body() dto: BulkScoresDto) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    return this.scoreService.bulkCreate(user, dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'GURU')
  @Audit({ resourceType: 'score' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateScoreDto,
  ) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    return this.scoreService.update(user, { ...dto, id });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'GURU')
  @Audit({ resourceType: 'score' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Tidak terautentikasi');
    return this.scoreService.remove(user, id);
  }
}
