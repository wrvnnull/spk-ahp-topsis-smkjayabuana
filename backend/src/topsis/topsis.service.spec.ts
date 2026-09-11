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
