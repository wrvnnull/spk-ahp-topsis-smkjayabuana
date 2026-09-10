# SPK AHP-TOPSIS - Sistem Penunjang Keputusan

Sistem Penunjang Keputusan (SPK) untuk menentukan siswa berprestasi menggunakan metode **AHP** (Analytical Hierarchy Process) dan **TOPSIS** (Technique for Order Preference by Similarity to Ideal Solution).

## Deskripsi

Sistem ini mengotomatisasi penilaian siswa berprestasi melalui integrasi dua metode multikriteria:

- **AHP** - Menentukan bobot kriteria melalui perbandingan berpasangan (pairwise comparison) dengan uji konsistensi
- **TOPSIS** - Perangkingan alternatif berdasarkan kedekatan dengan solusi ideal positif

Dikembangkan untuk SMK Jaya Buana, Kabupaten Tangerang.

## Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| **Mesin SPK Dinamis** | Kalkulasi AHP (N×N) dan TOPSIS yang beradaptasi otomatis sesuai jumlah kriteria |
| **3-Role RBAC** | Super Admin, Guru (Wali Kelas), Kepala Sekolah |
| **Log Audit** | Rekam jejak digital perubahan nilai dan bobot |
| **Laporan PDF** | Ekspor ranking dengan template KOP placeholder |

## Arsitektur

```
spk-ahp-topsis-app/
├── backend/          # NestJS + TypeScript
│   ├── src/          # Source code
│   ├── prisma/       # Schema & migrations
│   └── test/         # Test files
├── frontend/         # Next.js + React + TypeScript (dalam pengembangan)
│   ├── src/
│   └── public/
└── docs/             # Dokumentasi teknis
    └── technical-design/
```

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend | NestJS, TypeScript |
| Frontend | Next.js, React, Tailwind CSS |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (httpOnly cookie) |
| Deployment | Docker + Docker Compose |

## Prerequisites

- Node.js 20+
- PostgreSQL 16
- Docker (optional, untuk development)

## Instalasi & Menjalankan

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Backend berjalan di `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3001`.

### Database dengan Docker

```bash
docker-compose up -d
```

## Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan:

```bash
cp .env.example .env
```

Variable yang dibutuhkan:

| Variable | Keterangan |
|----------|-----------|
| `DB_HOST` | Host database |
| `DB_PORT` | Port database |
| `DB_NAME` | Nama database |
| `DB_USER` | User database |
| `DB_PASSWORD` | Password database |
| `DATABASE_URL` | Connection string Prisma |
| `APP_HOST` | Host aplikasi backend |
| `APP_PORT` | Port aplikasi backend |
| `JWT_ACCESS_SECRET` | Secret untuk JWT |
| `JWT_EXPIRATION` | Masa berlaku JWT |
| `ALLOWED_ORIGINS` | Origin untuk CORS |

## Struktur Database

Schema menggunakan Prisma ORM dengan tabel:

- `users` - Manajemen pengguna dengan role (SUPER_ADMIN, GURU, KEPALA_SEKOLAH)
- `academic_periods` - Periode akademik
- `classes` - Kelas
- `students` - Siswa
- `criteria` - Kriteria penilaian
- `ahp_comparisons` - Perbandingan berpasangan AHP
- `scores` - Nilai siswa per kriteria
- `ahp_calculations` - Hasil kalkulasi AHP
- `topsis_calculations` - Hasil perangkingan TOPSIS
- `audit_logs` - Log audit

Lihat `backend/prisma/schema.prisma` untuk detail.

## Dokumentasi Teknis

Dokumentasi rancangan sistem tersedia di:

- `docs/technical-design/` - 12 bagian rancangan teknis lengkap
- `docs/RANCANGAN_SISTEM.md` - Rancangan sistem utama
- `docs/FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md` - Review arsitektur

## RBAC (Role-Based Access Control)

| Role | Hak Akses |
|------|-----------|
| **SUPER_ADMIN** | Manajemen semua data, konfigurasi AHP, melihat semua hasil |
| **GURU** | Input nilai untuk kelas sendiri, melihat data kelas sendiri |
| **KEPALA_SEKOLAH** | Melihat ranking, hasil AHP/TOPSIS, cetak laporan |

## Testing

```bash
cd backend
npm test
```

## Lisensi

MIT

## Catatan Keamanan

- **JANGAN** commit file `.env` ke repository
- Gunakan `.env.example` sebagai acuan
- Logo sekolah dan data sensitif TIDAK disertakan di repository ini
- Data siswa asli tidak disertakan; gunakan data dummy/anonymized untuk development

---

Dokumentasi ini diperbarui sesuai struktur proyek terbaru.
