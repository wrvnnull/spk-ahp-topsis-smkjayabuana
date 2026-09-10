import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  getRandomIndex,
  normalizeMatrix,
  calculatePriorityVector,
  calculateLambdaMax,
  calculateCI,
  calculateCR,
} from './ahp-utils';
import { CreateAhpComparisonDto } from './dto/create-ahp-comparison.dto';
import { BulkCreateAhpComparisonsDto } from './dto/bulk-create-ahp-comparisons.dto';
import { AhpCalculateDto } from './dto/ahp-calculate.dto';

export interface AhpResult {
  weight_vector: Record<string, number>;
  ci: number;
  cr: number | null;
  ri: number;
  lambda_max: number;
  is_valid: boolean;
  n: number;
  calculation_id?: string;
}

@Injectable()
export class AhpService {
  constructor(private readonly prisma: PrismaService) {}

  async createComparison(dto: CreateAhpComparisonDto, userId: string) {
    if (dto.criteria_i_id === dto.criteria_j_id) {
      throw new BadRequestException(
        'criteria_i_id dan criteria_j_id tidak boleh sama (diagonal selalu 1)',
      );
    }

    if (dto.comparison_value < 1 || dto.comparison_value > 9) {
      throw new BadRequestException(
        `Nilai perbandingan harus antara 1 dan 9 (bukan ${dto.comparison_value})`,
      );
    }

    const criteriaI = await this.prisma.criteria.findUnique({
      where: { id: dto.criteria_i_id },
    });
    if (!criteriaI) {
      throw new NotFoundException(`Kriteria dengan ID ${dto.criteria_i_id} tidak ditemukan`);
    }
    if (!criteriaI.is_active) {
      throw new BadRequestException(
        `Kriteria ${criteriaI.code} tidak aktif, tidak dapat digunakan dalam perbandingan AHP`,
      );
    }

    const criteriaJ = await this.prisma.criteria.findUnique({
      where: { id: dto.criteria_j_id },
    });
    if (!criteriaJ) {
      throw new NotFoundException(`Kriteria dengan ID ${dto.criteria_j_id} tidak ditemukan`);
    }
    if (!criteriaJ.is_active) {
      throw new BadRequestException(
        `Kriteria ${criteriaJ.code} tidak aktif, tidak dapat digunakan dalam perbandingan AHP`,
      );
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academic_period_id },
    });
    if (!period) {
      throw new NotFoundException(
        `AcademicPeriod dengan ID ${dto.academic_period_id} tidak ditemukan`,
      );
    }

    const comparison = await this.prisma.ahpComparison.create({
      data: {
        academic_period_id: dto.academic_period_id,
        criteria_i_id: dto.criteria_i_id,
        criteria_j_id: dto.criteria_j_id,
        comparison_value: dto.comparison_value,
        created_by: userId,
      },
    });

    return comparison;
  }

  async bulkCreateComparisons(dto: BulkCreateAhpComparisonsDto, userId: string) {
    const results: any[] = [];

    for (const item of dto.comparisons) {
      try {
        const created = await this.createComparison(item, userId);
        results.push(created);
      } catch (error: any) {
        results.push({ error: error.message });
      }
    }

    const successCount = results.filter((r: any) => !r.error).length;
    const errorCount = results.filter((r: any) => r.error).length;

    return {
      results,
      summary: {
        total: dto.comparisons.length,
        success: successCount,
        errors: errorCount,
      },
    };
  }

  async getComparisonMatrix(academicPeriodId: string) {
    const criteria = await this.prisma.criteria.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' },
    });

    if (criteria.length === 0) {
      throw new BadRequestException(
        'Tidak ada kriteria aktif. Buat kriteria terlebih dahulu sebelum input matriks AHP.',
      );
    }

    const comparisons = await this.prisma.ahpComparison.findMany({
      where: { academic_period_id: academicPeriodId },
      include: {
        criteriaI: { select: { id: true, code: true } },
        criteriaJ: { select: { id: true, code: true } },
      },
      orderBy: [
        { criteriaI: { code: 'asc' } },
        { criteriaJ: { code: 'asc' } },
      ],
    });

    const n = criteria.length;
    const matrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = 0;
      }
    }

    for (const comp of comparisons) {
      const iIdx = criteria.findIndex((c) => c.id === comp.criteria_i_id);
      const jIdx = criteria.findIndex((c) => c.id === comp.criteria_j_id);
      if (iIdx === -1 || jIdx === -1) continue;

      matrix[iIdx][jIdx] = comp.comparison_value;

      if (iIdx !== jIdx && matrix[jIdx][iIdx] === 0) {
        matrix[jIdx][iIdx] = 1 / comp.comparison_value;
      }
    }

    for (let i = 0; i < n; i++) {
      if (matrix[i][i] === 0) {
        matrix[i][i] = 1;
      }
    }

    const missing: string[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (matrix[i][j] === 0) {
          missing.push(`(${criteria[i].code}, ${criteria[j].code})`);
        }
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Matriks tidak lengkap. Sel yang masih kosong: ${missing.join(', ')}. Silakan lengkapi perbandingan berpasangan.`,
      );
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] <= 0) {
          throw new BadRequestException(
            `Nilai A[${i + 1}][${j + 1}] harus positif (nilai: ${matrix[i][j]})`,
          );
        }
      }
    }

    return {
      criteria,
      matrix,
      n,
      comparisons_count: comparisons.length,
    };
  }

  async calculateAHP(dto: AhpCalculateDto, userId: string): Promise<AhpResult> {
    const criteria = await this.prisma.criteria.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' },
    });

    const n = criteria.length;

    if (n < 2) {
      throw new BadRequestException(
        `Jumlah kriteria aktif harus minimal 2 untuk perhitungan AHP (saat ini: ${n})`,
      );
    }

    const comparisons = await this.prisma.ahpComparison.findMany({
      where: { academic_period_id: dto.academic_period_id },
    });

    const compMap = new Map<string, number>();
    for (const comp of comparisons) {
      const key = `${comp.criteria_i_id}|${comp.criteria_j_id}`;
      compMap.set(key, comp.comparison_value);
    }

    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const key = `${criteria[i].id}|${criteria[j].id}`;
          const revKey = `${criteria[j].id}|${criteria[i].id}`;
          if (compMap.has(key)) {
            matrix[i][j] = compMap.get(key)!;
          } else if (compMap.has(revKey)) {
            matrix[i][j] = 1 / compMap.get(revKey)!;
          } else {
            throw new BadRequestException(
              `Perbandingan antara ${criteria[i].code} dan ${criteria[j].code} tidak ditemukan. Silakan lengkapi semua pasangan.`,
            );
          }
        }
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] <= 0) {
          throw new BadRequestException(
            `Nilai A[${i + 1}][${j + 1}] harus positif`,
          );
        }
      }
    }

    const normalized = normalizeMatrix(matrix, n);
    const weights = calculatePriorityVector(normalized, n);
    const lambdaMax = calculateLambdaMax(matrix, weights, n);
    const ci = calculateCI(lambdaMax, n);
    const ri = getRandomIndex(n);
    const cr = calculateCR(ci, ri, n);

    let is_valid: boolean;
    if (n === 2) {
      is_valid = true;
    } else if (cr === null) {
      is_valid = false;
    } else {
      is_valid = cr <= 0.10;
    }

    const weight_vector: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      weight_vector[criteria[i].code] = Math.round(weights[i] * 10000) / 10000;
    }

    const result: AhpResult = {
      weight_vector,
      ci,
      cr,
      ri,
      lambda_max: lambdaMax,
      is_valid,
      n,
    };

    const calculation = await this.prisma.ahpCalculation.create({
      data: {
        academic_period_id: dto.academic_period_id,
        ci: result.ci,
        cr: result.cr ?? 0,
        ri: result.ri,
        weight_vector: result.weight_vector,
        is_valid: result.is_valid,
        created_by: userId,
      },
    });

    return {
      ...result,
      calculation_id: calculation.id,
    };
  }

  async getCalculations(academicPeriodId?: string) {
    const where: any = {};
    if (academicPeriodId) {
      where.academic_period_id = academicPeriodId;
    }

    const calculations = await this.prisma.ahpCalculation.findMany({
      where,
      orderBy: { calculated_at: 'desc' },
      include: {
        academicPeriod: { select: { id: true, name: true } },
      },
    });

    return calculations.map((c) => ({
      id: c.id,
      academic_period_id: c.academic_period_id,
      academic_period_name: c.academicPeriod?.name ?? null,
      calculated_at: c.calculated_at,
      ci: c.ci,
      cr: c.cr,
      ri: c.ri,
      weight_vector: c.weight_vector as Record<string, number>,
      is_valid: c.is_valid,
      created_by: c.created_by,
    }));
  }

  async getCalculationById(id: string) {
    const calculation = await this.prisma.ahpCalculation.findUnique({
      where: { id },
      include: {
        academicPeriod: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!calculation) {
      throw new NotFoundException(`AHP Calculation dengan ID ${id} tidak ditemukan`);
    }

    return {
      id: calculation.id,
      academic_period_id: calculation.academic_period_id,
      academic_period_name: calculation.academicPeriod?.name ?? null,
      calculated_at: calculation.calculated_at,
      ci: calculation.ci,
      cr: calculation.cr,
      ri: calculation.ri,
      weight_vector: calculation.weight_vector as Record<string, number>,
      is_valid: calculation.is_valid,
      created_by: calculation.created_by,
      created_by_user: calculation.createdByUser
        ? {
            id: calculation.createdByUser.id,
            name: calculation.createdByUser.name,
            email: calculation.createdByUser.email,
          }
        : null,
    };
  }
}
