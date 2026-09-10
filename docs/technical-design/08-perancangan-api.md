# RANCANGAN SISTEM
## 8. PERANCANGAN REST API

### 8.1 Prinsip desain API

REST API dibangun menggunakan **NestJS + TypeScript** sebagai backend. Segala pendekatan mengikuti prinsip RESTful yang konsisten, menggunakan **DTO validation** melalui `class-validator` dan `class-transformer`, HTTP status code yang tepat, dan prinsip **data isolation** berdasarkan RBAC.

**Prinsip umum:**

1. **Resource-oriented:** Path dan response mengikuti struktur resource yang masuk akal.
2. **DTO validation:** Setiap request body divalidasi sebelum diproses oleh service.
3. **RBAC enforcement:** Guard NestJS memastikan user hanya mengakses endpoint sesuai role.
4. **GURU data isolation:** Backend secara eksplisit memfilter data yang tidak menjadi tanggung jawab GURU tertentu — bukan hanya menyembunyikan UI.
5. **No sensitive data exposure:** Response tidak mengembalikan password, token, atau data sensitif lainnya.
6. **Pagination & filtering:** Endpoint yang mengembalikan koleksi dilengkapi pagination dan filter.
7. **Predictable HTTP status:** 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error.

### 8.2 Autentikasi

#### 8.2.1 Login

```
POST /api/auth/login
```

**Role:** Semua role

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**

Token akses dan refresh token dikirim melalui `Set-Cookie` header sebagai HttpOnly cookie (tidak dikembalikan dalam response body).

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "SUPER_ADMIN | GURU | KEPALA_SEKOLAH"
}
```

**Keterangan:**
- JWT dihasilkan berdasarkan user ID dan role
- Token mengandung `sub` (user ID) dan `role` claims
- GURU juga mendapatkan claim `owned_class_ids` untuk data isolation
- Password dan token tidak dikembalikan dalam response body
- `accessToken` dan `refreshToken` disimpan sebagai HttpOnly cookie, tidak terekspos ke JavaScript

#### 8.2.2 Refresh Token

```
POST /api/auth/refresh
```

**Request:** Refresh token dibaca dari HttpOnly cookie (diirim browser secara otomatis). Tidak menggunakan `Authorization` header.

**Response (200 OK):** Access token baru diset sebagai HttpOnly cookie. Token ditukar berdasarkan refresh token yang valid dari cookie.

#### 8.2.3 Logout

```
POST /api/auth/logout
```

**Response (204 No Content):** Cookie dihapus (token tidak lagi dikirim browser; tidak ada invalidasi server-side — lihat 9.2.3).

#### 8.2.4 Get Current User

```
GET /api/auth/me
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "SUPER_ADMIN | GURU | KEPALA_SEKOLAH",
  // field tambahan tergantung role (misal owned_class_ids untuk GURU)
}
```

### 8.3 User Management

Tanpa izin khusus (SUPER_ADMIN hanya yang dapat mengelola pengguna).

#### 8.3.1 List Users

```
GET /api/users
```

**Role:** SUPER_ADMIN

**Query params:**
- `page` (default 1)
- `limit` (default 10)
- `role` (filter)
- `search` (nama/email)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "SUPER_ADMIN | GURU | KEPALA_SEKOLAH",
      "is_active": "boolean",
      "created_at": "ISO8601"
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

**Catatan keamanan:** Password, token, dan sensitive information tidak dikembalikan.

#### 8.3.2 Create User

```
POST /api/users
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "SUPER_ADMIN | GURU | KEPALA_SEKOLAH"
}
```

**Response (201 Created):** User object (tanpa password)

#### 8.3.3 Update User

```
PATCH /api/users/:id
```

**Role:** SUPER_ADMIN

**Request body (partial):**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "is_active": "boolean"
}
```

**Response (200 OK):** User object updated (tanpa password)

#### 8.3.4 Delete User

```
DELETE /api/users/:id
```

**Role:** SUPER_ADMIN

**Response (204 No Content):** User di-"soft delete" (is_active = false)

### 8.4 Academic Period (Periode Akademik)

#### 8.4.1 List Periods

```
GET /api/academic-periods
```

**Role:** SUPER_ADMIN, GURU, KEPALA_SEKOLAH

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string (misal: 2024/2025-Ganjil)",
      "start_date": "date",
      "end_date": "date",
      "is_active": "boolean"
    }
  ]
}
```

#### 8.4.2 Set Active Period

```
POST /api/academic-periods/:id/set-active
```

**Role:** SUPER_ADMIN

**Response (200 OK):** Periode yang di-set menjadi aktif

**Keterangan:** Hanya satu periode yang aktif setiap saat. Periode sebelumnya di-nonaktifkan.

#### 8.4.3 CRUD Periode

- `POST /api/academic-periods` — SUPER_ADMIN
- `PATCH /api/academic-periods/:id` — SUPER_ADMIN
- `DELETE /api/academic-periods/:id` — SUPER_ADMIN (soft delete)

### 8.5 Kelas (Classes)

#### 8.5.1 List Classes

```
GET /api/classes
```

**Role:**
- SUPER_ADMIN: semua kelas
- GURU: hanya kelas yang menjadi tanggung jawabnya (wali class)
- KEPALA_SEKOLAH: semua kelas

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string (misal: 11 TKJ 6)",
      "academic_period_id": "uuid",
      "wali_teacher_id": "uuid | null",
      "student_count": "number"
    }
  ]
}
```

**Catatan:** GURU hanya menerima daftar kelas yang `wali_teacher_id = user.id`.

#### 8.5.2 Create Class

```
POST /api/classes
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "name": "string",
  "academic_period_id": "uuid",
  "wali_teacher_id": "uuid | null"
}
```

**Response (201 Created):** Class object

#### 8.5.3 Update Class

```
PATCH /api/classes/:id
```

**Role:** SUPER_ADMIN

**Request body:** `name`, `wali_teacher_id`

**Response (200 OK):** Class object

#### 8.5.4 Delete Class

```
DELETE /api/classes/:id
```

**Role:** SUPER_ADMIN

**Response (204 No Content):** Soft delete

### 8.6 Siswa (Students)

#### 8.6.1 List Students

```
GET /api/students
```

**Role:**
- SUPER_ADMIN: semua siswa
- GURU: hanya siswa di kelas yang menjadi tanggung jawabnya
- KEPALA_SEKOLAH: semua siswa

**Query params:**
- `academic_period_id` (default: periode aktif)
- `class_id` (filter tambahan)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "student_code": "string (kode anonym/identitas internal yang aman)",
      "name": "string",
      "class_id": "uuid",
      "class_name": "string (derived)",
      "academic_period_id": "uuid",
      "is_active": "boolean"
    }
  ],
  "meta": { ... pagination }
}
```

**Catatan keamanan:** *Nama siswa* dikembalikan karena ini data internal aplikasi yang diizinkan untuk pengguna yang berwenang mengaksesnya. Namun data ini tidak boleh diekspor ke publik.

#### 8.6.2 Create Student

```
POST /api/students
```

**Role:** SUPER_ADMIN, GURU (untuk kelas sendiri)

**Request body:**
```json
{
  "student_code": "string",
  "name": "string",
  "class_id": "uuid"
}
```

**Catatan:** GURU hanya dapat membuat siswa untuk `class_id` yang merupakan tanggung jawabnya (`wali_teacher_id`).

**Response (201 Created):** Student object

#### 8.6.3 Update Student

```
PATCH /api/students/:id
```

**Role:** SUPER_ADMIN, GURU (untuk siswa di kelasnya)

**Request body:** `name`, `is_active`

**Response (200 OK):** Student object

#### 8.6.4 Get Student Detail

```
GET /api/students/:id
```

**Role:** SUPER_ADMIN, GURU (jika siswa di kelasnya), KEPALA_SEKOLAH

**Response (200 OK):** Student object lengkap dengan relasi

### 8.7 Kriteria (Criteria)

#### 8.7.1 List Criteria

```
GET /api/criteria
```

**Role:** SUPER_ADMIN, GURU, KEPALA_SEKOLAH

**Query params:**
- `academic_period_id` (default: periode aktif)
- `is_active` (filter)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "string (misal: C1, C2, dst.)",
      "name": "string",
      "type": "BENEFIT | COST",
      "description": "string | null",
      "is_active": "boolean",
      "academic_period_id": "uuid"
    }
  ]
}
```

#### 8.7.2 Create Criteria

```
POST /api/criteria
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "code": "string",
  "name": "string",
  "type": "BENEFIT | COST",
  "description": "string | null",
  "academic_period_id": "uuid"
}
```

**Response (201 Created):** Criteria object

#### 8.7.3 Update Criteria

```
PATCH /api/criteria/:id
```

**Role:** SUPER_ADMIN

**Request body:** `name`, `type`, `description`, `is_active`

**Response (200 OK):** Criteria object

#### 8.7.4 Delete Criteria

```
DELETE /api/criteria/:id
```

**Role:** SUPER_ADMIN

**Response (204 No Content):** Soft delete (is_active = false)

**Catatan:** Jika kriteria dinonaktifkan, AHP dan TOPSIS yang berkaitan harus di-recalculate.

### 8.8 Nilai Siswa (Scores)

#### 8.8.1 List Scores

```
GET /api/scores
```

**Role:**
- SUPER_ADMIN: semua nilai
- GURU: hanya nilai siswa di kelasnya sendiri untuk periode relevant
- KEPALA_SEKOLAH: semua nilai (biasanya untuk review)

**Query params:**
- `academic_period_id`
- `class_id`
- `criteria_id`
- `student_id`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "student_code": "string",
      "student_name": "string",
      "criteria_code": "string",
      "criteria_name": "string",
      "value": "number | null",
      "is_missing": "boolean",
      "academic_period_id": "uuid"
    }
  ]
}
```

#### 8.8.2 Create/Update Score (Bulk)

```
POST /api/scores/bulk
```

**Role:** GURU (untuk kelasnya sendiri), SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid",
  "scores": [
    {
      "student_id": "uuid",
      "criteria_id": "uuid",
      "value": "number | null",
      "is_missing": "boolean"
    }
  ]
}
```

**Catatan:** GURU hanya dapat memasukkan nilai untuk siswa di kelasnya sendiri. Sistem melakukan validasi ownership.

**Response (201 Created / 200 OK):**
```json
{
  "created": "number",
  "updated": "number",
  "errors": [
    {
      "student_id": "uuid",
      "criteria_id": "uuid",
      "error": "string"
    }
  ]
}
```

#### 8.8.3 Get Scores for One Student

```
GET /api/students/:studentId/scores
```

**Role:** SUPER_ADMIN, GURU (jika siswa di kelasnya), KEPALA_SEKOLAH

**Response (200 OK):** Array nilai untuk siswa tersebut

#### 8.8.4 Create Single Score

```
POST /api/scores
```

**Role:** GURU, SUPER_ADMIN

**Request body:**
```json
{
  "student_id": "uuid",
  "criteria_id": "uuid",
  "value": "number",
  "is_missing": "boolean"
}
```

**Response (201 Created):** Score object

### 8.9 AHP Comparisons (Perbandingan AHP)

#### 8.9.1 List Comparisons (untuk periode tertentu)

```
GET /api/ahp/comparisons
```

**Role:** SUPER_ADMIN

**Query params:**
- `academic_period_id`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "criteria_i_code": "string",
      "criteria_j_code": "string",
      "comparison_value": "number",
      "academic_period_id": "uuid",
      "created_by": "uuid",
      "created_at": "ISO8601"
    }
  ]
}
```

#### 8.9.2 Create/Update Comparison (Bulk)

```
POST /api/ahp/comparisons/bulk
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid",
  "comparisons": [
    {
      "criteria_i_id": "uuid",
      "criteria_j_id": "uuid",
      "comparison_value": "number"
    }
  ]
}
```

**Catatan:** Diagonal (i=j) tidak perlu dimasukkan karena selalu 1. Nilai a_ji dihitung sebagai 1/a_ij algoritma.

**Response (201 Created / 200 OK):** Status dan error per baris

#### 8.9.3 Create Single Comparison

```
POST /api/ahp/comparisons
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid",
  "criteria_i_id": "uuid",
  "criteria_j_id": "uuid",
  "comparison_value": "number"
}
```

**Response (201 Created):** Comparison object

#### 8.9.4 Get Comparison Matrix (sebagai matriks)

```
GET /api/ahp/comparisons/matrix
```

**Role:** SUPER_ADMIN

**Query params:**
- `academic_period_id`

**Response (200 OK):**
```json
{
  "matrix": [
    [1, "a12", "a13", ...],
    ["a21", 1, "a23", ...],
    ...
  ],
  "criteria_order": ["C1", "C2", "C3", ...]
}
```

### 8.10 AHP Calculations (Perhitungan AHP)

#### 8.10.1 Run AHP Calculation

```
POST /api/ahp/calculate
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "academic_period_id": "uuid",
  "calculated_at": "ISO8601",
  "lambda_max": "number",
  "ci": "number",
  "cr": "number | null",
  "ri": "number",
  "is_valid": "boolean",
  "weight_vector": {
    "C1": 0.4,
    "C2": 0.3,
    "C3": 0.2,
    "C4": 0.1
  },
  "created_by": "uuid",
  "message": "string (misal: CR exceeds threshold, atau konsisten)"
}
```

**Keterangan:**
- Sistem membaca semua kriteria aktif untuk periode tersebut (N kriteria)
- Sistem membaca semua comparisons untuk periode tersebut (N×N matriks, tanpa diagonal)
- Sistem membangun matriks dinamis, normalisasi, bobot, λmax, CI, CR
- Jika CR ≤ 0.10 → `is_valid = true`, `cr` diisi
- Jika CR > 0.10 → `is_valid = false`, `message` berisi peringatan
- Jika N=1 atau N=2 → CR tidak dapat dihitung, `cr = null`, `is_valid = true` dengan notifikasi

#### 8.10.2 Get AHP Calculation Result

```
GET /api/ahp/calculations/:id
```

**Role:** SUPER_ADMIN, KEPALA_SEKOLAH

**Response (200 OK):** AHP calculation object lengkap

#### 8.10.3 Get Valid AHP for Period (default: latest valid)

```
GET /api/ahp/calculations
```

**Role:** SUPER_ADMIN, KEPALA_SEKOLAH

**Query params:**
- `academic_period_id`
- `is_valid` (default: true)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "academic_period_id": "uuid",
      "calculated_at": "ISO8601",
      "ci": "number",
      "cr": "number | null",
      "ri": "number",
      "is_valid": "boolean",
      "weight_vector": { ... }
    }
  ]
}
```

### 8.11 TOPSIS Calculations (Perhitungan TOPSIS)

#### 8.11.1 Run TOPSIS Calculation

```
POST /api/topsis/calculate
```

**Role:** SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid",
  "ahp_calculation_id": "uuid"  // opsional, jika tidak diisi pakai yang terbaru valid
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "academic_period_id": "uuid",
  "ahp_calculation_id": "uuid",
  "calculated_at": "ISO8601",
  "M": "number (jumlah siswa yang dihitung)",
  "N": "number (jumlah kriteria aktif)",
  "siswa_excluded_missing": "number",
  "list_siswa_excluded": ["SISWA_CODE_1", "SISWA_CODE_2"],  // anonym
  "created_by": "uuid",
  "summary": { ... }
}
```

**Catatan:**
- Sistem mengambil bobot AHP dari `ahp_calculations` yang valid (CR ≤ 0.10)
- Sistem membaca semua siswa yang memiliki nilai lengkap untuk semua kriteria aktif
- Siswa dengan missing value excluded dan dicatat
- Hasil ranking disimpan di `topsis_calculations.rank`

#### 8.11.2 Get TOPSIS Calculation Result

```
GET /api/topsis/calculations/:id
```

**Role:** SUPER_ADMIN, KEPALA_SEKOLAH

**Response (200 OK):**
```json
{
  "id": "uuid",
  "academic_period_id": "uuid",
  "ahp_calculation_id": "uuid",
  "calculated_at": "ISO8601",
  "M": "number",
  "N": "number",
  "siswa_excluded_missing": "number",
  "list_siswa_excluded": ["..."],
  "ranking": [
    {
      "rank": 1,
      "student_code": "string",
      "nilai_preferensi": "number"
    },
    ...
  ],
  "decision_matrix": { ... },
  "normalized_matrix": { ... },
  "weighted_matrix": { ... },
  "ideal_positive": { ... },
  "ideal_negative": { ... },
  "distance_positive": { ... },
  "distance_negative": { ... },
  "preference_value": { ... },
  "rank": { "student_code": rank }
}
```

#### 8.11.3 Get Latest Ranking for Period

```
GET /api/topsis/ranking
```

**Role:** SUPER_ADMIN, KEPALA_SEKOLAH, GURU (hanya untuk siswa di kelasnya)

**Query params:**
- `academic_period_id`
- `topsis_calculation_id` (opsional, jika tidak diisi pakai yang terbaru)

**Response (200 OK):**

Untuk SUPER_ADMIN dan KEPALA_SEKOLAH:
```json
{
  "ranking": [
    {
      "rank": 1,
      "student_code": "string",
      "student_name": "string",
      "class_name": "string",
      "nilai_preferensi": "number"
    },
    ...
  ],
  "calculated_at": "ISO8601"
}
```

Untuk GURU (data terfilter):
```json
{
  "ranking": [
    {
      "rank": 5,
      "student_code": "string",
      "student_name": "string",
      "class_name": "string",
      "nilai_preferensi": "number"
    },
    ...
  ],
  "calculated_at": "ISO8601",
  "scope": "wali_class_only"
}
```

**Catatan:** GURU hanya menerima ranking untuk siswa di kelasnya sendiri. Sistem memfilter di backend (bukan hanya UI).

### 8.12 Laporan PDF (Report PDF)

#### 8.12.1 Generate Report PDF

```
POST /api/reports/generate
```

**Role:** KEPALA_SEKOLAH, SUPER_ADMIN

**Request body:**
```json
{
  "academic_period_id": "uuid",
  "topsis_calculation_id": "uuid",  // opsional
  "output_format": "pdf"  // atau "print"
}
```

**Response (200 OK / 202 Accepted):**
```json
{
  "report_id": "uuid",
  "status": "generating | ready",
  "download_url": "/api/reports/download/:reportId",  // jika sudah siap
  "message": "Laporan berhasil di-generate"
}
```

**Keterangan:**
- PDF berisi KOP Surat resmi instansi menggunakan `kop-header-jayabuana.png` (header) dan `kop-footer-jayabuana.png` (footer).
- Logo standalone `logo-smk-jayabuana.png` tidak digunakan di PDF — logo tersebut khusus untuk kebutuhan frontend (lihat 10-perancangan-ui-ux).
- Konten PDF: judul laporan, identitas, periode, tabel ranking, hasil perhitungan, ruang tanda tangan.

#### 8.12.2 Download Report PDF

```
GET /api/reports/download/:reportId
```

**Role:** KEPALA_SEKOLAH, SUPER_ADMIN

**Response:** File binary PDF (Content-Type: application/pdf)

#### 8.12.3 List Reports

```
GET /api/reports
```

**Role:** KEPALA_SEKOLAH, SUPER_ADMIN

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "academic_period_id": "uuid",
      "generated_by": "uuid",
      "generated_at": "ISO8601",
      "topsis_calculation_id": "uuid",
      "status": "ready"
    }
  ]
}
```

### 8.13 Audit Logs (Catatan Operations)

#### 8.13.1 List Audit Logs

```
GET /api/audit-logs
```

**Role:** SUPER_ADMIN

**Query params:**
- `user_id`
- `action` (misal: calculate, create, update, delete)
- `resource_type` (misal: students, criteria, ahp_calculations)
- `resource_id`
- `from_date`, `to_date`
- `page`, `limit`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "string",
      "action": "string",
      "resource_type": "string",
      "resource_id": "uuid | null",
      "details": "json | null",
      "ip_address": "string",
      "created_at": "ISO8601"
    }
  ],
  "meta": { ... }
}
```

**Keterangan:** Audit logs mencatat setiap operasi penting: login, CRUD data, perhitungan AHP/TOPSIS, generate report.

#### 8.13.2 Create Audit Log (internal)

Internal service memanggil method langsung untuk mencatat log. Tidak perlu endpoint publik.

### 8.14 Endpoint Ringkasan

| Resource | Method | Path | Role | Keterangan |
|----------|--------|------|------|------------|
| Auth | POST | /api/auth/login | Semua | Login, dapat JWT |
| Auth | POST | /api/auth/refresh | Semua | Refresh token |
| Auth | POST | /api/auth/logout | Semua | Logout |
| Auth | GET | /api/auth/me | Semua | Get current user |
| Users | GET | /api/users | SUPER_ADMIN | List users |
| Users | POST | /api/users | SUPER_ADMIN | Create user |
| Users | PATCH | /api/users/:id | SUPER_ADMIN | Update user |
| Users | DELETE | /api/users/:id | SUPER_ADMIN | Soft delete |
| AcademicPeriods | GET | /api/academic-periods | Semua | List periods |
| AcademicPeriods | POST | /api/academic-periods | SUPER_ADMIN | Create period |
| AcademicPeriods | PATCH | /api/academic-periods/:id | SUPER_ADMIN | Update period |
| AcademicPeriods | DELETE | /api/academic-periods/:id | SUPER_ADMIN | Delete period |
| AcademicPeriods | POST | /api/academic-periods/:id/set-active | SUPER_ADMIN | Set active period |
| Classes | GET | /api/classes | Semua | List classes (dengan filtering GURU) |
| Classes | POST | /api/classes | SUPER_ADMIN | Create class |
| Classes | PATCH | /api/classes/:id | SUPER_ADMIN | Update class |
| Classes | DELETE | /api/classes/:id | SUPER_ADMIN | Delete class |
| Students | GET | /api/students | Semua | List students (dengan filtering GURU) |
| Students | POST | /api/students | SUPER_ADMIN, GURU | Create student |
| Students | PATCH | /api/students/:id | SUPER_ADMIN, GURU | Update student |
| Students | GET | /api/students/:id | Semua | Get student detail |
| Students | GET | /api/students/:id/scores | Semua | Get scores for student |
| Criteria | GET | /api/criteria | Semua | List criteria |
| Criteria | POST | /api/criteria | SUPER_ADMIN | Create criteria |
| Criteria | PATCH | /api/criteria/:id | SUPER_ADMIN | Update criteria |
| Criteria | DELETE | /api/criteria/:id | SUPER_ADMIN | Soft delete |
| Scores | GET | /api/scores | Semua | List scores (dengan filtering) |
| Scores | POST | /api/scores | GURU, SUPER_ADMIN | Create single score |
| Scores | POST | /api/scores/bulk | GURU, SUPER_ADMIN | Bulk create/update scores |
| AHP | GET | /api/ahp/comparisons | SUPER_ADMIN | List comparisons |
| AHP | POST | /api/ahp/comparisons | SUPER_ADMIN | Create single comparison |
| AHP | POST | /api/ahp/comparisons/bulk | SUPER_ADMIN | Bulk create comparisons |
| AHP | GET | /api/ahp/comparisons/matrix | SUPER_ADMIN | Get comparison matrix |
| AHP | POST | /api/ahp/calculate | SUPER_ADMIN | Run AHP calculation |
|| AHP | GET | /api/ahp/calculations | SUPER_ADMIN, KEPALA_SEKOLAH | List AHP calculations |
|| AHP | GET | /api/ahp/calculations/:id | SUPER_ADMIN, KEPALA_SEKOLAH | Get AHP calculation |
| TOPSIS | POST | /api/topsis/calculate | SUPER_ADMIN | Run TOPSIS calculation |
| TOPSIS | GET | /api/topsis/calculations/:id | SUPER_ADMIN, KEPALA | Get TOPSIS calculation |
| TOPSIS | GET | /api/topsis/ranking | Semua | Get latest ranking (dengan filtering GURU) |
| Reports | POST | /api/reports/generate | KEPALA, SUPER_ADMIN | Generate PDF report |
| Reports | GET | /api/reports/download/:id | KEPALA, SUPER_ADMIN | Download PDF |
| Reports | GET | /api/reports | KEPALA, SUPER_ADMIN | List reports |
| AuditLogs | GET | /api/audit-logs | SUPER_ADMIN | List audit logs |

### 8.15 Validasi Input (DTO) untuk setiap endpoint

Semua endpoint divalidasi dengan DTO class-validator:

**Contoh validasi yang umum:**

1. **Email:** Format email yang valid
2. **Password:** Minimal 8 karakter (untuk create user)
3. **UUID:** Format UUID yang benar
4. **Number:** Rentang nilai yang valid (misal: 0-100 untuk nilai siswa, 1-9 untuk perbandingan AHP)
5. **Boolean:** Hanya true/false
6. **Date:** Format tanggal yang valid
7. **Array:** Tidak kosong jika diperlukan
8. **Required vs Optional:** Field yang wajib diisi dilabeli `@IsNotEmpty()` / `@IsOptional()`

**Validasi khusus:**
- **Scores value:** Harus numerik, tidak bisa diisi jika `is_missing = true`
- **AHP comparison:** Harus > 0, direkomendasikan 1–9 (atau reciprocalnya)
- **AHP calculation:** Wajib ada comparisons untuk semua pasangan yang diperlukan (tanpa diagonal)
- **TOPSIS calculation:** Wajib ada bobot AHP yang valid; wajib ada minimal 1 siswa dengan nilai lengkap

### 8.16 RBAC Implementation Notes

#### 8.16.1 SUPER_ADMIN

- Mengakses semua endpoint tanpa batasan data
- Mampu mengelola semua aspek sistem

#### 8.16.2 GURU

- **Data isolation enforced di backend:**
  - Setiap request ke endpoint yang mengembalikan data siswa/kelas/dinilai dengan `owned_class_ids` filter
  - Query database selalu include `WHERE classes.wali_teacher_id = :userId` atau filter yang setara
  - Tidak hanya menyembunyikan data di UI — data benar-benar tidak di-query untuk kelas lain
- **Operasi yang diizinkan:**
  - Input dan manage nilai siswa di kelasnya
  - Lihat ranking untuk kelasnya (dengan scope limiter)
  - Akses ke criteria, academic periods (list only)

#### 8.16.3 KEPALA_SEKOLAH

- Akses ke:
  - Ranking dan hasil TOPSIS
  - Generate laporan PDF
  - Review data (read-only untuk sebagian besar operasi)
- Tidak memiliki akses ke:
  - CRUD pengguna
  - CRUD kriteria
  - Konfigurasi AHP (input comparisons)
  - Input nilai (hanya GURU yang bisa)

### 8.17 Error Handling Standar

Semua API error mengembalikan format standar:

```json
{
  "statusCode": 400,
  "message": "Deskripsi error yang manusia-baca",
  "error": "Bad Request",
  "details": { ... }  // opsional, untuk validation errors
}
```

**HTTP Status yang digunakan:**

| Status | Kondisi |
|--------|---------|
| 200 | OK (operasi berhasil, read-only) |
| 201 | Created (resource baru dibuat) |
| 204 | No Content (hapus/operasi tanpa response body) |
| 400 | Bad Request (validasi gagal, input tidak valid) |
| 401 | Unauthorized (token tidak valid/expired) |
| 403 | Forbidden (user tidak punya akses ke resource tertentu) |
| 404 | Not Found (resource tidak ditemukan) |
| 409 | Conflict (misal: period sudah aktif, duplicate entry) |
| 500 | Internal Server Error (error tidak terduga) |

### 8.18 Pagination & Filtering

Semua endpoint yang mengembalikan array (list) menggunakan standar:

```
GET /api/resource?page=1&limit=10&sort=-createdAt&filter=value
```

**Response selalu berisi `meta` dengan:**
- `total`: jumlah total record yang sesuai filter
- `page`: halaman saat ini
- `limit`: jumlah per halaman
- `totalPages`: total halaman

**Sort default:** `createdAt DESC`

### 8.19 Keamanan Data

1. **Tidak ada password di response:** Password hanya di-input (POST/PATCH dengan password) dan tidak pernah dikembalikan
2. **Tidak ada token di response:** Token hanya di-generate saat login/logout, tidak dikembalikan di endpoint lain
3. **Anonymisasi di report/UI:** Ranking dan data eksternal menggunakan `student_code` (bukan nama lengkap jika sensitif)
4. **Role-based access:** Setiap endpoint dilindungi guard
5. **Rate limiting:** Endpoint auth bisa dibatasi rate-nya untuk mencegah brute force
6. **Audit log:** Setiap operasi penting dicatat

### 8.20 Appendix: Struktur Folder API (skema logika, bukan implementasi)

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh.dto.ts
│   │   └── me.dto.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── users.entity.ts (Prisma)
├── academic-periods/
│   └── ...
├── classes/
│   └── ...
├── students/
│   └── ...
├── criteria/
│   └── ...
├── scores/
│   └── ...
├── ahp/
│   ├── ahp.controller.ts
│   ├── ahp.service.ts
│   └── dto/
│       ├── calculate-ahp.dto.ts
│       └── comparisons.dto.ts
├── topsis/
│   ├── topsis.controller.ts
│   ├── topsis.service.ts
│   └── dto/
│       └── calculate-topsis.dto.ts
├── reports/
│   ├── reports.controller.ts
│   └── reports.service.ts
└── audit-logs/
    └── ...
```

---

*Dokumen ini merupakan Bagian 8 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md beserta Bagian 1–7.*
