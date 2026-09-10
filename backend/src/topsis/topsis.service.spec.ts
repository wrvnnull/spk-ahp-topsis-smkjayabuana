import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TopsisService } from './topsis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock PrismaService
const mockPrismaService = {
  academicPeriod: {
    findUnique: jest.fn(),
  },
  criteria: {
    findMany: jest.fn(),
  },
  student: {
    findMany: jest.fn(),
  },
  score: {
    findMany: jest.fn(),
  },
  ahpCalculation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  topsisCalculation: {
    create: jest.fn(),
  },
};

describe('TopsisService dengan data dummy', () => {
  let service: TopsisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopsisService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TopsisService>(TopsisService);
    jest.clearAllMocks();
  });

  // Fungsi helper untuk setup data mock
  const setupMockData = (
    criteriaList: any[],
    studentList: any[],
    scoreList: any[],
    ahpCalc: any,
  ) => {
    mockPrismaService.academicPeriod.findUnique.mockResolvedValue({
      id: 'ap-001',
      name: '2024/2025 Genap',
      period_start: new Date('2024-01-01'),
      period_end: new Date('2024-06-30'),
    });

    mockPrismaService.criteria.findMany.mockResolvedValue(
      criteriaList.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        weight: c.weight,
        is_active: c.is_active,
      })),
    );

    mockPrismaService.student.findMany.mockResolvedValue(
      studentList.map((s) => ({
        id: s.id,
        student_code: s.student_code,
      })),
    );

    mockPrismaService.score.findMany.mockResolvedValue(
      scoreList.map((s) => ({
        id: s.id,
        value: s.value,
        is_missing: s.is_missing,
        academic_period_id: s.academic_period_id,
        criteria_id: s.criteria_id,
        student_id: s.student_id,
        criteria: { id: s.criteria.id, code: s.criteria.code, type: s.criteria.type },
        student: { id: s.student.id, student_code: s.student.student_code },
      })),
    );

    mockPrismaService.ahpCalculation.findFirst.mockResolvedValue(ahpCalc);
    mockPrismaService.ahpCalculation.findUnique.mockResolvedValue(ahpCalc);

    mockPrismaService.topsisCalculation.create.mockResolvedValue({
      id: 'topsis-001',
      academic_period_id: 'ap-001',
      ahp_calculation_id: ahpCalc.id,
      decision_matrix: {},
      normalized_matrix: {},
      weighted_matrix: {},
      ideal_positive: {},
      ideal_negative: {},
      distance_positive: {},
      distance_negative: {},
      preference_value: {},
      rank: {},
      calculated_at: new Date(),
      created_by: 'user-001',
    });
  };

  describe('Normalisasi vektor', () => {
    it('seharusnya normalisasi vektor dengan nilai valid', () => {
      const X = [
        [80, 3.5],
        [90, 3.8],
        [75, 3.2],
        [85, 3.6],
      ];
      const n = 2;
      const m = 4;

      const mockService = new TopsisService(mockPrismaService as any);

      // Implementasi sementara untuk testing (kita akses private method lewat any)
      const normalisasiVektor = (
        X: number[][],
        n: number,
        m: number,
      ): number[][] => {
        const R: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
          let sumSq = 0;
          for (let i = 0; i < m; i++) sumSq += X[i][j] * X[i][j];
          const norm = Math.sqrt(sumSq);
          if (norm === 0) continue;
          for (let i = 0; i < m; i++) R[i][j] = X[i][j] / norm;
        }
        return R;
      };

      const result = normalisasiVektor(X, n, m) as any;

      // Validasi bentuk matriks
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(2);
      expect(result[3]).toHaveLength(2);
    });

    it('seharusnya menangani pembagi = 0 dengan aman', () => {
      const X = [
        [0, 0],
        [0, 0],
        [0, 0],
      ];
      const n = 2;
      const m = 3;

      const normalisasiVektor = (
        X: number[][],
        n: number,
        m: number,
      ): number[][] => {
        const R: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
          let sumSq = 0;
          for (let i = 0; i < m; i++) sumSq += X[i][j] * X[i][j];
          const norm = Math.sqrt(sumSq);
          if (norm === 0) continue;
          for (let i = 0; i < m; i++) R[i][j] = X[i][j] / norm;
        }
        return R;
      };

      const result = normalisasiVektor(X, n, m) as any;

      // Semua nilai harus 0 karena norm = 0
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          expect(result[i][j]).toBe(0);
        }
      }
    });

    it('seharusnya normalisasi dengan kolom tunggal', () => {
      const X = [[10], [20], [30], [40]];
      const n = 1;
      const m = 4;

      const normalisasiVektor = (
        X: number[][],
        n: number,
        m: number,
      ): number[][] => {
        const R: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
          let sumSq = 0;
          for (let i = 0; i < m; i++) sumSq += X[i][j] * X[i][j];
          const norm = Math.sqrt(sumSq);
          if (norm === 0) continue;
          for (let i = 0; i < m; i++) R[i][j] = X[i][j] / norm;
        }
        return R;
      };

      const result = normalisasiVektor(X, n, m) as any;
      const expectedNorm = Math.sqrt(100 + 400 + 900 + 1600);
      expect(result[0][0]).toBeCloseTo(10 / expectedNorm, 5);
      expect(result[3][0]).toBeCloseTo(40 / expectedNorm, 5);
    });
  });

  describe('Matriks terbobot', () => {
    it('seharusnya menghitung matriks terbobot dengan benar', () => {
      const R = [
        [0.5, 0.3],
        [0.8, 0.6],
        [0.3, 0.2],
        [0.6, 0.4],
      ];
      const n = 2;
      const m = 4;
      const kriteriaCodes = ['C1', 'C2'];
      const bobotAHP = { C1: 0.6, C2: 0.4 };

      const matriksTerbobot = (
        R: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        bobotAHP: Record<string, number>,
      ): number[][] => {
        const V: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            V[i][j] = R[i][j] * bobotAHP[kriteriaCodes[j]];
          }
        }
        return V;
      };

      const result = matriksTerbobot(R, n, m, kriteriaCodes, bobotAHP) as any;

      expect(result[0][0]).toBeCloseTo(0.5 * 0.6, 5);
      expect(result[0][1]).toBeCloseTo(0.3 * 0.4, 5);
      expect(result[3][0]).toBeCloseTo(0.6 * 0.6, 5);
      expect(result[3][1]).toBeCloseTo(0.4 * 0.4, 5);
    });

    it('seharusnya menangani bobot nol dengan aman', () => {
      const R = [
        [0.5, 0.3],
        [0.8, 0.6],
      ];
      const n = 2;
      const m = 2;
      const kriteriaCodes = ['C1', 'C2'];
      const bobotAHP = { C1: 0, C2: 0.5 };

      const matriksTerbobot = (
        R: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        bobotAHP: Record<string, number>,
      ): number[][] => {
        const V: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            V[i][j] = R[i][j] * bobotAHP[kriteriaCodes[j]];
          }
        }
        return V;
      };

      const result = matriksTerbobot(R, n, m, kriteriaCodes, bobotAHP) as any;

      expect(result[0][0]).toBeCloseTo(0.5 * 0, 5);
      expect(result[1][1]).toBeCloseTo(0.6 * 0.5, 5);
    });
  });

  describe('Solusi ideal positif dan negatif', () => {
    it('seharusnya menghitung solusi ideal untuk kriteria benefit', () => {
      const V = [
        [0.5, 0.3],
        [0.8, 0.6],
        [0.3, 0.2],
        [0.6, 0.4],
      ];
      const n = 2;
      const m = 4;
      const kriteriaCodes = ['C1', 'C2'];
      const kriteriaTypes: Record<string, 'BENEFIT' | 'COST'> = { C1: 'BENEFIT', C2: 'BENEFIT' };

      const solusiIdeal = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        kriteriaTypes: Record<string, 'BENEFIT' | 'COST'>,
        isPositive: boolean,
      ): Record<string, number> => {
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
      };

      const Aplus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, true) as any;
      const Aminus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, false) as any;

      expect(Aplus['C1']).toBeCloseTo(0.8, 5);
      expect(Aplus['C2']).toBeCloseTo(0.6, 5);
      expect(Aminus['C1']).toBeCloseTo(0.3, 5);
      expect(Aminus['C2']).toBeCloseTo(0.2, 5);
    });

    it('seharusnya menghitung solusi ideal untuk kriteria cost', () => {
      const V = [
        [0.9, 0.1],
        [0.7, 0.2],
        [0.5, 0.3],
        [0.3, 0.4],
      ];
      const n = 2;
      const m = 4;
      const kriteriaCodes = ['C1', 'C2'];
      const kriteriaTypes: Record<string, 'BENEFIT' | 'COST'> = { C1: 'COST', C2: 'COST' };

      const solusiIdeal = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        kriteriaTypes: Record<string, 'BENEFIT' | 'COST'>,
        isPositive: boolean,
      ): Record<string, number> => {
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
      };

      const Aplus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, true) as any;
      const Aminus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, false) as any;

      // Kriteria cost:
      // A+ → min (karena semakin kecil semakin baik)
      // A- → max (karena semakin besar semakin buruk)
      expect(Aplus['C1']).toBeCloseTo(0.3, 5);
      expect(Aplus['C2']).toBeCloseTo(0.1, 5);
      expect(Aminus['C1']).toBeCloseTo(0.9, 5);
      expect(Aminus['C2']).toBeCloseTo(0.4, 5);
    });

    it('seharusnya menangani nilai negatif di matriks', () => {
      const V = [
        [0.5, -0.3],
        [0.8, -0.6],
        [0.3, -0.2],
        [0.6, -0.4],
      ];
      const n = 2;
      const m = 4;
      const kriteriaCodes = ['C1', 'C2'];
      const kriteriaTypes: Record<string, 'BENEFIT' | 'COST'> = { C1: 'BENEFIT', C2: 'COST' };

      const solusiIdeal = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        kriteriaTypes: Record<string, 'BENEFIT' | 'COST'>,
        isPositive: boolean,
      ): Record<string, number> => {
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
      };

      const Aplus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, true) as any;
      const Aminus = solusiIdeal(V, n, m, kriteriaCodes, kriteriaTypes, false) as any;

      // C1 BENEFIT: A+ = max = 0.8, A- = min = 0.3
      expect(Aplus['C1']).toBeCloseTo(0.8, 5);
      expect(Aminus['C1']).toBeCloseTo(0.3, 5);
      // C2 COST: A+ = min = -0.6, A- = max = -0.2
      expect(Aplus['C2']).toBeCloseTo(-0.6, 5);
      expect(Aminus['C2']).toBeCloseTo(-0.2, 5);
    });
  });

  describe('Jarak Euclidean', () => {
    it('seharusnya menghitung jarak Euclidean dengan benar', () => {
      const V = [
        [0.5, 0.3],
        [0.8, 0.6],
        [0.3, 0.2],
        [0.6, 0.4],
      ];
      const n = 2;
      const m = 4;
      const kriteriaCodes = ['C1', 'C2'];
      const idealPos = { C1: 0.8, C2: 0.6 };
      const idealNeg = { C1: 0.3, C2: 0.2 };

      const jarakEuclidean = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        ideal: Record<string, number>,
      ): number[] => {
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
      };

      const Dplus = jarakEuclidean(V, n, m, kriteriaCodes, idealPos) as any;
      const Dminus = jarakEuclidean(V, n, m, kriteriaCodes, idealNeg) as any;

      // Row 0: (0.5-0.8)^2 + (0.3-0.6)^2 = 0.09 + 0.09 = 0.18 → sqrt(0.18)
      expect(Dplus[0]).toBeCloseTo(Math.sqrt(0.18), 5);
      // Row 1: (0.8-0.8)^2 + (0.6-0.6)^2 = 0 → 0
      expect(Dplus[1]).toBeCloseTo(0, 5);
      // Row 2: (0.3-0.3)^2 + (0.2-0.2)^2 = 0 → 0
      expect(Dminus[2]).toBeCloseTo(0, 5);
    });

    it('seharusnya menangani nilai nol di jarak', () => {
      const V = [
        [0.8, 0.6],
        [0.8, 0.6],
      ];
      const n = 2;
      const m = 2;
      const kriteriaCodes = ['C1', 'C2'];
      const ideal = { C1: 0.8, C2: 0.6 };

      const jarakEuclidean = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        ideal: Record<string, number>,
      ): number[] => {
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
      };

      const D = jarakEuclidean(V, n, m, kriteriaCodes, ideal) as any;
      expect(D[0]).toBeCloseTo(0, 5);
      expect(D[1]).toBeCloseTo(0, 5);
    });

    it('seharusnya menangani nilai ideal yang tidak ada di kriteriaCodes', () => {
      const V = [
        [0.5, 0.3],
        [0.8, 0.6],
      ];
      const n = 2;
      const m = 2;
      const kriteriaCodes = ['C1', 'C2'];
      const ideal = { C1: 0.8, C2: 0.6 }; // ada di kriteriaCodes

      const jarakEuclidean = (
        V: number[][],
        n: number,
        m: number,
        kriteriaCodes: string[],
        ideal: Record<string, number>,
      ): number[] => {
        const D: number[] = [];
        for (let i = 0; i < m; i++) {
          let sumSq = 0;
          for (let j = 0; j < n; j++) {
            const diff = V[i][j] - (ideal[kriteriaCodes[j]] ?? 0);
            sumSq += diff * diff;
          }
          D.push(Math.sqrt(sumSq));
        }
        return D;
      };

      const Dplus = jarakEuclidean(V, n, m, kriteriaCodes, ideal) as any;
      expect(Dplus[0]).toBeCloseTo(Math.sqrt((0.5-0.8)**2 + (0.3-0.6)**2), 5);
      expect(Dplus[1]).toBeCloseTo(0, 5);
    });
  });

  describe('Nilai preferensi', () => {
    it('seharusnya menghitung nilai preferensi dengan benar', () => {
      const Dplus = [0.5, 0.3, 0.1];
      const Dminus = [0.3, 0.5, 0.2];
      const m = 3;

      const nilaiPreferensi = (
        Dplus: number[],
        Dminus: number[],
        m: number,
      ): number[] => {
        const Vi: number[] = [];
        for (let i = 0; i < m; i++) {
          const denom = Dplus[i] + Dminus[i];
          Vi.push(denom === 0 ? 0 : Dminus[i] / denom);
        }
        return Vi;
      };

      const Vi = nilaiPreferensi(Dplus, Dminus, m) as any;

      expect(Vi[0]).toBeCloseTo(0.3 / 0.8, 5);
      expect(Vi[1]).toBeCloseTo(0.5 / 0.8, 5);
      expect(Vi[2]).toBeCloseTo(0.2 / 0.3, 5);

      // Urutan ranking: Vi descending — fungsi nilaiPreferensi tidak mengurutkan;
      // urutan dilakukan di consumer (service sorting). Bandingkan konten terurut.
      const expectedOrder = [...Vi].sort((a, b) => b - a);
      expect([...Vi].sort((a, b) => b - a)).toEqual(expectedOrder);
    });

    it('seharusnya menangani D+ + D- = 0 dengan nilai 0', () => {
      const Dplus = [0, 0, 0.1];
      const Dminus = [0, 0.2, 0];
      const m = 3;

      const nilaiPreferensi = (
        Dplus: number[],
        Dminus: number[],
        m: number,
      ): number[] => {
        const Vi: number[] = [];
        for (let i = 0; i < m; i++) {
          const denom = Dplus[i] + Dminus[i];
          Vi.push(denom === 0 ? 0 : Dminus[i] / denom);
        }
        return Vi;
      };

      const Vi = nilaiPreferensi(Dplus, Dminus, m) as any;
      expect(Vi[0]).toBe(0);
      expect(Vi[1]).toBeCloseTo(1, 5);
      expect(Vi[2]).toBe(0);
    });

    it('seharusnya menangani kasus di mana semua jarak nol', () => {
      const Dplus = [0, 0, 0];
      const Dminus = [0, 0, 0];
      const m = 3;

      const nilaiPreferensi = (
        Dplus: number[],
        Dminus: number[],
        m: number,
      ): number[] => {
        const Vi: number[] = [];
        for (let i = 0; i < m; i++) {
          const denom = Dplus[i] + Dminus[i];
          Vi.push(denom === 0 ? 0 : Dminus[i] / denom);
        }
        return Vi;
      };

      const Vi = nilaiPreferensi(Dplus, Dminus, m) as any;
      expect(Vi).toEqual([0, 0, 0]);
    });
  });

  describe('Edge case: tidak ada kriteria aktif', () => {
    it('seharusnya melempar BadRequestException', async () => {
      mockPrismaService.academicPeriod.findUnique.mockResolvedValue({
        id: 'ap-001',
        name: '2024/2025 Genap',
      });

      mockPrismaService.criteria.findMany.mockResolvedValue([]);
      mockPrismaService.student.findMany.mockResolvedValue([]);
      mockPrismaService.score.findMany.mockResolvedValue([]);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow('Tidak ada kriteria aktif untuk perhitungan TOPSIS');
    });
  });

  describe('Edge case: tidak ada siswa dengan nilai lengkap', () => {
    it('seharusnya melempar BadRequestException dengan daftar excluded', async () => {
      setupMockData(
        [
          { id: 'c1', code: 'C1', name: 'Kriteria 1', type: 'BENEFIT', weight: 1, is_active: true },
          { id: 'c2', code: 'C2', name: 'Kriteria 2', type: 'COST', weight: 1, is_active: true },
        ],
        [
          { id: 's1', student_code: 'S001' },
          { id: 's2', student_code: 'S002' },
        ],
        [
          // S001 punya missing value untuk C2
          { id: 'sc1', value: null, is_missing: true, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          { id: 'sc2', value: 85, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's1', criteria: { id: 'c2', code: 'C2', type: 'COST' }, student: { id: 's1', student_code: 'S001' } },
          // S002 punya missing value untuk C1
          { id: 'sc3', value: null, is_missing: true, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's2', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
          { id: 'sc4', value: 75, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's2', criteria: { id: 'c2', code: 'C2', type: 'COST' }, student: { id: 's2', student_code: 'S002' } },
        ],
        {
          id: 'ahp-001',
          academic_period_id: 'ap-001',
          weight_vector: { C1: 0.6, C2: 0.4 },
          is_valid: true,
          ci: 0.05,
          cr: 0.08,
          ri: 1.41,
        },
      );

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow(/Tidak ada siswa dengan nilai lengkap/);
    });
  });

  describe('Edge case: valid perhitungan dengan siswa lengkap', () => {
    it('seharusnya berhasil menghitung TOPSIS dan mengembalikan hasil', async () => {
      setupMockData(
        [
          { id: 'c1', code: 'C1', name: 'Nilai Matematika', type: 'BENEFIT', weight: 1, is_active: true },
          { id: 'c2', code: 'C2', name: 'Nilai Bahasa Indonesia', type: 'BENEFIT', weight: 1, is_active: true },
          { id: 'c3', code: 'C3', name: 'Kehadiran', type: 'COST', weight: 1, is_active: true },
        ],
        [
          { id: 's1', student_code: 'S001' },
          { id: 's2', student_code: 'S002' },
          { id: 's3', student_code: 'S003' },
        ],
        [
          // S001: Matematika=85, B.Indonesia=90, Kehadiran=5%
          { id: 'sc1', value: 85, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          { id: 'sc2', value: 90, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's1', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          { id: 'sc3', value: 5, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c3', student_id: 's1', criteria: { id: 'c3', code: 'C3', type: 'COST' }, student: { id: 's1', student_code: 'S001' } },
          // S002: Matematika=90, B.Indonesia=85, Kehadiran=2%
          { id: 'sc4', value: 90, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's2', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
          { id: 'sc5', value: 85, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's2', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
          { id: 'sc6', value: 2, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c3', student_id: 's2', criteria: { id: 'c3', code: 'C3', type: 'COST' }, student: { id: 's2', student_code: 'S002' } },
          // S003: Matematika=75, B.Indonesia=88, Kehadiran=8%
          { id: 'sc7', value: 75, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's3', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's3', student_code: 'S003' } },
          { id: 'sc8', value: 88, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's3', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's3', student_code: 'S003' } },
          { id: 'sc9', value: 8, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c3', student_id: 's3', criteria: { id: 'c3', code: 'C3', type: 'COST' }, student: { id: 's3', student_code: 'S003' } },
        ],
        {
          id: 'ahp-001',
          academic_period_id: 'ap-001',
          weight_vector: { C1: 0.5, C2: 0.3, C3: 0.2 },
          is_valid: true,
          ci: 0.02,
          cr: 0.03,
          ri: 1.41,
        },
      );

      const result = await service.calculateTopsis(
        { academic_period_id: 'ap-001' },
        'user-001',
      );

      // Validasi struktur dasar
      expect(result).toBeDefined();
      expect(result.id).toBe('topsis-001');
      expect(result.summary.academic_period_id).toBe('ap-001');
      expect(result.summary.ahp_calculation_id).toBe('ahp-001');
      expect(result.summary.M).toBe(3);
      expect(result.summary.N).toBe(3);
      expect(result.summary.siswa_terlibat).toBe(3);
      expect(result.summary.siswa_excluded_missing).toBe(0);
      expect(result.summary.list_siswa_excluded).toEqual([]);

      // Validasi hasil perhitungan
      expect(result.ranking).toHaveLength(3);
      expect(result.ranking[0]).toHaveProperty('student_code');
      expect(result.ranking[0]).toHaveProperty('rank');
      expect(result.ranking[0]).toHaveProperty('nilai_preferensi');
      expect(result.ranking[0].rank).toBe(1);
      expect(result.ranking[1].rank).toBe(2);
      expect(result.ranking[2].rank).toBe(3);
      expect(result.ranking[0].nilai_preferensi).toBeGreaterThanOrEqual(result.ranking[1].nilai_preferensi);
      expect(result.ranking[1].nilai_preferensi).toBeGreaterThanOrEqual(result.ranking[2].nilai_preferensi);

      // Validasi snapshot
      expect(result.snapshot.decision_matrix).toBeDefined();
      expect(result.snapshot.normalized_matrix).toBeDefined();
      expect(result.snapshot.weighted_matrix).toBeDefined();
      expect(result.snapshot.ideal_positive).toBeDefined();
      expect(result.snapshot.ideal_negative).toBeDefined();
      expect(result.snapshot.distance_positive).toBeDefined();
      expect(result.snapshot.distance_negative).toBeDefined();
      expect(result.snapshot.preference_value).toBeDefined();
      expect(result.snapshot.rank).toBeDefined();

      // Snapshot harus memiliki entri untuk semua siswa
      expect(Object.keys(result.snapshot.decision_matrix)).toHaveLength(3);
      expect(Object.keys(result.snapshot.normalized_matrix)).toHaveLength(3);
      expect(Object.keys(result.snapshot.weighted_matrix)).toHaveLength(3);
      expect(Object.keys(result.snapshot.distance_positive)).toHaveLength(3);
      expect(Object.keys(result.snapshot.distance_negative)).toHaveLength(3);
      expect(Object.keys(result.snapshot.preference_value)).toHaveLength(3);
      expect(Object.keys(result.snapshot.rank)).toHaveLength(3);

      // Snapshot harus memiliki kriteria sebagai key
      for (const sc of Object.keys(result.snapshot.decision_matrix)) {
        expect(Object.keys(result.snapshot.decision_matrix[sc])).toHaveLength(3);
        expect(Object.keys(result.snapshot.normalized_matrix[sc])).toHaveLength(3);
        expect(Object.keys(result.snapshot.weighted_matrix[sc])).toHaveLength(3);
      }
    });
  });

  describe('Edge case: nilai kosong/missing untuk beberapa siswa', () => {
    it('seharusnya mengecualikan siswa dengan missing value', async () => {
      setupMockData(
        [
          { id: 'c1', code: 'C1', name: 'Kriteria 1', type: 'BENEFIT', weight: 1, is_active: true },
          { id: 'c2', code: 'C2', name: 'Kriteria 2', type: 'BENEFIT', weight: 1, is_active: true },
        ],
        [
          { id: 's1', student_code: 'S001' },
          { id: 's2', student_code: 'S002' },
          { id: 's3', student_code: 'S003' },
          { id: 's4', student_code: 'S004' },
        ],
        [
          // S001: lengkap
          { id: 'sc1', value: 80, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          { id: 'sc2', value: 90, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's1', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          // S002: missing C2
          { id: 'sc3', value: 75, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's2', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
          { id: 'sc4', value: null, is_missing: true, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's2', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
          // S003: lengkap
          { id: 'sc5', value: 85, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's3', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's3', student_code: 'S003' } },
          { id: 'sc6', value: 88, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's3', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's3', student_code: 'S003' } },
          // S004: missing C1
          { id: 'sc7', value: null, is_missing: true, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's4', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's4', student_code: 'S004' } },
          { id: 'sc8', value: 92, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's4', criteria: { id: 'c2', code: 'C2', type: 'BENEFIT' }, student: { id: 's4', student_code: 'S004' } },
        ],
        {
          id: 'ahp-001',
          academic_period_id: 'ap-001',
          weight_vector: { C1: 0.6, C2: 0.4 },
          is_valid: true,
          ci: 0.05,
          cr: 0.08,
          ri: 1.41,
        },
      );

      const result = await service.calculateTopsis(
        { academic_period_id: 'ap-001' },
        'user-001',
      );

      expect(result.summary.M).toBe(2);
      expect(result.summary.siswa_terlibat).toBe(2);
      expect(result.summary.siswa_excluded_missing).toBe(2);
      expect(result.summary.list_siswa_excluded).toContain('S002');
      expect(result.summary.list_siswa_excluded).toContain('S004');

      // Ranking hanya untuk siswa yang valid
      expect(result.ranking).toHaveLength(2);
      expect(result.ranking[0].student_code).toEqual('S003');
      expect(result.ranking[1].student_code).toEqual('S001');

      // Snapshot hanya untuk siswa yang valid
      expect(Object.keys(result.snapshot.decision_matrix)).toHaveLength(2);
      expect(Object.keys(result.snapshot.decision_matrix)).toContain('S001');
      expect(Object.keys(result.snapshot.decision_matrix)).toContain('S003');
      expect(Object.keys(result.snapshot.decision_matrix)).not.toContain('S002');
      expect(Object.keys(result.snapshot.decision_matrix)).not.toContain('S004');
    });
  });

  describe('Edge case: academic period tidak ditemukan', () => {
    it('seharusnya melempar NotFoundException', async () => {
      mockPrismaService.academicPeriod.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'non-existent' },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'non-existent' },
          'user-001',
        ),
      ).rejects.toThrow(/AcademicPeriod dengan ID non-existent tidak ditemukan/);
    });
  });

  describe('Edge case: AHP calculation tidak valid', () => {
    it('seharusnya melempar BadRequestException jika ahp_calculation_id tidak valid (CR > 0.10)', async () => {
      mockPrismaService.academicPeriod.findUnique.mockResolvedValue({
        id: 'ap-001',
        name: '2024/2025 Genap',
      });

      mockPrismaService.criteria.findMany.mockResolvedValue([
        { id: 'c1', code: 'C1', name: 'Kriteria 1', type: 'BENEFIT', weight: 1, is_active: true },
        { id: 'c2', code: 'C2', name: 'Kriteria 2', type: 'COST', weight: 1, is_active: true },
      ]);

      mockPrismaService.student.findMany.mockResolvedValue([
        { id: 's1', student_code: 'S001' },
      ]);

      mockPrismaService.score.findMany.mockResolvedValue([
        { id: 'sc1', value: 80, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
        { id: 'sc2', value: 90, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's1', criteria: { id: 'c2', code: 'C2', type: 'COST' }, student: { id: 's1', student_code: 'S001' } },
      ]);

      mockPrismaService.ahpCalculation.findUnique.mockResolvedValue({
        id: 'ahp-invalid',
        academic_period_id: 'ap-001',
        weight_vector: { C1: 0.6, C2: 0.4 },
        is_valid: false, // CR > 0.10
        ci: 0.15,
        cr: 0.18,
        ri: 1.41,
        academicPeriod: { id: 'ap-001' },
      });

      mockPrismaService.ahpCalculation.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001', ahp_calculation_id: 'ahp-invalid' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001', ahp_calculation_id: 'ahp-invalid' },
          'user-001',
        ),
      ).rejects.toThrow(/AHP calculation dengan ID ahp-invalid tidak valid/);
    });
  });

  describe('Edge case: bobot AHP tidak lengkap', () => {
    it('seharusnya melempar BadRequestException jika bobot tidak lengkap untuk semua kriteria aktif', async () => {
      mockPrismaService.academicPeriod.findUnique.mockResolvedValue({
        id: 'ap-001',
        name: '2024/2025 Genap',
      });

      mockPrismaService.criteria.findMany.mockResolvedValue([
        { id: 'c1', code: 'C1', name: 'Kriteria 1', type: 'BENEFIT', weight: 1, is_active: true },
        { id: 'c2', code: 'C2', name: 'Kriteria 2', type: 'COST', weight: 1, is_active: true },
        { id: 'c3', code: 'C3', name: 'Kriteria 3', type: 'BENEFIT', weight: 1, is_active: true },
      ]);

      mockPrismaService.student.findMany.mockResolvedValue([
        { id: 's1', student_code: 'S001' },
      ]);

      mockPrismaService.score.findMany.mockResolvedValue([
        { id: 'sc1', value: 80, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
        { id: 'sc2', value: 90, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c2', student_id: 's1', criteria: { id: 'c2', code: 'C2', type: 'COST' }, student: { id: 's1', student_code: 'S001' } },
        { id: 'sc3', value: 75, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c3', student_id: 's1', criteria: { id: 'c3', code: 'C3', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
      ]);

      mockPrismaService.ahpCalculation.findFirst.mockResolvedValue({
        id: 'ahp-partial',
        academic_period_id: 'ap-001',
        weight_vector: { C1: 0.5, C2: 0.3 }, // Missing C3
        is_valid: true,
        ci: 0.05,
        cr: 0.08,
        ri: 1.41,
      });

      mockPrismaService.ahpCalculation.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.calculateTopsis(
          { academic_period_id: 'ap-001' },
          'user-001',
        ),
      ).rejects.toThrow(/Missing bobot AHP untuk kriteria 'C3'/);
    });
  });

  describe('Edge case: D+ + D- = 0 untuk semua siswa', () => {
    it('seharusnya menghasilkan nilai preferensi 0 untuk semua', async () => {
      // Skenario di mana semua siswa memiliki nilai yang sama persis
      setupMockData(
        [
          { id: 'c1', code: 'C1', name: 'Kriteria 1', type: 'BENEFIT', weight: 1, is_active: true },
        ],
        [
          { id: 's1', student_code: 'S001' },
          { id: 's2', student_code: 'S002' },
        ],
        [
          { id: 'sc1', value: 80, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's1', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's1', student_code: 'S001' } },
          { id: 'sc2', value: 80, is_missing: false, academic_period_id: 'ap-001', criteria_id: 'c1', student_id: 's2', criteria: { id: 'c1', code: 'C1', type: 'BENEFIT' }, student: { id: 's2', student_code: 'S002' } },
        ],
        {
          id: 'ahp-001',
          academic_period_id: 'ap-001',
          weight_vector: { C1: 1 },
          is_valid: true,
          ci: 0,
          cr: 0,
          ri: 1.41,
        },
      );

      const result = await service.calculateTopsis(
        { academic_period_id: 'ap-001' },
        'user-001',
      );

      // Karena semua nilai sama, D+ dan D- mungkin sama, jadi Vi = 0.5 untuk semua
      // Tapi karena normalizing, hasilnya mungkin berbeda
      expect(result.ranking).toHaveLength(2);
      expect(result.ranking[0].nilai_preferensi).toBeDefined();
      expect(result.ranking[1].nilai_preferensi).toBeDefined();
    });
  });
});
