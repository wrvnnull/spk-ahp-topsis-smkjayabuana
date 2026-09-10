# RANCANGAN SISTEM
## 9. KEAMANAN SISTEM DAN RBAC

### 9.1 Pendahuluan

Bagian ini mendokumentasikan aspek keamanan sistem dan penerapan Role-Based Access Control (RBAC) untuk Sistem Penunjang Keputusan AHP-TOPSIS SMK Jaya Buana. Dokumen ini mengacu pada Bagian 4 (Spesifikasi Basis Data), Bagian 8 (REST API), dan requirement proyek secara keseluruhan.

### 9.2 Autentikasi: JWT dengan HttpOnly Cookie

#### 9.2.1 Mekanisme Autentikasi Wajib

Sistem menggunakan **JSON Web Token (JWT)** sebagai mekanisme autentikasi stateless, dengan kedua token disimpan melalui **HttpOnly Cookie**:

- **Access token:** JWT pendek dengan masa berlaku 15–30 menit, digunakan untuk meng-authenticate request ke API.
- **Refresh token:** JWT panjang dengan masa berlaku 7–30 hari, digunakan untuk memperoleh access token baru.

**Alur:**
1. Login (`POST /api/auth/login`) — server meng-generate access token dan refresh token, mengirim keduanya sebagai `Set-Cookie` header.
2. Request selanjutnya — browser mengirim access token otomatis melalui cookie dalam setiap request.
3. Refresh (`POST /api/auth/refresh`) — refresh token dibaca dari httpOnly cookie, server meng-generate access token baru.
4. Logout (`POST /api/auth/logout`) — server menghapus kedua cookie.

**Keputusan desain:** Token TIDAK dikembalikan di response body dan TIDAK disimpan di `localStorage` atau `sessionStorage`. Ini mencegah akses script-side pada token dan mengurangi risiko XSS-based token theft.

#### 9.2.2 Konsistensi dengan Bagian 8

- `POST /api/auth/login` (Bagian 8.2.1): response body tidak mengandung `accessToken`/`refreshToken`, hanya user object. Cookie dikirim terpisah.
- `POST /api/auth/refresh` (Bagian 8.2.2): refresh dari cookie.
- `POST /api/auth/logout` (Bagian 8.2.3): hapus cookie.
- `GET /api/auth/me` (Bagian 8.2.4): tidak mengembalikan token, hanya user object.

#### 9.2.3 Kebijakan Refresh Token: Desain Saat Ini

Desain refresh token saat ini menggunakan pendekatan **expiry-based tanpa server-side session/revocation store**:

- Refresh token hanya disimpan sebagai **HttpOnly cookie**. Token tidak dibaca dari Authorization header — hanya dari cookie yang otomatis dikirim browser.
- Refresh token memiliki expiry tetap (7–30 hari, sesuai konfigurasi). Setelah expiry, refresh token tidak dapat digunakan untuk memperoleh access token baru.
- **Logout** (`POST /api/auth/logout`) menghapus access token dan refresh token dari cookie di browser. Namun, penghapusan cookie **tidak menginvalidasi token di sisi server** — refresh token yang sebelumnya dicuri (misalnya melalui serangan XSS yang berhasil, meski HttpOnly cookie mengurangi risiko ini) tetap dapat digunakan sampai expired.
- **Tidak ada server-side session store atau tabel revocation** pada desain saat ini. Artinya, server tidak melacak daftar refresh token yang aktif dan tidak memiliki mekanisme untuk me-revoke refresh token sebelum expired.
- **Konsekuensi keamanan:** Jika refresh token dicuri sebelum logout atau sebelum expiry, penyerang dapat memperoleh access token baru selama sisa masa berlaku refresh token. Ini adalah trade-off dari desain stateless yang lebih sederhana.

**Mitigasi yang ada:**

- Access token memiliki masa berlaku pendek (15–30 menit), sehingga jendela eksploitasi terbatas.
- Refresh token기간이 상대적으로 길지만, access token의 짧은 수명 덕분에 실질적인 피해는 제한됩니다.

**Enhancement masa depan (opsional, bukan bagian dari desain saat ini):**

Jika di masa depan diperlukan server-side revocation (misalnya untuk fitur "logout dari semua perangkat" atau suspensi akun yang memerlukan invalidasi segera), dapat ditambahkan:

- Tabel `refresh_tokens` yang menyimpan hash token, `user_id`, `expires_at`, `revoked_at`, dan metadata lainnya.
- Server memvalidasi refresh token terhadap tabel ini pada setiap request refresh, dan menolak request jika token sudah revoked atau expired.
- Logout tidak hanya menghapus cookie, tetapi juga menandai token sebagai revoked di server.

**Catatan:** Pengembangan ini tidak termasuk dalam scope rancangan saat ini dan tidak memerlukan perubahan skema database yang ada. Jika pada masa depan dianggap perlu, dapat diimplementasikan sebagai fitur terpisah tanpa memengaruhi desain yang sudah ada.

### 9.3 Keamanan Cookie

#### 9.3.1 Atribut Cookie Wajib

| Atribut | Nilai | Keterangan |
|---------|-------|------------|
| **HttpOnly** | `true` | Mencegah akses JavaScript ke cookie (melindungi dari XSS). Wajib. |
| **Secure** | `true` (production) / `false` (development) | Cookie hanya dikirim via HTTPS. Di production wajib `true`. Di development (localhost HTTP) bisa `false` dengan catatan keamanan. |
| **SameSite** | `Lax` atau `Strict` | Mencegah CSRF. `Lax` mengizinkan cookie dikirim saat navigasi top-level (GET), `Strict` lebih ketat. Rekomendasi: `Lax` untuk UX yang wajar, `Strict` jika aplikasi hanya expects cookie dalam request yang dimulai dari aplikasi itu sendiri. |
| **Expires / Max-Age** | Sesuai masa berlaku token | Access token: 15–30 menit. Refresh token: 7–30 hari. |
| **Path** | `/` | Cookie tersedia untuk seluruh domain aplikasi. |
| **Domain** | Sesuai domain aplikasi | Contoh: `.smkjayabuana.sch.id` atau `localhost` untuk development. |

#### 9.3.2 CSRF Mitigation

Meskipun cookie dengan `SameSite=Lax/Strict` memberikan perlindungan CSRF dasar, untuk endpoint yang mengubah state (POST, PATCH, DELETE) disarankan tambahan:

- **Double-submit cookie pattern** atau **CSRF token** untuk request state-changing (opsional karena JWT dalam cookie masih rentan terhadap CSRF jika SameSite tidak Strict).
- **Cara kerja:** Client mengirim CSRF token sebagai custom header atau bentuk tersendiri. Server membandingkan dengan nilai di cookie.

**Rekomendasi:** Gunakan `SameSite=Strict` jika aplikasi hanya digunakan oleh pengguna yang memulai request dari aplikasi itu sendiri dan tidak dipanggil dari situs eksternal. Jika diperlukan integrasi eksternal yang membuka aplikasi (misal: SSO link), `SameSite=Lax` dengan CSRF token adalah kompromi yang lebih aman daripada tanpa proteksi.

#### 9.3.3 HttpOnly Cookie: Keuntungan dan Keterbatasan

**Keuntungan:**
- Tidak terpapar ke JavaScript → proteksi dari XSS.
- Otomatis dikirim browser → tidak perlu manajemen token manual di client.

**Keterbatasan:**
- CSRF masih memungkinkan jika attacker dapat menyusun request yang mengirim cookie (meski `SameSite` mengurangi risiko).
- Client tidak dapat membaca token untuk routing client-side berbasis role — client harus memetakan role via `GET /api/auth/me` (maksimal hanya menjangkau data yang diizinkan).

### 9.4 Password Hashing dan Kebijakan Password

#### 9.4.1 Hashing Wajib

Password TIDAK boleh disimpan dalam plaintext.

- **Algoritma:** bcrypt atau Argon2id (direkomendasikan Argon2id karena lebih tahan terhadap serangan GPU/ASIC).
- **Salt:** Secara otomatis dihasilkan oleh algoritma.
- **Cost factor:** bcrypt cost >= 12, Argon2id dengan parameter yang sesuai dengan hardware server.

**Alur:**
1. Saat registrasi/update password, client mengirim password plaintext.
2. Backend mem-oneyte password sebelum dikirim ke database (via HTTPS).
3. Backend mem-hash password dengan salt.
4. Hanya hash yang disimpan.
5. Saat login, backend mem-hash password yang dikirim dan membandingkan dengan hash yang tersimpan menggunakan fungsi compare.

#### 9.4.2 Polarksi Password

- Minimal 8 karakter.
- Disarankan: kombinasi huruf, angka, dan karakter khusus.
- Tidak boleh menggunakan password yang umum (credential stuffing protection via password deny list opsional).
- Password harus dilewatkan HTTPS (wajib). Jangan mengirim password via HTTP.

#### 9.4.3 Rekomendasi: Rotation dan Expiry

- Password expiry (wajib ganti setiap X bulan) bersifat opsional untuk aplikasi internal.
- Jika diterapkan, notifikasi email kepada pengguna sebelum expiry.

### 9.5 Role-Based Access Control (RBAC)

#### 9.5.1 Definisi Role

Sistem mendefinisikan tepat **3 role utama**:

| Role | Keterangan |
|------|------------|
| **SUPER_ADMIN** | Pengguna dengan kewenangan penuh untuk mengelola seluruh aspek sistem. |
| **GURU** | Wali kelas yang bertanggung jawab mengelola data siswa dan nilai untuk kelas yang diassigned. |
| **KEPALA_SEKOLAH** | Pengguna yang fokus pada review dan pelaporan hasil perhitungan AHP-TOPSIS. |

#### 9.5.2 Hak Khusus SUPER_ADMIN

- CRUD pengguna (termasuk mengelola role).
- CRUD periode akademik dan mengatur periode aktif.
- CRUD kelas (menentukan wali_teacher_id).
- CRUD siswa (semua kelas).
- CRUD kriteria (buat, update, aktifkan/nonaktifkan).
- CRUD dan management AHP comparisons (perbandingan).
- Melakukan dan memantau perhitungan AHP.
- Melakukan dan memantau perhitungan TOPSIS.
- Melihat seluruh ranking dan detail.
- Generate laporan PDF.
- Mengelola audit logs (melihat).

#### 9.5.3 Hak Khusus GURU

- Lihat data period akademik (read-only).
- Lihat kelas yang menjadi tanggung jawabnya (read-only).
- CRUD siswa hanya untuk kelasnya sendiri.
- Input dan manage nilai siswa hanya untuk kelasnya sendiri.
- Lihat ranking untuk kelasnya (dengan scope terbatas).
- Lihat criteria (read-only).
- Lihat AHP calculation? → **TIDAK** per keputusan desain (lihat 9.5.3.1).

**Keputusan:** GURU tidak diizinkan melihat hasil perhitungan AHP (bobot). Konfigurasi AHP dan pengetahuan tentang bobot kriteria adalah hak SUPER_ADMIN dan KEPALA_SEKOLAH.

#### 9.5.4 Hak Khusus KEPALA_SEKOLAH

- Lihat data period akademik (read-only).
- Lihat kelas dan siswa (read-only, seluruh data).
- Lihat dan review hasil perhitungan AHP dan TOPSIS (bukan konfigurasi).
- Melihat ranking untuk seluruh sekolah.
- Generate laporan PDF.
- Melihat list laporan yang di-generate.
- Tidak memiliki akses ke:
  - CRUD pengguna.
  - CRUD kriteria.
  - Input comparisons AHP.
  - Input nilai (hanya GURU).
  - Membuat atau mengkonfigurasi perhitungan AHP.

### 9.6 Backend Authorization dan Data Isolation GURU

#### 9.6.1 Prinsip Utama: Backend Enforcement, Bukan Sekadar UI

Data isolation GURU TIDAK hanya dilakukan dengan menyembunyikan data di frontend. Backend secara eksplisit memfilter data:

1. **Setiap query database untuk data yang berkaitan dengan kelas harus menyertakan filter berdasarkan `wali_teacher_id = user.id`.**
2. **Akses ke student, kelas, dan scores harus selalu di-filter di backend.**
3. **Guard dan interceptor NestJS harus memvalidasi ownership sebelum query dieksekusi.**

#### 9.6.2 Ownership Berdasarkan `classes.wali_teacher_id`

- GURU ownership ditentukan melalui relasi `classes.wali_teacher_id → users.id`, bukan melalui kolom di tabel `users`. Satu GURU dapat memiliki beberapa kelas (1:N). Saat login, GURU mendapatkan daftar `owned_class_ids` (array UUID) dari tabel `classes` berdasarkan `wali_teacher_id = user.id`.
- Query ke `students`, `classes`, dan `scores` harus selalu join atau filter menggunakan `classes.wali_teacher_id = :userId`.
- Contoh query:

```sql
-- List siswa milik GURU tertentu
SELECT s.* FROM students s
JOIN classes c ON s.class_id = c.id
WHERE c.wali_teacher_id = :userId
  AND c.academic_period_id = :periodId;
```

```sql
-- List scores milik GURU tertentu
SELECT sc.* FROM scores sc
JOIN students s ON sc.student_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE c.wali_teacher_id = :userId
  AND sc.academic_period_id = :periodId;
```

#### 9.6.3 Proteksi terhadap Manipulasi ID/URL

GURU TIDAK boleh dapat membaca atau mengubah data kelas/siswa lain dengan memanipulasi UUID di URL atau request body.

**Mekanisme perlindungan:**

1. **Parameter `id` atau `class_id` yang diterima endpoint harus selalu divalidasi ownership.**
2. **Untuk endpoint tertentu (misal: `GET /api/students/:id`, `PATCH /api/students/:id`), backend harus memeriksa apakah siswa tersebut berada di kelas yang menjadi tanggung jawab GURU.**
3. **Jika siswa/kelas tersebut tidak milik GURU, kembalikan `403 Forbidden` dengan pesan yang sesuai (tanpa membocorkan informasi internal).**

**Contoh logika validasi di backend (pseudocode):**

```typescript
// Pseudocode — bukan implementasi aktual
async function getStudentById(studentId: string, userId: string, role: string): Promise<Student | null> {
  // Semua role boleh melihat detail siswa milik kelasnya sendiri,
  // dan SUPER_ADMIN dapat melihat semua siswa.
  // GURU hanya boleh melihat siswa di kelasnya.

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });

  if (!student) return null;

  if (role === 'GURU') {
    // GURU ownership ditentukan melalui classes.wali_teacher_id, bukan kolom di users.
    // owned_class_ids adalah claim JWT yang berisi daftar UUID kelas yang dimiliki GURU.
    const userClasses = await prisma.class.findMany({
      where: { wali_teacher_id: userId },
      select: { id: true },
    });
    const ownedClassIds = userClasses.map(c => c.id);
    if (!ownedClassIds.includes(student.class_id)) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data ini.');
    }
  }

  return student;
}
```

Penting: Validasi ini dilakukan di **backend**, bukan di frontend.

#### 9.6.4 Lingkup Akses GURU

- GURU hanya dapat mengakses data yang berkaitan dengan kelas yang ditunjuk sebagai `wali_teacher_id` milik GURU tersebut di tabel `classes`.
- Ini mencakup: siswa di kelas tersebut, nilai untuk siswa tersebut, dan hanya kelas tersebut.
- GURU TIDAK dapat melihat atau mengubah data kelas lain, termasuk melihat detail siswa di kelas lain.

### 9.7 Validasi DTO dan Sanitasi Input

#### 9.7.1 Validasi DTO (Wajib)

Semua request body, query parameter, dan path parameter yang berkaitan dengan input pengguna harus divalidasi menggunakan **DTO class-validator** dalam NestJS:

- Menggunakan `@IsString()`, `@IsNumber()`, `@IsUUID()`, `@IsEmail()`, `@IsBoolean()`, `@IsOptional()`, `@Min()`, `@Max()`, `@Length()`, dll.
- Menggunakan `class-transformer` untuk memetakan dan memvalidasi tipe data otomatis.
- Validasi terjadi sebelum request mencapai service layer.

#### 9.7.2 Jenis Validasi yang Dilakukan

| Tipe | Validasi |
|------|----------|
| Email | Format email yang valid (`@IsEmail()`). |
| Password | Minimal 8 karakter, pattern tertentu. |
| UUID | Format UUID yang benar (`@IsUUID(4)`). |
| Number | Rentang nilai yang valid (misal: 0-100 untuk skor, 1-9 untuk AHP). |
| Boolean | Hanya true/false (`@IsBoolean()`). |
| Date | Format tanggal yang valid (`@IsDateString()`). |
| Array | Tidak kosong jika wajib; panjang array bisa dibatasi. |
| Required vs Optional | Field wajib menggunakan `@IsNotEmpty()` atau `@IsRequired()`, field opsional menggunakan `@IsOptional()`. |

#### 9.7.3 Sanitasi Input

- **SQL Injection:** Digunakan Prisma ORM yang memproteksi dari SQL injection karena menggunakan parameterized queries. Tidak ada query dinamis yang rawan.
- **NoSQL Injection:** Tidak relevan karena menggunakan PostgreSQL relasional.
- **XSS (Cross-Site Scripting):** Backend harus memvalidasi bahwa input teks (misal: name, description) tidak mengandung script berbahaya jika akan ditampilkan kembali di frontend. Framework frontend (React/Next.js) secara default melakukan escape terhadap output.
- **Pemotokan karakter berbahaya:** Jika diperlukan, sanitasi dengan `DOMPurify` atau library serupa di frontend, atau validasi strictly pada backend.

#### 9.7.4 Keamanan Validasi di Frontend

Validasi di frontend bersifat sebagai UX enhancement dan bukan pengganti validasi backend. Backend tetap wajib memvalidasi setiap request.

### 9.8 Rate Limiting dan Brute-Force Protection

#### 9.8.1 Rate Limiting Wajib

- **Endpoint auth (login, refresh):** Terapkan rate limiting (misal: 5 request per menit per IP, atau 10 per menit per user). Ini mencegah serangan brute-force pada password.
- **Endpoint lainnya:** Rate limiting opsional tergantung kebutuhan (misal: endpoint yang resource-intensive seperti perhitungan AHP/TOPSIS sebaiknya dibatasi agar tidak disalahgunakan).

#### 9.8.2 Implementasi Rate Limiting

- Gunakan `nestjs/throttler` (`@nestjs/throttler`) atau middleware serupa.
- Konfigurasi dapat disesuaikan per environment (development vs production).

#### 9.8.3 Brute-Force Protection Tambahan

- Setelah sejumlah kegagalan login berturut-turut, secara sementara blokir IP tersebut (misal: 30 menit) atau meminta CAPTCHA.
- Logging:
  - Catat kegagalan login untuk monitoring.
  - Jangan catat password yang salah.

### 9.9 CORS dan Konfigurasi Environment/Secret

#### 9.9.1 CORS (Cross-Origin Resource Sharing)

- Konfigurasi CORS untuk mengizinkan request hanya dari origin yang sah (domain frontend).
- Untuk development: mengizinkan `localhost:<port>`.
- Untuk production: hanya domain resmi aplikasi (misal: `https://spk.smkjayabuana.sch.id`).
- Jangan mengizinkan `Access-Control-Allow-Origin: *` di production.

#### 9.9.2 Konfigurasi Secret dan Environment Variables

- Gunakan `.env` untuk menyimpan konfigurasi yang sensitif.
- **JANGAN pernah commit `.env` ke repository.**
- Gunakan `.env.example` sebagai template (dengan placeholder).
- Secret yang disimpan di `.env`:
  - `DATABASE_URL`: connection string PostgreSQL.
  - `JWT_ACCESS_SECRET`: secret untuk access token.
  - `JWT_REFRESH_SECRET`: secret untuk refresh token (boleh sama atau beda).
  - `BCRYPT_ROUNDS` atau `ARGON2_PARAMS`: parameter hashing.
  - `COOKIE_DOMAIN`: domain untuk cookie.
  - `API_PORT`: port aplikasi.

#### 9.9.3 Penyimpanan Secret yang Aman (Rekomendasi)

- Di production, pertimbangkan penggunaan secret manager (misal: AWS Secrets Manager, Google Secret Manager, HashiCorp Vault) daripada `.env`.
- Rotation secret secara berkala (misal: setiap 90 hari).

### 9.10 Proteksi Data Sensitif dan Repository

#### 9.10.1 Jangan Pernah Memasukkan Data Sensitif ke Repository Publik

Aturan ini bersifat **wajib** dan tidak ada pengecualian:

| Item | Status | Keterangan |
|------|--------|------------|
| **SKRIPSI.docx** | JANGAN COMMIT | Dokumen akademik. |
| **Bab 1–5** | JANGAN COMMIT | Narasi skripsi. |
| **Excel data nilai asli** | JANGAN COMMIT | Data sensitif. |
| **Nama siswa asli** | JANGAN COMMIT | Data pribadi. |
| **NIS/NISN** | JANGAN COMMIT | Data identitas. |
| **Logo sekolah resmi** | JANGAN COMMIT | Hak cipta/privasi, kecuali ada izin publikasi. |
| **PDF referensi** | JANGAN COMMIT | Bahan akademik. |
| **Credential (password, API key, token)** | JANGAN COMMIT | Rahasia. |
| **`.env`** | JANGAN COMMIT | Secret. |
| **Connection string dengan password** | JANGAN COMMIT | Rahasia. |
| **File `.env` lokal** | JANGAN COMMIT | Secret. |

#### 9.10.2 Penggantian dengan Data Dummy/Anonymized

- Jika contoh data dibutuhkan dalam dokumentasi atau fixture, gunakan data dummy/anonymized.
- Contoh: `student_code: "STU-001"` alih-alih nama asli. `name: "Siswa 1"` alih-alih nama asli.
- Bobot AHP contoh: `{"C1": 0.4, "C2": 0.3, "C3": 0.2, "C4": 0.1}` sebagai contoh matematis, bukan data sekolah nyata.

#### 9.10.3 Logo Sekolah

- Logo sekolah TIDAK dimasukkan ke repository publik tanpa izin eksplisit dari institusi.
- Untuk tujuan mockup/prototype, gunakan placeholder (misal: teks "SMK Jaya Buana" tanpa logo).
- Jika logo resmi digunakan di laporan PDF yang dihasilkan sistem (di lingkungan internal), pastikan berada di lingkungan yang terkontrol dan tidak diekspor ke repository.

### 9.11 Audit Logging

#### 9.11.1 Operasi yang Wajib Dicatat

Audit logs mencatat operasi penting tanpa menyimpan informasi sensitif:

| Operasi | Contoh |
|---------|--------|
| Login | Sukses/gagal, user, IP, waktu. |
| CRUD pengguna | Create, update, delete user. |
| CRUD data akademik | Create/update/delete student, kelas, criteria, scores. |
| Konfigurasi AHP | Input comparisons, update AHP calculation. |
| Perhitungan AHP/TOPSIS | Run calculate, hasil. |
| Generate laporan | Generate dan download PDF. |
| Set active period | Aktivasi periode akademik. |

#### 9.11.2 Format Audit Log

Audit log harus mencakup:

- `id`: UUID unik.
- `user_id`: ID pengguna yang melakukan operasi.
- `user_name`: Nama pengguna.
- `action`: Jenis aksi (CREATE, UPDATE, DELETE, LOGIN, CALCULATE, dll.).
- `resource_type`: Tipe resource yang dipengaruhi (users, students, criteria, dll.).
- `resource_id`: ID resource jika relevan.
- `details`: JSON tambahan (opsional, tapi tanpa secret).
- `ip_address`: Alamat IP pengirim request.
- `created_at`: Timestamp operasi.

#### 9.11.3 Hal yang TIDAK Perlu Dicatat

- Password atau hash password.
- Token (access atau refresh).
- Data sensitif seperti NIS/NISN, nama siswa dalam konteks yang sensitif (jika audit log bersifat publik atau tidak terkontrol).
- Data koneksi database.
- Secret dan kunci.

#### 9.11.4 Retention dan Akses

- Audit log disimpan dalam tabel `audit_logs` (lihat Bagian 4).
- Akses ke audit log: **SUPER_ADMIN** dan mungkin **KEPALA_SEKOLAH** untuk keperluan review.
- Retention: minimal sesuai kebijakan institusi (misal: 1-2 tahun). Mekanisme archiving/retensi bisa diimplementasi kemudian.

### 9.12 Error Handling dan Informasi yang Tidak Bocor

#### 9.12.1 Format Error yang Konsisten

Semua error API mengembalikan format standar (lihat Bagian 8.17):

```json
{
  "statusCode": 403,
  "message": "Anda tidak memiliki akses ke resource ini.",
  "error": "Forbidden"
}
```

#### 9.12.2 Informasi yang TIDAK Bolehc Bocor dalam Error

- **Stack trace:** Jangan sertakan stack trace di production.
- **Query SQL atau detail implementasi:** Jangan expose di error message.
- **Link ke dokumentasi internal:** Menyarankan dokumentasi eksternal jika memang ada.
- **Detail validasi yang terlalu spesifik:** Jika ada validasi yang gagal, berikan pesan yang informatif tapi tidak mengungkap detail implementasi (misal: "Email tidak valid" daripada "Format email harus sesuai RFC 5322").

#### 9.12.3 Log Error di Backend

- Log error di backend untuk debugging, tetapi pastikan log tidak mengandung informasi sensitif (password, token, data pribadi).
- Gunakan formatter log yang mampu men-filter atau memask sensitive data.

### 9.13 Keamanan File dan Laporan PDF

#### 9.13.1 Laporan PDF

- Laporan PDF yang di-generate mengandung data siswa (ranking, nilai).
- File PDF harus di-generate di server dan disimpan dalam direktori yang terproteksi (tidak public).
- Link download ke file PDF harus:
  - Hanya diakses oleh pengguna yang berwenang (KEPALA_SEKOLAH, SUPER_ADMIN).
  - Menggunakan identifier yang sulit ditebak (UUID, bukan sequential).
  - Berlaku untuk periode tertentu atau dapat dikelola (expire setelah waktu tertentu).
- Jangan biarkan file PDF dapat diunduh tanpa authentication.

#### 9.13.2 Simpanan Laporan

- Laporan PDF disimpan sebagai file di storage (misal: `./reports/` atau storage service).
- Meta-data laporan disimpan di database (`reports` table) untuk tracking.
- File fisik tidak perlu disimpan permanen — bisa dihapus setelah periode tertentu atau diarsipkan.

#### 9.13.3 Template PDF

- Template laporan menggunakan KOP resmi instansi (`kop-header-jayabuana.png` dan `kop-footer-jayabuana.png`) sesuai keputusan rancangan. Logo resmi tidak digunakan sebagai logo standalone di PDF (hanya untuk frontend).
- Pastikan tidak ada informasi sensitif yang tidak perlu muncul di laporan (misal: jika laporan dibuat untuk publikasi, buat versi yang sudah di-anonymize).

### 9.14 Prinsip Least Privilege

- Setiap pengguna hanya diberikan akses yang minimal untuk menyelesaikan tugasnya.
- SUPER_ADMIN memiliki akses penuh karena memang fungsinya administratif.
- GURU memiliki akses terbatas hanya untuk kelas yang diassigned.
- KEPALA_SEKOLAH memiliki akses untuk melihat hasil dan membuat laporan, tapi tidak untuk mengubah konfigurasi sistem.
- Mengikuti prinsip: "Permit only what is necessary."

### 9.15 Checklist Keamanan Sebelum Deployment

#### 9.15.1 Checklist Sebelum Go Live

- [ ] **Secret Management:** Pastikan tidak ada `.env` atau file yang mengandung secret di repository. Gunakan `.env.example` sebagai template.
- [ ] **HTTPS:** Pastikan aplikasi di-deploy dengan HTTPS. Certificate valid.
- [ ] **Cookie Attributes:** Pastikan cookie access dan refresh token memiliki atribut `HttpOnly`, `Secure` (production), dan `SameSite` yang sesuai.
- [ ] **Rate Limiting:** Pastikan rate limiting aktif untuk endpoint autentikasi dan endpoint penting.
- [ ] **CORS:** Konfigurasi CORS hanya mengizinkan origin yang sah.
- [ ] **Validasi Input:** Pastikan semua DTO divalidasi di backend.
- [ ] **Data Isolation:** Pastikan query untuk GURU selalu difilter berdasarkan `wali_teacher_id`.
- [ ] **Audit Log:** Pastikan audit logging aktif dan mencatat operasi penting.
- [ ] **Error Handling:** Pastikan error messages tidak membocorkan informasi internal.
- [ ] **Backup dan Recovery:** Pastikan ada strategi backup database dan file.
- [ ] **Monitoring:** Pastikan ada monitoring untuk kegagalan login, error, dan aktivitas mencurigakan.
- [ ] **Password Policy:** Pastikan password di-hash dengan algoritma yang tepat (bcrypt/Argon2id).
- [ ] **Peninjauan RBAC:** Pastikan role dan hak akses sudah sesuai dengan requirement dan tidak ada akses yang berlebihan.
- [ ] **Test Keamanan Dasar:** Lakukan pengujian dasar (misal: mencoba mengakses endpoint tanpa authentication, mencoba memanipulasi ID sebagai GURU, mencoba CSRF dasar).

#### 9.15.2 Checklist Setelah Deployment

- [ ] **Log Monitoring:** Pantau log untuk aktivitas anomali.
- [ ] **Rotation Secret:** Jika menggunakan secret yang dapat berubah, pastikan ada rencana rotation.
- [ ] **Patch dan Update:** Pastikan dependensi dan framework terus diperbarui (meskipun ini lebih ke maintenance).

### 9.16 Batasan dan Hal yang Di Luar Scope

#### 9.16.1 Wajib diimplementasikan

1. JWT dengan httpOnly cookie untuk access dan refresh token.
2. Cookie dengan atribut `HttpOnly`, `Secure` (production), `SameSite`.
3. CSRF mitigation (terutama jika `SameSite` tidak Strict).
4. Password hashing (bcrypt atau Argon2id).
5. RBAC dengan 3 role: SUPER_ADMIN, GURU, KEPALA_SEKOLAH.
6. Backend data isolation untuk GURU berdasarkan `classes.wali_teacher_id`.
7. Proteksi terhadap manipulasi ID/URL.
8. Validasi DTO untuk seluruh endpoint.
9. Rate limiting untuk endpoint autentikasi.
10. CORS yang dikonfigurasi.
11. Audit logging untuk operasi penting (tanpa secret).
12. Error handling yang tidak membocorkan informasi internal.
13. Proteksi file/laporan PDF.
14. Security checklist sebelum deployment.

#### 9.16.2 Direkomendasikan (tidak wajib tapi disarankan)

1. Argon2id alih-alih bcrypt (jika tersedia).
2. Double-submit CSRF token atau mekanisme CSRF lain jika `SameSite` tidak Strict.
3. Secret manager (AWS Secrets Manager, dll.) alih-alih `.env` di production.
4. Monitoring dan alerting untuk aktivitas mencurigakan.
5. Rencana rotation password dan secret.
6. Backup database dan file yang terstruktur.
7. Peninjauan keamanan berkala.
8. CORS preflight caching yang tepat.
9. Implementasi logger yang tidak mencatat sensitif data.

#### 9.16.3 Di luar scope (tidak termasuk dalam rancangan ini)

1. Implementasi sistem pemantauan ancaman tingkat lanjut (misal: IDS/IPS).
2. Penyerangan keamanan fisik atau jaringan infrastruktur server.
3. Keamanan aplikasi mobile native (jika nanti dikembangkan).
4. Keamanan sistem operasi server dan konfigurasi server yang mendetail.
5. Sertifikasi keamanan tingkat lanjut.
6. Implementasi CAPTCHA (bisa ditambahkan di tahap nanti jika diperlukan).
7. Implementasi multi-factor authentication (MFA) — bisa ditambahkan jika diperlukan.

### 9.17 Konsistensi dengan Bagian Lain

- **Bagian 4 (Database):** Ownership GURU ditentukan melalui `classes.wali_teacher_id` (FK ke users.id), bukan melalui kolom di tabel `users`. GURU login mendapatkan claim `owned_class_ids` (daftar UUID kelas miliknya). Tabel `audit_logs` digunakan untuk audit logging. Tabel `scores` dengan `is_missing` dan `value` digunakan dalam konteks keamanan data.
- **Bagian 8 (REST API):** Endpoint-auth (login, refresh, logout) mengikutkan httpOnly cookie. Endpoint GURU difilter berdasarkan ownership. Error format yang dikemukakan di Bagian 8.17 konsisten dengan keamanan error handling.
- **Bagian 6 (AHP):** AHP calculation hanya oleh SUPER_ADMIN (sesuai RBAC). GURU tidak berhak mengkonfigurasi AHP.
- **Bagian 7 (TOPSIS):** TOPSIS calculation oleh SUPER_ADMIN menggunakan bobot AHP dari calculation yang valid (CR ≤ 0.10).

### 9.18 Ringkasan

Dokumen ini mendokumentasikan aspek keamanan sistem dan RBAC. Implementasi harus mengikuti prinsip least privilege, backend data isolation (bukan hanya UI), JWT melalui httpOnly cookie, password hashing, validasi input, rate limiting, CORS yang tepat, audit logging yang aman, error handling yang tidak membocorkan informasi, dan perlindungan terhadap data sensitif di repository. Semua mekanisme ini harus diimplementasikan sebelum deployment ke production.

---

*Dokumen ini merupakan Bagian 9 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md beserta Bagian 1–8.*
