#!/usr/bin/env ts-node
/**
 * seed.ts - Database Seeder untuk SPK AHP-TOPSIS (SAFE FOR PUBLIC REPO)
 *
 * Fitur:
 * - Menggunakan data dummy/anonymized (tidak ada data siswa asli)
 * - Tidak membaca file Excel dari path sensitif
 * - Tidak hard-code password; menggunakan env var atau generate random
 * - 100% kompatibel dengan schema.prisma aktual
 * - IDEMPOTENT: bisa dijalankan berulang tanpa error
 *
 * Jalankan: npx ts-node seed.ts
 */

import { PrismaClient, Role, CriteriaType, Semester } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const CONFIG = {
  ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex'),
  GURU_PASSWORD: process.env.SEED_GURU_PASSWORD || crypto.randomBytes(12).toString('hex'),
  KEPSK_PASSWORD: process.env.SEED_KEPSK_PASSWORD || crypto.randomBytes(12).toString('hex'),

  dummyData: {
    admin: { email: process.env.SEED_ADMIN_EMAIL || 'admin@contoh.sch.id', name: 'Super Admin' },
    guru: { email: process.env.SEED_GURU_EMAIL || 'guru@contoh.sch.id', name: 'Guru Wali Kelas' },
    kepsek: { email: process.env.SEED_KEPSK_EMAIL || 'kepsek@contoh.sch.id', name: 'Kepala Sekolah' },
  },

  criteria: [
    { code: 'C1', name: 'Pengetahuan', type: CriteriaType.BENEFIT },
    { code: 'C2', name: 'PRAKERIN', type: CriteriaType.BENEFIT },
    { code: 'C3', name: 'Ketidakhadiran', type: CriteriaType.COST },
    { code: 'C4', name: 'Ekstrakurikuler', type: CriteriaType.BENEFIT },
  ],

  dummyStudents: {
    '11 TKJ 6': [
      { code: 'S001', name: 'Siswa A' },
      { code: 'S002', name: 'Siswa B' },
      { code: 'S003', name: 'Siswa C' },
      { code: 'S004', name: 'Siswa D' },
      { code: 'S005', name: 'Siswa E' },
    ],
    '11 TKJ 7': [
      { code: 'S006', name: 'Siswa F' },
      { code: 'S007', name: 'Siswa G' },
      { code: 'S008', name: 'Siswa H' },
    ],
    '11 TKJ 8': [
      { code: 'S009', name: 'Siswa I' },
      { code: 'S010', name: 'Siswa J' },
      { code: 'S011', name: 'Siswa K' },
      { code: 'S012', name: 'Siswa L' },
    ],
  },

  academicPeriod: {
    name: '2026/2027',
    school_year: '2026/2027',
    semester: Semester.GANJIL,
  },
};

async function main() {
  console.log('===============================================');
  console.log('  SPK AHP-TOPSIS - Database Seeder (SAFE)');
  console.log('  Versi: Public-Ready (tanpa data sensitif)');
  console.log('===============================================\\n');

  // Cek koneksi
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[OK] Database connected.\\n');
  } catch (err) {
    console.error('[FATAL] Database connection failed:', err);
    process.exit(1);
  }

  // IDEMPOTENT: Hapus data lama (hanya untuk development)
  console.log('[INFO] Membersihkan data lama untuk idempotent seed...\\n');

  await prisma.auditLog.deleteMany();
  await prisma.topsisCalculation.deleteMany();
  await prisma.ahpCalculation.deleteMany();
  await prisma.score.deleteMany();
  await prisma.ahpComparison.deleteMany();
  await prisma.criteria.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.academicPeriod.deleteMany();
  await prisma.user.deleteMany();
  console.log('[OK] Data lama dihapus.\\n');

  // Buat akun RBAC
  console.log('[INFO] Membuat akun RBAC...\\n');

  const adminPasswordHash = await bcrypt.hash(CONFIG.ADMIN_PASSWORD, 10);
  const guruPasswordHash = await bcrypt.hash(CONFIG.GURU_PASSWORD, 10);
  const kepsekPasswordHash = await bcrypt.hash(CONFIG.KEPSK_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: CONFIG.dummyData.admin.email,
      name: CONFIG.dummyData.admin.name,
      password_hash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`  - Super Admin  : ${admin.email} (password: ${CONFIG.ADMIN_PASSWORD})`);

  const guru = await prisma.user.create({
    data: {
      email: CONFIG.dummyData.guru.email,
      name: CONFIG.dummyData.guru.name,
      password_hash: guruPasswordHash,
      role: Role.GURU,
    },
  });
  console.log(`  - Guru         : ${guru.email} (password: ${CONFIG.GURU_PASSWORD})`);

  const kepsek = await prisma.user.create({
    data: {
      email: CONFIG.dummyData.kepsek.email,
      name: CONFIG.dummyData.kepsek.name,
      password_hash: kepsekPasswordHash,
      role: Role.KEPALA_SEKOLAH,
    },
  });
  console.log(`  - Kepala Sekolah: ${kepsek.email} (password: ${CONFIG.KEPSK_PASSWORD})\\n`);

  // Buat kriteria
  console.log('[INFO] Membuat kriteria...\\n');

  const createdCriteria: Array<{ code: string; id: string }> = [];

  for (const c of CONFIG.criteria) {
    const created = await prisma.criteria.create({
      data: {
        code: c.code,
        name: c.name,
        type: c.type,
        is_active: true,
        description: null,
      },
    });
    createdCriteria.push({ code: c.code, id: created.id });
    console.log(`  - ${c.code}: ${c.name} (${c.type}) [id=${created.id}]`);
  }
  console.log('');

  // Buat periode akademik
  console.log('[INFO] Membuat periode akademik...\\n');

  const period = await prisma.academicPeriod.create({
    data: {
      name: CONFIG.academicPeriod.name,
      school_year: CONFIG.academicPeriod.school_year,
      semester: CONFIG.academicPeriod.semester,
      is_active: true,
    },
  });
  console.log(`  - Periode: ${period.name} (${period.semester}) [id=${period.id}]\\n`);

  // Buat kelas dan siswa dummy
  console.log('[INFO] Membuat kelas dan siswa dummy...\\n');

  let totalStudents = 0;

  for (const [className, students] of Object.entries(CONFIG.dummyStudents)) {
    const classRoom = await prisma.classRoom.create({
      data: {
        name: className,
        academic_period_id: period.id,
        wali_teacher_id: guru.id,
      },
    });
    console.log(`  - Kelas: ${className} (wali: ${guru.name})`);

    for (const s of students) {
      const student = await prisma.student.create({
        data: {
          class_id: classRoom.id,
          student_code: s.code,
          name: s.name,
          is_active: true,
        },
      });
      console.log(`    - ${s.code}: ${s.name}`);

      // Nilai random 50-100 untuk setiap kriteria
      for (const crit of createdCriteria) {
        const randomValue = Math.floor(Math.random() * 51) + 50;
        await prisma.score.create({
          data: {
            student_id: student.id,
            criteria_id: crit.id,
            academic_period_id: period.id,
            value: randomValue,
            is_missing: false,
            note: null,
            created_by: guru.id,
          },
        });
      }
    }

    console.log(`    Total: ${students.length} siswa\\n`);
    totalStudents += students.length;
  }

  console.log(`  Total siswa dummy: ${totalStudents}\\n`);

  console.log('===============================================');
  console.log('  SEEDING SELESAI (SAFE & IDEMPOTENT)');
  console.log('===============================================');
  console.log(`  Periode: ${period.name} (${period.semester})`);
  console.log(`  Siswa: ${totalStudents}`);
  console.log(`  Kriteria: ${CONFIG.criteria.length}`);
  console.log(`\\n  Semua data DUMMY/ANONYMIZED`);
  console.log(`  File Excel tidak digunakan`);
  console.log('===============================================\\n');

  await prisma.$disconnect();
}

main()
  .catch((err) => {
    console.error('\\n[FATAL] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
