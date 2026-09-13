import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TopsisCalculateDto } from './dto/topsis-calculate.dto';

export interface TopsisResult {
  ranking: Array<{ student_code: string; rank: number; nilai_preferensi: number }>;
  summary: {
    M: number;
    N: number;
    siswa_terlibat: number;
    siswa_excluded_missing: number;
    list_siswa_excluded: string[];
    ahp_calculation_id: string;
    academic_period_id: string;
  };
  snapshot: {
    decision_matrix: Record<string, Record<string, number>>;
    normalized_matrix: Record<string, Record<string, number>>;
    weighted_matrix: Record<string, Record<string, number>>;
    ideal_positive: Record<string, number>;
    ideal_negative: Record<string, number>;
    distance_positive: Record<string, number>;
    distance_negative: Record<string, number>;
    preference_value: Record<string, number>;
    rank: Record<string, number>;
  };
  id: string;
  academic_period_id: string;
  calculated_at: Date;
}

@Injectable()
export class TopsisService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateTopsis(dto: TopsisCalculateDto, userId: string): Promise<TopsisResult> {
    // 1. Validasi academic period
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academic_period_id },
    });
    if (!period) {
      throw new NotFoundException(`AcademicPeriod dengan ID ${dto.academic_period_id} tidak ditemukan`);
    }

    // 2. Ambil kriteria aktif
    const criteria = await this.prisma.criteria.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' },
    });
    if (criteria.length === 0) {
      throw new BadRequestException('Tidak ada kriteria aktif untuk perhitungan TOPSIS');
    }

    const n = criteria.length;
    const kriteriaCodes = criteria.map((c) => c.code);
    const kriteriaTypes = criteria.reduce<Record<string, 'BENEFIT' | 'COST'>>((acc, c) => {
      acc[c.code] = c.type;
      return acc;
    }, {});

    // 3. Ambil bobot AHP valid
    const bobotResult = await this.ambilBobotAHP(dto.academic_period_id, dto.ahp_calculation_id);
    if (!bobotResult) {
      throw new BadRequestException('Bobot AHP tidak tersedia atau tidak valid. Lakukan perhitungan AHP terlebih dahulu.');
    }
    const bobotAHP = bobotResult.weight_vector;

    // 4. Validasi bobot lengkap untuk semua kriteria aktif
    for (const code of kriteriaCodes) {
      if (bobotAHP[code] === undefined) {
        throw new BadRequestException(`Missing bobot AHP untuk kriteria '${code}'. Pastikan semua kriteria aktif memiliki bobot.`);
      }
    }

    // 5. Ambil siswa dari kelas-kelas di periode ini
    const students = await this.prisma.student.findMany({
      where: {
        is_active: true,
        class: { academic_period_id: dto.academic_period_id },
      },
      select: { id: true, student_code: true },
      orderBy: { student_code: 'asc' },
    });

    // 6. Ambil nilai siswa
    const scores = await this.prisma.score.findMany({
      where: {
        student_id: { in: students.map((s) => s.id) },
        criteria_id: { in: criteria.map((c) => c.id) },
        academic_period_id: dto.academic_period_id,
      },
      include: {
        criteria: { select: { id: true, code: true, type: true } },
        student: { select: { id: true, student_code: true } },
      },
    });

    // 7. Build map nilai: student_code → { criteria_code: { value, is_missing } }
    const nilaiMap: Record<string, Record<string, { value: number; is_missing: boolean }>> = {};
    for (const s of students) {
      if (s.student_code) nilaiMap[s.student_code] = {};
    }
    for (const score of scores) {
      const sc = score.student.student_code;
      if (!sc || !nilaiMap[sc]) continue;
      nilaiMap[sc][score.criteria.code] = { value: score.value, is_missing: score.is_missing };
    }

    // 8. Identifikasi siswa valid (tanpa missing value untuk kriteria aktif)
    const siswaValid: string[] = [];
    const siswaExcluded: string[] = [];
    for (const [studentCode, vals] of Object.entries(nilaiMap)) {
      let missing = false;
      for (const code of kriteriaCodes) {
        const entry = vals[code];
        if (!entry || entry.is_missing || entry.value === null) { missing = true; break; }
      }
      if (missing) siswaExcluded.push(studentCode);
      else siswaValid.push(studentCode);
    }

    const m = siswaValid.length;
    if (m === 0) {
      throw new BadRequestException(
        `Tidak ada siswa dengan nilai lengkap untuk perhitungan TOPSIS. ` +
        `Siswa yang excluded: ${siswaExcluded.join(', ') || 'semua siswa'}`,
      );
    }

    // 9. Build matriks X (M x N)
    const X: number[][] = siswaValid.map((sc) =>
      kriteriaCodes.map((code) => nilaiMap[sc][code].value),
    );

    // 10. Normalisasi vektor
    const R = this.normalisasiVektor(X, n, m);

    // 11. Matriks terbobot
    const V = this.matriksTerbobot(R, n, m, kriteriaCodes, bobotAHP);

    // 12. Solusi ideal positif dan negatif
    const Aplus = this.solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, true);
    const Aminus = this.solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, false);

    // 13. Jarak Euclidean
    const Dplus = this.jarakEuclidean(V, n, m, kriteriaCodes, Aplus);
    const Dminus = this.jarakEuclidean(V, n, m, kriteriaCodes, Aminus);

    // 14. Nilai preferensi
    const Vi = this.nilaiPreferensi(Dplus, Dminus, m);

    // 15. Ranking (descending Vi)
    const rankingPairs: Array<{ student_code: string; nilai_preferensi: number }> = [];
    for (let i = 0; i < m; i++) {
      rankingPairs.push({ student_code: siswaValid[i], nilai_preferensi: Vi[i] });
    }
    rankingPairs.sort((a, b) => b.nilai_preferensi - a.nilai_preferensi);

    const rankDict: Record<string, number> = {};
    const ranking: Array<{ student_code: string; rank: number; nilai_preferensi: number }> = [];
    for (let i = 0; i < rankingPairs.length; i++) {
      rankDict[rankingPairs[i].student_code] = i + 1;
      ranking.push({
        student_code: rankingPairs[i].student_code,
        rank: i + 1,
        nilai_preferensi: Math.round(rankingPairs[i].nilai_preferensi * 100000) / 100000,
      });
    }

    // 16. Format snapshot untuk reproducibility
    const decisionMatrix: Record<string, Record<string, number>> = {};
    const normalizedMatrix: Record<string, Record<string, number>> = {};
    const weightedMatrix: Record<string, Record<string, number>> = {};
    const distancePositive: Record<string, number> = {};
    const distanceNegative: Record<string, number> = {};
    const preferenceValue: Record<string, number> = {};

    for (let i = 0; i < m; i++) {
      const sc = siswaValid[i];
      decisionMatrix[sc] = {};
      normalizedMatrix[sc] = {};
      weightedMatrix[sc] = {};
      for (let j = 0; j < n; j++) {
        decisionMatrix[sc][kriteriaCodes[j]] = X[i][j];
        normalizedMatrix[sc][kriteriaCodes[j]] = Math.round(R[i][j] * 100000) / 100000;
        weightedMatrix[sc][kriteriaCodes[j]] = Math.round(V[i][j] * 100000) / 100000;
      }
      distancePositive[sc] = Math.round(Dplus[i] * 100000) / 100000;
      distanceNegative[sc] = Math.round(Dminus[i] * 100000) / 100000;
      preferenceValue[sc] = Math.round(Vi[i] * 100000) / 100000;
    }

    // 17. Simpan ke database (snapshot untuk reproducibility)
    // Idempotent: jika sudah ada untuk period + AHP calculation ini, return existing
    const existing = await this.prisma.topsisCalculation.findUnique({
      where: {
        academic_period_id_ahp_calculation_id: {
          academic_period_id: dto.academic_period_id,
          ahp_calculation_id: bobotResult.id,
        },
      },
      include: {
        academicPeriod: { select: { id: true, name: true } },
        ahpCalculation: { select: { id: true, weight_vector: true, is_valid: true, ci: true, cr: true, ri: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (existing) {
      // Kembalikan existing record sebagai TopsisResult
      const rank = existing.rank as Record<string, number> ?? {};
      const preferenceValue = existing.preference_value as Record<string, number> ?? {};
      const ranking: Array<{ student_code: string; rank: number; nilai_preferensi: number }> = [];
      const sortedKeys = Object.keys(rank).sort((a, b) => rank[a] - rank[b]);
      for (const key of sortedKeys) {
        ranking.push({
          student_code: key,
          rank: rank[key],
          nilai_preferensi: preferenceValue[key] ?? 0,
        });
      }
      return {
        ranking,
        summary: {
          M: ranking.length,
          N: n,
          siswa_terlibat: ranking.length,
          siswa_excluded_missing: 0,
          list_siswa_excluded: [],
          ahp_calculation_id: bobotResult.id,
          academic_period_id: dto.academic_period_id,
        },
        snapshot: {
          decision_matrix: existing.decision_matrix as Record<string, Record<string, number>> ?? {},
          normalized_matrix: existing.normalized_matrix as Record<string, Record<string, number>> ?? {},
          weighted_matrix: existing.weighted_matrix as Record<string, Record<string, number>> ?? {},
          ideal_positive: existing.ideal_positive as Record<string, number> ?? {},
          ideal_negative: existing.ideal_negative as Record<string, number> ?? {},
          distance_positive: existing.distance_positive as Record<string, number> ?? {},
          distance_negative: existing.distance_negative as Record<string, number> ?? {},
          preference_value: existing.preference_value as Record<string, number> ?? {},
          rank: rank,
        },
        id: existing.id,
        academic_period_id: existing.academic_period_id,
        calculated_at: existing.calculated_at,
      };
    }

    const topsisCalc = await this.prisma.topsisCalculation.create({
      data: {
        academic_period_id: dto.academic_period_id,
        ahp_calculation_id: bobotResult.id,
        decision_matrix: decisionMatrix,
        normalized_matrix: normalizedMatrix,
        weighted_matrix: weightedMatrix,
        ideal_positive: Aplus,
        ideal_negative: Aminus,
        distance_positive: distancePositive,
        distance_negative: distanceNegative,
        preference_value: preferenceValue,
        rank: rankDict,
        created_by: userId,
      },
    });

    return {
      ranking,
      summary: {
        M: m,
        N: n,
        siswa_terlibat: m,
        siswa_excluded_missing: siswaExcluded.length,
        list_siswa_excluded: siswaExcluded,
        ahp_calculation_id: bobotResult.id,
        academic_period_id: dto.academic_period_id,
      },
      snapshot: {
        decision_matrix: decisionMatrix,
        normalized_matrix: normalizedMatrix,
        weighted_matrix: weightedMatrix,
        ideal_positive: Aplus,
        ideal_negative: Aminus,
        distance_positive: distancePositive,
        distance_negative: distanceNegative,
        preference_value: preferenceValue,
        rank: rankDict,
      },
      id: topsisCalc.id,
      academic_period_id: dto.academic_period_id,
      calculated_at: topsisCalc.calculated_at,
    };
  }

  private async ambilBobotAHP(
    academic_period_id: string,
    ahp_calculation_id?: string,
  ): Promise<{ id: string; weight_vector: Record<string, number> } | null> {
    if (ahp_calculation_id) {
      const calc = await this.prisma.ahpCalculation.findUnique({
        where: { id: ahp_calculation_id },
        include: { academicPeriod: { select: { id: true } } },
      });
      if (!calc || calc.academicPeriod.id !== academic_period_id) {
        throw new BadRequestException('ahp_calculation_id tidak ditemukan atau tidak sesuai periode');
      }
      if (!calc.is_valid) {
        throw new BadRequestException(`AHP calculation dengan ID ${ahp_calculation_id} tidak valid (CR > 0.10)`);
      }
      return { id: calc.id, weight_vector: calc.weight_vector as Record<string, number> };
    }
    const calc = await this.prisma.ahpCalculation.findFirst({
      where: { academic_period_id, is_valid: true },
      orderBy: { calculated_at: 'desc' },
    });
    if (!calc) return null;
    return { id: calc.id, weight_vector: calc.weight_vector as Record<string, number> };
  }

  /** Normalisasi vektor: r_ij = x_ij / ||X_j||, jika ||X_j|| = 0 maka r_ij = 0 */
  private normalisasiVektor(X: number[][], n: number, m: number): number[][] {
    const R: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      let sumSq = 0;
      for (let i = 0; i < m; i++) sumSq += X[i][j] * X[i][j];
      const norm = Math.sqrt(sumSq);
      if (norm === 0) continue;
      for (let i = 0; i < m; i++) R[i][j] = X[i][j] / norm;
    }
    return R;
  }

  /** Matriks terbobot: v_ij = r_ij × w_j */
  private matriksTerbobot(
    R: number[][], n: number, m: number, kriteriaCodes: string[], bobotAHP: Record<string, number>,
  ): number[][] {
    const V: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        V[i][j] = R[i][j] * bobotAHP[kriteriaCodes[j]];
      }
    }
    return V;
  }

  /** Solusi ideal: jika isPositive=true → benefit=max/cost=min, jika false → benefit=min/cost=max */
  private solusiIdeal(
    V: number[][], n: number, m: number, kriteriaCodes: string[],
    kriteriaTypes: Record<string, 'BENEFIT' | 'COST'>, isPositive: boolean,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (let j = 0; j < n; j++) {
      const code = kriteriaCodes[j];
      const type = kriteriaTypes[code];
      const vals = Array.from({ length: m }, (_, i) => V[i][j]);
      result[code] = isPositive
        ? (type === 'BENEFIT' ? Math.max(...vals) : Math.min(...vals))
        : (type === 'BENEFIT' ? Math.min(...vals) : Math.max(...vals));
    }
    return result;
  }

  /** Jarak Euclidean: D_i = sqrt(Σ(v_ij - ideal_j)²) */
  private jarakEuclidean(
    V: number[][], n: number, m: number, kriteriaCodes: string[], ideal: Record<string, number>,
  ): number[] {
    const D: number[] = [];
    for (let i = 0; i < m; i++) {
      let sumSq = 0;
      for (let j = 0; j < n; j++) {
        const diff = V[i][j] - ideal[kriteriaCodes[j]];
        sumSq += diff * diff;
      }
      D.push(Math.sqrt(sumSq));
    }
    return D;
  }

  /** Nilai preferensi: Vi = Dminus_i / (Dplus_i + Dminus_i), jika denominator=0 maka 0 */
  private nilaiPreferensi(Dplus: number[], Dminus: number[], m: number): number[] {
    const Vi: number[] = [];
    for (let i = 0; i < m; i++) {
      const denom = Dplus[i] + Dminus[i];
      Vi.push(denom === 0 ? 0 : Dminus[i] / denom);
    }
    return Vi;
  }

  // ==================== Read Hasil ====================

  async getCalculationById(id: string) {
    const calculation = await this.prisma.topsisCalculation.findUnique({
      where: { id },
      include: {
        academicPeriod: { select: { id: true, name: true } },
        ahpCalculation: { select: { id: true, weight_vector: true, is_valid: true, ci: true, cr: true, ri: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!calculation) {
      throw new NotFoundException(`TOPSIS Calculation dengan ID ${id} tidak ditemukan`);
    }

    return {
      id: calculation.id,
      academic_period_id: calculation.academic_period_id,
      academic_period_name: calculation.academicPeriod?.name ?? null,
      ahp_calculation_id: calculation.ahp_calculation_id,
      ahp: calculation.ahpCalculation ? {
        id: calculation.ahpCalculation.id,
        weight_vector: calculation.ahpCalculation.weight_vector as Record<string, number>,
        is_valid: calculation.ahpCalculation.is_valid,
        ci: calculation.ahpCalculation.ci,
        cr: calculation.ahpCalculation.cr,
        ri: calculation.ahpCalculation.ri,
      } : null,
      calculated_at: calculation.calculated_at,
      decision_matrix: calculation.decision_matrix as Record<string, Record<string, number>> ?? null,
      normalized_matrix: calculation.normalized_matrix as Record<string, Record<string, number>> ?? null,
      weighted_matrix: calculation.weighted_matrix as Record<string, Record<string, number>> ?? null,
      ideal_positive: calculation.ideal_positive as Record<string, number> ?? null,
      ideal_negative: calculation.ideal_negative as Record<string, number> ?? null,
      distance_positive: calculation.distance_positive as Record<string, number> ?? null,
      distance_negative: calculation.distance_negative as Record<string, number> ?? null,
      preference_value: calculation.preference_value as Record<string, number> ?? null,
      rank: calculation.rank as Record<string, number> ?? null,
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

  async getRanking(academicPeriodId?: string) {
    const where: any = {};
    if (academicPeriodId) {
      where.academic_period_id = academicPeriodId;
    }

    const calculations = await this.prisma.topsisCalculation.findMany({
      where,
      orderBy: { calculated_at: 'desc' },
      include: {
        academicPeriod: { select: { id: true, name: true } },
        ahpCalculation: { select: { id: true, weight_vector: true, is_valid: true, ci: true, cr: true, ri: true } },
      },
    });

    return calculations.map((c) => ({
      id: c.id,
      academic_period_id: c.academic_period_id,
      academic_period_name: c.academicPeriod?.name ?? null,
      ahp_calculation_id: c.ahp_calculation_id,
      ahp: c.ahpCalculation ? {
        id: c.ahpCalculation.id,
        weight_vector: c.ahpCalculation.weight_vector as Record<string, number>,
        is_valid: c.ahpCalculation.is_valid,
        ci: c.ahpCalculation.ci,
        cr: c.ahpCalculation.cr,
        ri: c.ahpCalculation.ri,
      } : null,
      calculated_at: c.calculated_at,
      rank: c.rank as Record<string, number> ?? null,
      preference_value: c.preference_value as Record<string, number> ?? null,
    }));
  }

  async getRankingForGuru(academicPeriodId: string | undefined, ownedClassIds: string[] | undefined) {
    const where: any = {};
    if (academicPeriodId) {
      where.academic_period_id = academicPeriodId;
    }

    const calculations = await this.prisma.topsisCalculation.findMany({
      where,
      orderBy: { calculated_at: 'desc' },
      include: {
        academicPeriod: { select: { id: true, name: true } },
        ahpCalculation: { select: { id: true, weight_vector: true, is_valid: true, ci: true, cr: true, ri: true } },
      },
    });

    // Filter ranking berdasarkan kelas guru
    const results = calculations.map((c) => {
      const rank = c.rank as Record<string, number> ?? {};
      const preferenceValue = c.preference_value as Record<string, number> ?? {};

      // Ambil student_code yang valid untuk kelas guru
      return {
        id: c.id,
        academic_period_id: c.academic_period_id,
        academic_period_name: c.academicPeriod?.name ?? null,
        ahp_calculation_id: c.ahp_calculation_id,
        ahp: c.ahpCalculation ? {
          id: c.ahpCalculation.id,
          weight_vector: c.ahpCalculation.weight_vector as Record<string, number>,
          is_valid: c.ahpCalculation.is_valid,
          ci: c.ahpCalculation.ci,
          cr: c.ahpCalculation.cr,
          ri: c.ahpCalculation.ri,
        } : null,
        calculated_at: c.calculated_at,
        rank: rank,
        preference_value: preferenceValue,
        // Guru hanya melihat snapshot, tapi filtering dilakukan di sisi lain
        // Saat ini kita kembalikan semua, tapi frontend/GuruService akan filter
      };
    });

    return results;
  }
}
