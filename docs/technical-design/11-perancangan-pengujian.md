# RANCANGAN SISTEM
## 11. PERANCANGAN PENGUJIAN SISTEM

### 11.1 Tujuan Pengujian

Pengujian sistem dilakukan untuk memverifikasi bahwa implementasi aplikasi sesuai dengan rancangan yang telah didokumentasikan dalam Bagian 1–10, khususnya:

- Fungsi utama sistem berjalan sesuai requirement.
- Role-based access control (RBAC) SUPER_ADMIN, GURU, dan KEPALA_SEKOLAH berfungsi sesuai spesifikasi.
- Data isolation GURU berjalan di backend, bukan hanya pada UI.
- Perhitungan AHP dinamis (N kriteria) dan TOPSIS (M siswa, N kriteria) menghasilkan hasil yang sesuai dengan formula matematis.
- Fitur keamanan dasar (JWT/httpOnly cookie, password hashing, validasi input, rate limiting) berfungsi.
- Endpoint API dan database konsisten dengan rancangan.
- UI/UX yang diimplementasikan sesuai dengan rancangan di Bagian 10.
- Edge case dan skenario error ditangani dengan tepat.

Pengujian ini **bukan** klaim bahwa pengujian sudah dilakukan. Semua status test case adalah placeholder yang akan diisi saat pengujian aktual dilakukan.

### 11.2 Strategi Pengujian

#### 11.2.1 Jenis Pengujian

1. **Pengujian Fungsional (Black Box):** Memverifikasi bahwa setiap fitur bekerja sesuai requirement tanpa memperhatikan implementasi internal.
2. **Pengujian Integrasi:** Memverifikasi interaksi antara frontend, backend, dan database.
3. **Pengujian RBAC dan Izin Akses:** Memverifikasi bahwa pengguna hanya dapat mengakses fitur yang sesuai dengan role mereka.
4. **Pengujian Keamanan Dasar:** Memverifikasi proteksi cookie, rate limiting, error handling, dan validasi input.
5. **Pengujian UI/UX:** Memverifikasi tampilan, responsivitas, dan aksesibilitas dasar.
6. **Pengujian Edge Case:** Memverifikasi penanganan kondisi khusus (data kosong, nilai tidak valid, missing value, dll.).

#### 11.2.2 Lingkungan Pengujian

- **Environment:** Pengujian dilakukan di lingkungan development sebelum deployment ke production.
- **Browser:** Google Chrome (versi terbaru), Mozilla Firefox (versi terbaru), dan Safari (jika tersedia) untuk testing kompatibilitas.
- **Device/viewport desktop:** Monitor dengan resolusi minimal 1920×1080 (Full HD) untuk testing layout desktop.
- **Device/viewport tablet:** iPad atau emulator tablet dengan resolusi 768×1024 (portrait) dan 1024×768 (landscape).
- **Device/viewport mobile:** Smartphone dengan resolusi 375×667 (iPhone 6/7/8) atau emulator dengan viewport serupa, dan 414×896 (iPhone 11/12/13) untuk testing mobile.
- **Database:** PostgreSQL versi yang sama dengan yang digunakan di development environment (sesuai `docker-compose.yml`).
- **Test data:** Menggunakan data dummy/anonymized, bukan data sekolah asli. Data minimal mencakup beberapa siswa, kriteria, dan nilai untuk setiap kelas.
- **Test user:** Menggunakan beberapa akun dengan role berbeda (SUPER_ADMIN, GURU, KEPALA_SEKOLAH) untuk memverifikasi RBAC dan isolasi data.
- **Mode testing:** Responsive design diuji dengan fitur developer tools browser (device toolbar) dan juga di device fisik jika tersedia.
- **Aksesibilitas:** Diuji dengan Lighthouse (Chrome DevTools) dan pemeriksaan manual keyboard navigation.

#### 11.2.3 Kriteria Hasil

- Setiap test case memiliki Expected Result yang jelas dan terukur.
- Status test case diisi `PASS` jika sesuai expected result, `FAIL` jika tidak. Jika status belum diketahui (masih rancangan), diisi `Pending`.
- Test case yang `FAIL` harus didokumentasikan dengan akar masalah dan rencana perbaikan.
- Tidak ada test case yang di-skip tanpa alasan yang jelas.

#### 11.2.4 Strategi Prioritas Pengujian

Berikut adalah rekomendasi urutan prioritas pengujian:

1. **Prioritas Tinggi (wajib selesai sebelum deployment):**
   - Login dan logout (termasuk session expiration, token httpOnly cookie).
   - RBAC: hak akses setiap role (SUPER_ADMIN, GURU, KEPALA_SEKOLAH) sesuai Bagian 8 dan 9.
   - Isolasi data GURU: backend enforcement, manipulasi UUID/ID harus menghasilkan 403.
   - Perhitungan AHP: bobot, λmax, CI, CR (CR ≤ 0,10 dan CR > 0,10).
   - Perhitungan TOPSIS: benefit/cost, normalisasi, pembobotan, D+, D-, Vi, ranking.
   - Ranking hasil TOPSIS.
   - Validasi input dan error handling (status 400, 401, 403, 404, 500).
   - Keamanan dasar: cookie, password hashing, rate limiting, CORS.

2. **Prioritas Sedang:**
   - CRUD data master (pengguna, periode akademik, kelas, siswa, kriteria).
   - Input nilai (valid, invalid, missing value).
   - Generate dan download laporan PDF.
   - Edge case (M=0, N=0, M=1, norm nol, denominator nol, kriteria nonaktif).
   - Session expiration dan refresh token.

3. **Prioritas Rendah (tambahan/opsional, dapat diselesaikan setelah prioritas tinggi dan sedang):**
   - Detail UI (warna, kosmetik, alignment yang tidak mempengaruhi fungsi).
   - Testing aksesibilitas lanjutan (lebih dari dasar).
   - Testing cross-browser kompatibilitas di browser yang tidak utama.
   - Testing performa/load time di bawah beban (bisa ditambahkan nanti jika diperlukan).

**Catatan:** Prioritas ini bersifat rekomendasi dan dapat disesuaikan berdasarkan kebutuhan. Prioritas tinggi harus diselesaikan dan lulus (PASS) sebelum deployment ke production. Prioritas sedang disarankan untuk diselesaikan sebelum release ke pengguna internal. Prioritas rendah dapat dikerjakan secara bertahap setelah fitur utama berjalan stabil.

### 11.3 Pengujian Fungsional / Black Box

#### 11.3.1 Tujuan

Memverifikasi bahwa setiap fitur utama aplikasi berfungsi sesuai rancangan sistem.

#### 11.3.2 Lingkup

- Fungsi login/logout.
- Fungsi CRUD data master.
- Fungsi input nilai.
- Fungsi perhitungan AHP dan TOPSIS.
- Fungsi ranking dan laporan PDF.
- Fungsi manajemen pengguna.

### 11.4 Skenario Pengujian Login dan Logout

#### 11.4.1 Login Berhasil dengan Role Berbeda

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-001 | Login | User SUPER_ADMIN login dengan email dan password yang benar | Login berhasil, redirect ke dashboard SUPER_ADMIN, cookie access dan refresh token diset | Pending |
| TC-002 | Login | User GURU login dengan email dan password yang benar | Login berhasil, redirect ke dashboard GURU (hanya menu untuk kelas yang diampu), cookie diset | Pending |
| TC-003 | Login | User KEPALA_SEKOLAH login dengan email dan password yang benar | Login berhasil, redirect ke dashboard KEPALA_SEKOLAH, cookie diset | Pending |

#### 11.4.2 Login Gagal

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-004 | Login | Login dengan email yang tidak terdaftar | Error "email atau password tidak valid", tidak ada cookie yang diset | Pending |
| TC-005 | Login | Login dengan password salah | Error "email atau password tidak valid", tidak ada cookie yang diset | Pending |
| TC-006 | Login | Login dengan akun yang dinonaktifkan (is_active = false) | Error "akun tidak aktif" atau pesan yang sesuai, tidak ada cookie yang diset | Pending |

#### 11.4.3 Logout dan Session Expiration

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-007 | Logout | User melakukan logout | Cookie access dan refresh token dihapus, user diarahkan ke halaman login | Pending |
| TC-008 | Session | Access token kedaluwarsa (15-30 menit), user mencoba akses protected endpoint | Di-refresh otomatis jika refresh token masih valid; jika tidak, user diwajibkan login ulang | Pending |
| TC-009 | Session | Refresh token kedaluwarsa (7-30 hari), user mencoba refresh | Error, user harus login ulang | Pending |
| TC-010 | Session | User membuka halaman setelah logout | Diarahkan ke halaman login, tidak bisa mengakses halaman yang diproteksi | Pending |

#### 11.4.4 Token Tidak Tersedia di Response Body

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-011 | Login | Cek response body login | Tidak ada `accessToken` atau `refreshToken` di response body; token hanya melalui httpOnly cookie | Pending |

### 11.5 Pengujian RBAC dan Hak Akses

#### 11.5.1 Akses Halaman Sesuai Role

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-012 | RBAC | User SUPER_ADMIN mengakses halaman Dashboard | Diizinkan, melihat halaman lengkap | Pending |
| TC-013 | RBAC | User GURU mengakses halaman Dashboard | Diizinkan, melihat halaman dashboard GURU (terbatas) | Pending |
| TC-014 | RBAC | User KEPALA_SEKOLAH mengakses halaman Dashboard | Diizinkan, melihat halaman dashboard KEPALA_SEKOLAH (terbatas) | Pending |
| TC-015 | RBAC | User GURU mencoba mengakses halaman Pengguna (Users) | Dilarang — halaman tidak muncul di menu atau redirect ke halaman yang sesuai | Pending |
| TC-016 | RBAC | User KEPALA_SEKOLAH mencoba mengakses halaman CRUD Kriteria | Dilarang — halaman tidak muncul di menu atau redirect | Pending |
| TC-017 | RBAC | User GURU mencoba mengakses halaman AHP - Perbandingan | Dilarang — halaman tidak muncul di menu atau redirect | Pending |
| TC-018 | RBAC | User KEPALA_SEKOLAH mengakses halaman AHP - Perhitungan (lihat saja) | Diizinkan melihat hasil AHP (read-only) | Pending |
| TC-019 | RBAC | User SUPER_ADMIN mengakses halaman AHP - Perhitungan | Diizinkan juga mengelola | Pending |

#### 11.5.2 Akses Endpoints API Berdasarkan Role

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-020 | API | User SUPER_ADMIN akses `GET /api/users` | Diizinkan, mengembalikan daftar pengguna | Pending |
| TC-021 | API | User GURU akses `GET /api/users` | Dilarang — kembalikan 403 | Pending |
| TC-022 | API | User KEPALA_SEKOLAH akses `POST /api/users` | Dilarang — kembalikan 403 | Pending |
| TC-023 | API | User GURU akses `POST /api/ahp/calculate` | Dilarang — kembalikan 403 | Pending |
| TC-024 | API | User KEPALA_SEKOLAH akses `GET /api/ahp/calculations` | Diizinkan (read-only) | Pending |
| TC-025 | API | User GURU akses `GET /api/ahp/calculations` | Dilarang — kembalikan 403 (sesuai keputusan: GURU tidak boleh melihat AHP calculation) | Pending |

### 11.6 Pengujian Isolasi Data GURU

#### 11.6.1 GURU Tidak Dapat Melihat Data Kelas Lain

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
|| TC-026 | Isolasi Data | User GURU mencoba mengakses `GET /api/students` dan mencoba melihat daftar semua siswa (bukan hanya kelasnya) | Hanya mengembalikan siswa di kelas yang diampu GURU (ownership melalui `classes.wali_teacher_id` dan claim `owned_class_ids`), siswa di kelas lain tidak muncul | Pending |
| TC-027 | Isolasi Data | User GURU mencoba mengakses `GET /api/students/:id` untuk siswa di kelas lain | Kembalikan 403 Forbidden atau error yang sesuai | Pending |
| TC-028 | Isolasi Data | User GURU mencoba mengakses `GET /api/scores` untuk melihat semua nilai | Hanya mengembalikan nilai untuk siswa di kelasnya sendiri | Pending |
| TC-029 | Isolasi Data | User GURU mencoba mengakses `GET /api/topsis/ranking` untuk melihat ranking semua kelas | Hanya mengembalikan ranking untuk kelas yang diampu GURU (scope: wali_class_only) | Pending |

#### 11.6.2 GURU Tidak Dapat Mengubah Data Kelas Lain

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-030 | Isolasi Data | User GURU mencoba `PATCH /api/students/:id` untuk siswa di kelas lain | Kembalikan 403 Forbidden | Pending |
| TC-031 | Isolasi Data | User GURU mencoba `POST /api/scores/bulk` dengan student_id yang bukan milik kelasnya | Kembalikan 403 atau error ownership, data tidak tersimpan | Pending |
| TC-032 | Isolasi Data | User GURU mencoba memanipulasi UUID di URL untuk mengakses data kelas lain | Kembalikan 403 atau error, data tidak diakses | Pending |

#### 11.6.3 Validasi Ownership di Backend

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-033 | Isolasi Data | Cek source code/backend logic: apakah ada filter `WHERE classes.wali_teacher_id = :userId` untuk setiap query yang berkaitan dengan kelas | Filter diterapkan di backend, bukan hanya di UI | Pending |

### 11.7 Pengujian CRUD Data Master

#### 11.7.1 Manajemen Pengguna

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-034 | CRUD Users | SUPER_ADMIN membuat user baru (GURU) dengan email valid dan password | User berhasil dibuat, dapat login dengan role GURU | Pending |
| TC-035 | CRUD Users | SUPER_ADMIN membuat user baru (KEPALA_SEKOLAH) | User berhasil dibuat, dapat login dengan role KEPALA_SEKOLAH | Pending |
| TC-036 | CRUD Users | SUPER_ADMIN update role user (misal: GURU menjadi KEPALA_SEKOLAH) | Role berhasil diupdate, user login dengan role baru | Pending |
| TC-037 | CRUD Users | SUPER_ADMIN menghapus user (soft delete, is_active = false) | User tidak bisa login lagi, tetap ada di database dengan is_active = false | Pending |

#### 11.7.2 Manajemen Periode Akademik

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-038 | CRUD Period | SUPER_ADMIN membuat periode akademik baru | Periode berhasil dibuat dan muncul di list | Pending |
| TC-039 | CRUD Period | SUPER_ADMIN mengatur periode sebagai "aktif" (set-active) | Periode tersebut menjadi aktif, periode sebelumnya tidak aktif | Pending |
| TC-040 | CRUD Period | SUPER_ADMIN mengedit periode (nama, tanggal) | Perubahan tersimpan | Pending |
| TC-041 | CRUD Period | SUPER_ADMIN menghapus periode (soft delete) | Periode tidak aktif, tetap ada di database | Pending |

#### 11.7.3 Manajemen Kelas

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-042 | CRUD Kelas | SUPER_ADMIN membuat kelas baru dengan nama dan periode | Kelas berhasil dibuat, wali_teacher_id bisa diatur | Pending |
| TC-043 | CRUD Kelas | SUPER_ADMIN mengedit kelas (nama, wali teacher) | Perubahan tersimpan | Pending |
| TC-044 | CRUD Kelas | SUPER_ADMIN menghapus kelas (soft delete) | Kelas dinonaktifkan | Pending |

#### 11.7.4 Manajemen Siswa

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-045 | CRUD Siswa | SUPER_ADMIN membuat siswa baru dengan student_code dan nama | Siswa berhasil dibuat, muncul di list | Pending |
| TC-046 | CRUD Siswa | GURU membuat siswa baru (hanya untuk kelasnya sendiri) | Siswa berhasil dibuat untuk kelas yang diampu | Pending |
| TC-047 | CRUD Siswa | GURU mencoba membuat siswa untuk kelas lain | Dilarang — error atau tidak bisa memilih kelas lain | Pending |
| TC-048 | CRUD Siswa | SUPER_ADMIN mengedit siswa (nama, status) | Perubahan tersimpan | Pending |
| TC-049 | CRUD Siswa | SUPER_ADMIN menghapus siswa (soft delete) | Siswa dinonaktifkan | Pending |

#### 11.7.5 Manajemen Kriteria

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-050 | CRUD Kriteria | SUPER_ADMIN membuat kriteria baru (misal: "C1", "Pengetahuan", BENEFIT) | Kriteria berhasil dibuat, muncul di list | Pending |
| TC-051 | CRUD Kriteria | SUPER_ADMIN menonaktifkan kriteria (is_active = false) | Kriteria tidak aktif, tidak muncul dalam perhitungan AHP/TOPSIS | Pending |
| TC-052 | CRUD Kriteria | SUPER_ADMIN mengedit kriteria (nama, tipe) | Perubahan tersimpan | Pending |

### 11.8 Pengujian Input Nilai

#### 11.8.1 Input Nilai Valid

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-053 | Input Nilai | GURU memasukkan nilai untuk siswa dengan kriteria yang ada | Nilai tersimpan di database (`scores.value`) | Pending |
| TC-054 | Input Nilai | GURU memasukkan nilai untuk semua kriteria active untuk satu siswa | Semua nilai tersimpan | Pending |
| TC-055 | Input Nilai | GURU memasukkan nilai untuk beberapa siswa sekaligus (bulk) | Semua nilai dalam bulk tersimpan | Pending |

#### 11.8.2 Input Nilai Invalid

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-056 | Input Nilai | GURU memasukkan nilai bukan angka (misal: teks "abc") | Error validasi, nilai tidak tersimpan | Pending |
| TC-057 | Input Nilai | GURU memasukkan nilai di luar rentang (misal: -1 atau 101 jika rentangnya 0-100) | Error validasi, nilai tidak tersimpan | Pending |
| TC-058 | Input Nilai | GURU memasukkan nilai untuk kriteria yang tidak ada (criteria_id tidak valid) | Error validasi, nilai tidak tersimpan | Pending |

#### 11.8.3 Missing Value

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-059 | Missing Value | GURU menandai nilai siswa sebagai missing (is_missing = true) | `scores.is_missing` diset true, `scores.value` null | Pending |
| TC-060 | Missing Value | GURU mencoba memasukkan nilai sambil is_missing = true | Error validasi atau nilai diabaikan, is_missing tetap true | Pending |
| TC-061 | Missing Value | Sistem menampilkan indikator missing value di UI | Tampil indikator "Missing" atau icon khusus | Pending |

### 11.9 Pengujian Perhitungan AHP

#### 11.9.1 AHP dengan N Kriteria Dinamis

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-062 | AHP | SUPER_ADMIN menjalankan perhitungan AHP dengan N kriteria (misal: 3 kriteria) | Sistem membangun matriks 3x3, menghitung bobot, λmax, CI, CR | Pending |
| TC-063 | AHP | SUPER_ADMIN menambah kriteria (N bertambah 1), menjalankan ulang perhitungan | Matriks berubah ukuran, bobot dihitung ulang untuk N baru | Pending |
| TC-064 | AHP | SUPER_ADMIN menghapus kriteria (N berkurang), menjalankan ulang perhitungan | Matriks berubah ukuran, bobot dihitung ulang | Pending |

#### 11.9.2 Perbandingan AHP

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-065 | AHP | SUPER_ADMIN memasukkan perbandingan berpasangan (diagonal tidak perlu dimasukkan karena selalu 1) | Nilai tersimpan di `ahp_comparisons` | Pending |
| TC-066 | AHP | SUPER_ADMIN memasukkan perbandingan yang tidak valid (misal: nilai 0) | Error validasi, tidak disimpan | Pending |
| TC-067 | AHP | SUPER_ADMIN memasukkan perbandingan dengan nilai > 9 | Error validasi atau warning (skala Saaty 1-9) | Pending |
| TC-068 | AHP | Cek apakah nilai a_ji dihitung sebagai 1/a_ij | Sistem otomatis menghitung nilai reciprocal | Pending |

#### 11.9.3 AHP dengan N = 1 dan N = 2

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-069 | AHP | Sistem dengan hanya 1 kriteria aktif: menjalankan perhitungan AHP | Bobot = 100% (w = 1.00), CR tidak dapat dihitung (null), status valid dengan notifikasi | Pending |
| TC-070 | AHP | Sistem dengan 2 kriteria aktif: menjalankan perhitungan AHP | Bobot dihitung, CR tidak dapat dihitung (null karena RI=0), status valid dengan notifikasi | Pending |

### 11.10 Pengujian Consistency Ratio

#### 11.10.1 CR ≤ 0,10 (Konsisten)

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-071 | CR | SUPER_ADMIN memasukkan perbandingan yang konsisten (CR ≤ 0,10), menjalankan perhitungan | `is_valid = true`, nilai CR diisi, bobot AHP tersedia untuk TOPSIS | Pending |
| TC-072 | CR | Cek apakah hasil AHP dengan CR ≤ 0,10 dapat digunakan di TOPSIS | TOPSIS dapat dijalankan menggunakan bobot AHP tersebut | Pending |

#### 11.10.2 CR > 0,10 (Tidak Konsisten)

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-073 | CR | SUPER_ADMIN memasukkan perbandingan yang tidak konsisten (CR > 0,10), menjalankan perhitungan | `is_valid = false`, CR diisi, pesan peringatan ditampilkan, bobot tidak digunakan untuk TOPSIS | Pending |
| TC-074 | CR | Cek apakah TOPSIS dapat dijalankan dengan bobot AHP yang invalid (CR > 0,10) | TOPSIS harus gagal dengan error atau tidak diizinkan | Pending |
| TC-075 | CR | SUPER_ADMIN merevisi perbandingan agar CR ≤ 0,10 | Setelah revisi, `is_valid = true` | Pending |

#### 11.10.3 Perhitungan RI Berdasarkan N

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-076 | CR | Cek apakah RI dipilih berdasarkan N (bukan nilai tetap 0.90) | RI sesuai dengan tabel Saaty: N=4 → RI=0.90, N=3 → RI=0.58, dst. | Pending |

### 11.11 Pengujian Perhitungan TOPSIS

#### 11.11.1 TOPSIS dengan M dan N Dinamis

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-077 | TOPSIS | SUPER_ADMIN menjalankan perhitungan TOPSIS dengan M siswa dan N kriteria | Sistem membangun matriks M×N, menghitung D+, D-, Vi, ranking | Pending |
| TC-078 | TOPSIS | SUPER_ADMIN menambah siswa baru yang memiliki nilai lengkap, menjalankan ulang TOPSIS | M bertambah, ranking diperbarui | Pending |
| TC-079 | TOPSIS | SUPER_ADMIN menambah kriteria, menjalankan ulang TOPSIS | N bertambah, ranking diperbarui | Pending |

#### 11.11.2 Tipe Kriteria BENEFIT dan COST

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-080 | TOPSIS | TOPSIS dijalankan dengan kriteria BENEFIT (semakin tinggi semakin baik) | Solusi ideal positif menggunakan max(v_ij), solusi ideal negatif menggunakan min(v_ij) | Pending |
| TC-081 | TOPSIS | TOPSIS dijalankan dengan kriteria COST (semakin rendah semakin baik) | Solusi ideal positif menggunakan min(v_ij), solusi ideal negatif menggunakan max(v_ij) | Pending |
| TC-082 | TOPSIS | TOPSIS dengan kombinasi BENEFIT dan COST | Perhitungan kombinasi dengan tipe yang berbeda | Pending |

#### 11.11.3 Normalisasi dan Bobot AHP

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-083 | TOPSIS | Cek apakah normalisasi menggunakan vector normalization (r_ij = x_ij / ||X_j||) | Normalisasi benar sesuai formula | Pending |
| TC-084 | TOPSIS | Cek apakah pembobotan menggunakan bobot AHP (v_ij = r_ij × w_j) | Pembobotan benar | Pending |
| TC-085 | TOPSIS | Cek apakah Vi = D- / (D+ + D-) | Nilai preferensi benar | Pending |

#### 11.11.4 Reproducibility Snapshot

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-086 | TOPSIS | Cek apakah hasil perhitungan TOPSIS disimpan dengan snapshot lengkap (decision_matrix, normalized_matrix, weighted_matrix, A+, A-, D+, D-, Vi, rank) | Semua snapshot tersimpan di `topsis_calculations` | Pending |

### 11.12 Pengujian Ranking

#### 11.12.1 Ranking Siswa

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-087 | Ranking | SUPER_ADMIN melihat ranking siswa setelah TOPSIS dijalankan | Urutan ranking sesuai Vi descending (rank 1 = Vi tertinggi) | Pending |
| TC-088 | Ranking | KEPALA_SEKOLAH melihat ranking siswa | Diizinkan melihat ranking seluruh sekolah | Pending |
| TC-089 | Ranking | GURU melihat ranking untuk kelasnya sendiri | Hanya melihat siswa di kelasnya (scope: wali_class_only) | Pending |
| TC-090 | Ranking | GURU mencoba melihat ranking kelas lain | Dilarang — hanya melihat kelasnya, atau 403 | Pending |

#### 11.12.2 Tie (Seri)

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-091 | Ranking | Dua siswa memiliki nilai Vi yang sama | Sistem menampilkan "draw" atau menggunakan tie-breaker (sesuai OPEN QUESTION) | Pending |

#### 11.12.3 Ranking dengan M = 1

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-092 | Ranking | Hanya ada 1 siswa yang dihitung di TOPSIS | Siswa tersebut mendapatkan rank 1 (tidak informatif tapi valid) | Pending |

### 11.13 Pengujian Generate/Preview PDF

#### 11.13.1 Generate Laporan PDF

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-093 | PDF | KEPALA_SEKOLAH atau SUPER_ADMIN menjalankan generate laporan PDF | Laporan berhasil dibuat, muncul di list laporan, status "siap" | Pending |
| TC-094 | PDF | Cek apakah template PDF menggunakan placeholder KOP (tanpa logo resmi) | Template menggunakan placeholder teks tanpa logo sekolah | Pending |
| TC-095 | PDF | Cek apakah laporan berisi tabel ranking, hasil perhitungan, ruang tanda tangan | Isi laporan sesuai | Pending |

#### 11.13.2 Download PDF

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-096 | PDF | User yang berwenang (KEPALA_SEKOLAH/SUPER_ADMIN) mengunduh PDF | File PDF berhasil diunduh, content-type application/pdf | Pending |
| TC-097 | PDF | User yang tidak berwenang (GURU) mencoba mengunduh PDF | Dilarang — 403 atau error | Pending |

#### 11.13.3 List Laporan

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-098 | PDF | SUPER_ADMIN melihat list laporan yang di-generate | Semua laporan muncul dengan informasi periode, tanggal, status | Pending |

### 11.14 Pengujian Validasi dan Error Handling

#### 11.14.1 Validasi DTO

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-099 | Validasi | Kirim request dengan email tidak valid | DTO validation gagal, kembalikan error 400 dengan pesan yang sesuai | Pending |
| TC-100 | Validasi | Kirim request dengan password yang terlalu pendek (< 8 karakter) | Error validasi, kembalikan 400 | Pending |
| TC-101 | Validasi | Kirim request dengan UUID yang tidak valid di path parameter | Error 400 atau 404, tidak bisajalan | Pending |

#### 11.14.2 Error Handling

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-102 | Error | Akses endpoint tanpa authentication (tanpa cookie) | Kembalikan 401 Unauthorized | Pending |
| TC-103 | Error | Akses endpoint dengan token yang tidak valid/expired | Kembalikan 401 Unauthorized | Pending |
| TC-104 | Error | User tanpa izin mengakses endpoint yang dilindungi | Kembalikan 403 Forbidden | Pending |
| TC-105 | Error | Request ke resource yang tidak ada | Kembalikan 404 Not Found | Pending |
| TC-106 | Error | Cek apakah error response tidak membocorkan stack trace atau informasi internal | Error hanya berisi statusCode, message, error; tidak ada stack trace | Pending |

#### 11.14.3 Error Message yang Aman

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-107 | Error | Cek apakah error message untuk login gagal tidak membocorkan apakah email terdaftar atau tidak | Error message umum (misal: "email atau password tidak valid"), tidak membedakan antara email tidak ada vs password salah | Pending |

### 11.15 Pengujian Responsive UI dan Accessibility Dasar

#### 11.15.1 Responsive Design

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-108 | UI | Buka aplikasi di desktop (≥ 1024px) | Tampilan sidebar dan layout penuh | Pending |
| TC-109 | UI | Buka aplikasi di tablet (768px–1023px) | Sidebar collapse/drawer, layout menyesuaikan | Pending |
| TC-110 | UI | Buka aplikasi di mobile (< 768px) | Bottom navigation, layout stack, tidak ada horizontal scroll | Pending |

#### 11.15.2 Loading dan Empty State

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-111 | UI | Buka halaman yang memuat data (misal: list siswa) | Loading state ditampilkan sebelum data tersedia | Pending |
| TC-112 | UI | Buka halaman dengan data kosong (misal: tidak ada siswa) | Empty state ditampilkan dengan pesan yang sesuai dan tombol aksi | Pending |

#### 11.15.3 Validation dan Error State

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-113 | UI | Submit form dengan input tidak valid (misal: email tidak valid, password terlalu pendek) | Error message muncul dekat field yang bermasalah, pesan yang jelas | Pending |
| TC-114 | UI | Submit form yang berhasil | Success notification ditampilkan (misal: toast "Data berhasil disimpan") | Pending |
| TC-115 | UI | Terjadi error API (misal: 500 error) | Error state ditampilkan dengan pesan yang informatif tapi tidak membocorkan info internal | Pending |

#### 11.15.4 Accessibility Dasar

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-116 | Aksesibilitas | Cek apakah semua input memiliki label yang terhubung | Label terhubung dengan input (for/id) | Pending |
| TC-117 | Aksesibilitas | Cek apakah focus indicator terlihat saat navigasi keyboard | Focus indicator terlihat | Pending |
| TC-118 | Aksesibilitas | Cek apakah kontras warna teks dan background memenuhi WCAG 2.1 Level A (minimal 4.5:1 untuk teks normal) | Kontras cukup | Pending |
| TC-119 | Aksesibilitas | Cek apakah aplikasi dapat diakses hanya dengan keyboard | Semua fungsi dapat diakses tanpa mouse | Pending |

### 11.16 Pengujian Keamanan Dasar

#### 11.16.1 JWT dan Cookie

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-120 | Keamanan | Cek apakah access token disimpan di httpOnly cookie | Cookie memiliki atribut HttpOnly=true, Secure=true (production), SameSite sesuai | Pending |
| TC-121 | Keamanan | Cek apakah refresh token disimpan di httpOnly cookie | Cookie refresh token memiliki atribut yang sama | Pending |
| TC-122 | Keamanan | Cek apakah frontend tidak menyimpan token di localStorage/sessionStorage | Token tidak ada di localStorage/sessionStorage | Pending |
| TC-123 | Keamanan | Cek apakah frontend tidak dapat mengakses cookie dari JavaScript (karena HttpOnly) | Cookie tidak terlihat di document.cookie | Pending |

#### 11.16.2 Password Hashing

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-124 | Keamanan | Cek apakah password disimpan sebagai hash (bcrypt/Argon2id), bukan plaintext | Di database hanya ada hash, bukan password asli | Pending |
| TC-125 | Keamanan | Cek apakah password plaintext tidak terekam di log | Tidak ada password plaintext di log | Pending |

#### 11.16.3 Validasi Input

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-126 | Keamanan | Cek apakah input divalidasi dengan class-validator di backend | Semua request melalui validasi DTO | Pending |
| TC-127 | Keamanan | Coba SQL injection pada input (misal: ' OR '1'='1) | Prisma ORM mencegah SQL injection dengan parameterized queries | Pending |

#### 11.16.4 Rate Limiting dan Brute Force

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-128 | Keamanan | Kirim banyak request login dari IP yang sama dalam waktu singkat | Rate limiting aktif, request dibatasi (misal: 5 per menit per IP) | Pending |
| TC-129 | Keamanan | Setelah beberapa kegagalan login berturut-turut, IP diblokir sementara | IP diblokir untuk mencegah brute force | Pending |

#### 11.16.5 CORS

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-130 | Keamanan | Request dari origin yang tidak diizinkan (misal: domain lain) | CORS menghalangi request, tidak bisa mengakses API | Pending |

### 11.17 Skenario Edge Case

#### 11.17.1 Data Kosong / Denominator atau Norm Nol

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-131 | Edge Case | TOPSIS dengan M = 0 (tidak ada siswa dengan nilai lengkap) | Sistem menampilkan pesan error atau notifikasi bahwa tidak ada siswa valid | Pending |
| TC-132 | Edge Case | TOPSIS dengan N = 0 (tidak ada kriteria aktif) | Sistem menampilkan pesan error atau tidak bisa menjalankan perhitungan | Pending |
| TC-133 | Edge Case | TOPSIS dengan M = 1 (hanya satu siswa) | Siswa tersebut mendapatkan rank 1, valid tapi tidak informatif | Pending |
| TC-134 | Edge Case | TOPSIS dengan norm vektor nol untuk kriteria tertentu (semua nilai 0) | Sistem menangani kasus ini (nilai r_ij = 0 atau notifikasi) | Pending |

#### 11.17.2 Denominator Nol

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-135 | Edge Case | TOPSIS dengan D+ + D- = 0 untuk siswa tertentu | Nilai Vi ditangani (misal: Vi = 0 atau notifikasi) | Pending |

#### 11.17.3 Nilai yang Tidak Valid

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-136 | Edge Case | Nilai siswa negatif (jika tidak diizinkan) | Validasi rejects atau error | Pending |
| TC-137 | Edge Case | Nilai di luar rentang yang ditentukan untuk kriteria tertentu | Validasi rejects atau warning | Pending |

#### 11.17.4 Kriteria Nonaktif

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-138 | Edge Case | SUPER_ADMIN menonaktifkan kriteria yang sedang digunakan di AHP | AHP calculation yang sebelumnya invalid (karena bobot berubah) dan TOPSIS perlu di-recalculate | Pending |
| TC-139 | Edge Case | Setelah kriteria dinonaktifkan, mencoba menjalankan TOPSIS | Sistem harus menampilkan pesan bahwa AHP/TOPSIS tidak valid dan harus recalculate | Pending |

#### 11.17.5 Session dan Logout

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-140 | Edge Case | User logout, kemudian mencoba mengakses halaman yang diproteksi | Diarahkan ke login | Pending |

### 11.18 Matriks/Test Case Pengujian

Tabel berikut merangkum semua test case yang telah didokumentasikan di atas.

| ID | Fitur | Skenario/Input | Expected Result | Status |
|----|-------|---------------|-----------------|--------|
| TC-001 | Login | SUPER_ADMIN login dengan email dan password benar | Login berhasil, cookie diset | Pending |
| TC-002 | Login | GURU login dengan email dan password benar | Login berhasil, cookie diset | Pending |
| TC-003 | Login | KEPALA_SEKOLAH login dengan email dan password benar | Login berhasil, cookie diset | Pending |
| TC-004 | Login | Login dengan email tidak terdaftar | Error "email atau password tidak valid", tidak ada cookie | Pending |
| TC-005 | Login | Login dengan password salah | Error "email atau password tidak valid", tidak ada cookie | Pending |
| TC-006 | Login | Login dengan akun tidak aktif | Error atau pesan yang sesuai, tidak ada cookie | Pending |
| TC-007 | Logout | User melakukan logout | Cookie dihapus, diarahkan ke login | Pending |
| TC-008 | Session | Access token kedaluwarsa, user coba akses protected endpoint | Di-refresh jika refresh token valid; jika tidak, login ulang | Pending |
| TC-009 | Session | Refresh token kedaluwarsa, user coba refresh | Error, harus login ulang | Pending |
| TC-010 | Session | User coba akses halaman setelah logout | Diarahkan ke login, tidak bisa akses | Pending |
| TC-011 | Login | Cek response body login | Tidak ada accessToken/refreshToken di body, hanya cookie | Pending |
| TC-012 | RBAC | SUPER_ADMIN akses Dashboard | Diizinkan, halaman lengkap | Pending |
| TC-013 | RBAC | GURU akses Dashboard | Diizinkan, halaman terbatas | Pending |
| TC-014 | RBAC | KEPALA_SEKOLAH akses Dashboard | Diizinkan, halaman terbatas | Pending |
| TC-015 | RBAC | GURU coba akses halaman Pengguna | Dilarang (tidak muncul di menu atau redirect) | Pending |
| TC-016 | RBAC | KEPALA_SEKOLAH coba akses halaman CRUD Kriteria | Dilarang (tidak muncul di menu atau redirect) | Pending |
| TC-017 | RBAC | GURU coba akses halaman AHP - Perbandingan | Dilarang (tidak muncul di menu atau redirect) | Pending |
| TC-018 | RBAC | KEPALA_SEKOLAH akses AHP - Perhitungan (lihat saja) | Diizinkan (read-only) | Pending |
| TC-019 | RBAC | SUPER_ADMIN akses AHP - Perhitungan | Diizinkan (bisa mengelola) | Pending |
| TC-020 | API | SUPER_ADMIN akses `GET /api/users` | Diizinkan, daftar pengguna | Pending |
| TC-021 | API | GURU akses `GET /api/users` | 403 Forbidden | Pending |
| TC-022 | API | KEPALA_SEKOLAH akses `POST /api/users` | 403 Forbidden | Pending |
| TC-023 | API | GURU akses `POST /api/ahp/calculate` | 403 Forbidden | Pending |
| TC-024 | API | KEPALA_SEKOLAH akses `GET /api/ahp/calculations` | Diizinkan (read-only) | Pending |
| TC-025 | API | GURU akses `GET /api/ahp/calculations` | 403 Forbidden | Pending |
| TC-026 | Isolasi Data | GURU akses `GET /api/students` | Hanya siswa di kelasnya saja | Pending |
| TC-027 | Isolasi Data | GURU akses `GET /api/students/:id` untuk siswa kelas lain | 403 Forbidden | Pending |
| TC-028 | Isolasi Data | GURU akses `GET /api/scores` | Hanya nilai untuk kelasnya sendiri | Pending |
| TC-029 | Isolasi Data | GURU akses `GET /api/topsis/ranking` | Hanya ranking kelasnya (scope: wali_class_only) | Pending |
| TC-030 | Isolasi Data | GURU coba `PATCH /api/students/:id` siswa kelas lain | 403 Forbidden | Pending |
| TC-031 | Isolasi Data | GURU coba `POST /api/scores/bulk` dengan student_id bukan milik kelasnya | 403 atau error ownership | Pending |
| TC-032 | Isolasi Data | GURU coba manipulasi UUID di URL untuk data kelas lain | 403 atau error, data tidak diakses | Pending |
| TC-033 | Isolasi Data | Cek backend: apakah filter `wali_teacher_id` diterapkan | Filter diterapkan di backend | Pending |
| TC-034 | CRUD Users | SUPER_ADMIN buat user GURU baru | User berhasil dibuat, bisa login | Pending |
| TC-035 | CRUD Users | SUPER_ADMIN buat user KEPALA_SEKOLAH baru | User berhasil dibuat, bisa login | Pending |
| TC-036 | CRUD Users | SUPER_ADMIN update role user | Role berhasil diupdate | Pending |
| TC-037 | CRUD Users | SUPER_ADMIN hapus user (soft delete) | User tidak bisa login, tetap ada di DB | Pending |
| TC-038 | CRUD Period | SUPER_ADMIN buat periode akademik baru | Periode berhasil dibuat | Pending |
| TC-039 | CRUD Period | SUPER_ADMIN set-active periode | Periode aktif, periode sebelumnya tidak aktif | Pending |
| TC-040 | CRUD Period | SUPER_ADMIN edit periode | Perubahan tersimpan | Pending |
| TC-041 | CRUD Period | SUPER_ADMIN hapus periode (soft delete) | Periode tidak aktif | Pending |
| TC-042 | CRUD Kelas | SUPER_ADMIN buat kelas baru | Kelas berhasil dibuat | Pending |
| TC-043 | CRUD Kelas | SUPER_ADMIN edit kelas | Perubahan tersimpan | Pending |
| TC-044 | CRUD Kelas | SUPER_ADMIN hapus kelas (soft delete) | Kelas dinonaktifkan | Pending |
| TC-045 | CRUD Siswa | SUPER_ADMIN buat siswa baru | Siswa berhasil dibuat | Pending |
| TC-046 | CRUD Siswa | GURU buat siswa baru (kelas sendiri) | Siswa berhasil dibuat untuk kelasnya | Pending |
| TC-047 | CRUD Siswa | GURU coba buat siswa untuk kelas lain | Dilarang — error | Pending |
| TC-048 | CRUD Siswa | SUPER_ADMIN edit siswa | Perubahan tersimpan | Pending |
| TC-049 | CRUD Siswa | SUPER_ADMIN hapus siswa (soft delete) | Siswa dinonaktifkan | Pending |
| TC-050 | CRUD Kriteria | SUPER_ADMIN buat kriteria baru | Kriteria berhasil dibuat | Pending |
| TC-051 | CRUD Kriteria | SUPER_ADMIN nonaktifkan kriteria | Kriteria tidak aktif, tidak masuk perhitungan | Pending |
| TC-052 | CRUD Kriteria | SUPER_ADMIN edit kriteria | Perubahan tersimpan | Pending |
| TC-053 | Input Nilai | GURU masukkan nilai untuk siswa dengan kriteria ada | Nilai tersimpan di DB | Pending |
| TC-054 | Input Nilai | GURU masukkan nilai semua kriteria untuk satu siswa | Semua nilai tersimpan | Pending |
| TC-055 | Input Nilai | GURU bulk input nilai untuk beberapa siswa | Semua nilai tersimpan | Pending |
| TC-056 | Input Nilai | GURU masukkan nilai bukan angka (misal: "abc") | Error validasi, tidak tersimpan | Pending |
| TC-057 | Input Nilai | GURU masukkan nilai di luar rentang | Error validasi, tidak tersimpan | Pending |
| TC-058 | Input Nilai | GURU masukkan nilai untuk criteria_id tidak valid | Error validasi, tidak tersimpan | Pending |
| TC-059 | Missing Value | GURU tandai nilai siswa sebagai missing | `is_missing` true, `value` null | Pending |
| TC-060 | Missing Value | GURU coba masukkan nilai sambil is_missing = true | Error validasi atau nilai diabaikan | Pending |
| TC-061 | Missing Value | UI menampilkan indikator missing value | Tampil indikator "Missing" | Pending |
| TC-062 | AHP | SUPER_ADMIN jalankan AHP dengan N kriteria | Matriks N×N, bobot, λmax, CI, CR dihitung | Pending |
| TC-063 | AHP | SUPER_ADMIN tambah kriteria, jalankan ulang AHP | Matriks berubah, bobot dihitung ulang untuk N baru | Pending |
| TC-064 | AHP | SUPER_ADMIN hapus kriteria, jalankan ulang AHP | Matriks berubah, bobot dihitung ulang | Pending |
| TC-065 | AHP | SUPER_ADMIN masukkan perbandingan berpasangan (tanpa diagonal) | Nilai tersimpan di `ahp_comparisons` | Pending |
| TC-066 | AHP | SUPER_ADMIN masukkan perbandingan nilai 0 | Error validasi, tidak disimpan | Pending |
| TC-067 | AHP | SUPER_ADMIN masukkan perbandingan nilai > 9 | Error validasi atau warning | Pending |
| TC-068 | AHP | Cek apakah a_ji dihitung sebagai 1/a_ij | Sistem otomatis hitung reciprocal | Pending |
| TC-069 | AHP | Sistem hanya 1 kriteria aktif: jalankan AHP | Bobot = 100%, CR null, status valid dengan notifikasi | Pending |
| TC-070 | AHP | Sistem 2 kriteria aktif: jalankan AHP | Bobot dihitung, CR null (RI=0), status valid dengan notifikasi | Pending |
| TC-071 | CR | SUPER_ADMIN masukkan perbandingan konsisten (CR ≤ 0,10) | `is_valid = true`, CR diisi, bobot tersedia | Pending |
| TC-072 | CR | Cek apakah AHP dengan CR ≤ 0,10 bisa dipakai di TOPSIS | TOPSIS dapat dijalankan | Pending |
| TC-073 | CR | SUPER_ADMIN masukkan perbandingan tidak konsisten (CR > 0,10) | `is_valid = false`, CR diisi, pesan peringatan | Pending |
| TC-074 | CR | Cek apakah TOPSIS bisa jalan dengan bobot AHP invalid (CR > 0,10) | TOPSIS gagal atau tidak diizinkan | Pending |
| TC-075 | CR | SUPER_ADMIN revisi perbandingan agar CR ≤ 0,10 | Setelah revisi, `is_valid = true` | Pending |
| TC-076 | CR | Cek apakah RI dipilih berdasarkan N (bukan fixed 0.90) | RI sesuai tabel Saaty | Pending |
| TC-077 | TOPSIS | SUPER_ADMIN jalankan TOPSIS dengan M siswa dan N kriteria | Matriks M×N, D+, D-, Vi, ranking dihitung | Pending |
| TC-078 | TOPSIS | SUPER_ADMIN tambah siswa baru yang punya nilai lengkap, jalankan ulang TOPSIS | M bertambah, ranking diperbarui | Pending |
| TC-079 | TOPSIS | SUPER_ADMIN tambah kriteria, jalankan ulang TOPSIS | N bertambah, ranking diperbarui | Pending |
| TC-080 | TOPSIS | TOPSIS dengan kriteria BENEFIT | A+ max(v_ij), A- min(v_ij) | Pending |
| TC-081 | TOPSIS | TOPSIS dengan kriteria COST | A+ min(v_ij), A- max(v_ij) | Pending |
| TC-082 | TOPSIS | TOPSIS dengan kombinasi BENEFIT dan COST | Perhitungan kombinasi tipe berbeda | Pending |
| TC-083 | TOPSIS | Cek apakah normalisasi pakai vector normalization | Normalisasi benar | Pending |
| TC-084 | TOPSIS | Cek apakah pembobotan pakai bobot AHP | Pembobotan benar | Pending |
| TC-085 | TOPSIS | Cek apakah Vi = D- / (D+ + D-) | Nilai preferensi benar | Pending |
| TC-086 | TOPSIS | Cek apakah snapshot lengkap tersimpan | Semua snapshot tersimpan di `topsis_calculations` | Pending |
| TC-087 | Ranking | SUPER_ADMIN lihat ranking setelah TOPSIS | Urutan sesuai Vi descending | Pending |
| TC-088 | Ranking | KEPALA_SEKOLAH lihat ranking | Diizinkan melihat ranking seluruh sekolah | Pending |
| TC-089 | Ranking | GURU lihat ranking kelasnya sendiri | Hanya siswa di kelasnya (scope: wali_class_only) | Pending |
| TC-090 | Ranking | GURU coba lihat ranking kelas lain | Dilarang — hanya kelasnya atau 403 | Pending |
| TC-091 | Ranking | Dua siswa punya Vi sama | Sistem tampilkan "draw" atau tie-breaker | Pending |
| TC-092 | Ranking | Hanya ada 1 siswa di TOPSIS | Siswa dapat rank 1 (valid tapi tidak informatif) | Pending |
| TC-093 | PDF | KEPALA_SEKOLAH/SUPER_ADMIN generate laporan PDF | Laporan dibuat, muncul di list, status "siap" | Pending |
| TC-094 | PDF | Cek template PDF placeholder KOP | Template pakai placeholder teks tanpa logo resmi | Pending |
| TC-095 | PDF | Cek isi laporan | Berisi tabel ranking, hasil perhitungan, ruang tanda tangan | Pending |
| TC-096 | PDF | User berwenang unduh PDF | File PDF berhasil diunduh | Pending |
| TC-097 | PDF | User tidak berwenang (GURU) coba unduh PDF | 403 atau error | Pending |
| TC-098 | PDF | SUPER_ADMIN lihat list laporan | Semua laporan muncul | Pending |
| TC-099 | Validasi | Kirim request email tidak valid | DTO validation gagal, error 400 | Pending |
| TC-100 | Validasi | Kirim request password terlalu pendek (< 8 karakter) | Error validasi, error 400 | Pending |
| TC-101 | Validasi | Kirim request dengan UUID tidak valid di path | Error 400 atau 404 | Pending |
| TC-102 | Error | Akses endpoint tanpa authentication | 401 Unauthorized | Pending |
| TC-103 | Error | Akses endpoint dengan token tidak valid/expired | 401 Unauthorized | Pending |
| TC-104 | Error | User tanpa izin akses endpoint | 403 Forbidden | Pending |
| TC-105 | Error | Request ke resource tidak ada | 404 Not Found | Pending |
| TC-106 | Error | Cek apakah error response tidak bocorkan stack trace | Error hanya statusCode, message, error; tidak ada stack trace | Pending |
| TC-107 | Error | Cek error message login gagal tidak bedakan email ada/tidak | Error message umum | Pending |
| TC-108 | UI | Buka aplikasi di desktop | Sidebar dan layout penuh | Pending |
| TC-109 | UI | Buka aplikasi di tablet | Sidebar collapse/drawer, layout menyesuaikan | Pending |
| TC-110 | UI | Buka aplikasi di mobile | Bottom navigation, layout stack, tidak ada horizontal scroll | Pending |
| TC-111 | UI | Buka halaman yang memuat data | Loading state ditampilkan | Pending |
| TC-112 | UI | Buka halaman dengan data kosong | Empty state ditampilkan | Pending |
| TC-113 | UI | Submit form input tidak valid | Error message muncul dekat field | Pending |
| TC-114 | UI | Submit form berhasil | Success notification ditampilkan | Pending |
| TC-115 | UI | Terjadi error API (500) | Error state ditampilkan, tidak bocorkan info internal | Pending |
| TC-116 | Aksesibilitas | Cek apakah input punya label terhubung | Label terhubung (for/id) | Pending |
| TC-117 | Aksesibilitas | Cek focus indicator terlihat saat keyboard navigation | Focus indicator terlihat | Pending |
| TC-118 | Aksesibilitas | Cek kontras warna memenuhi WCAG Level A | Kontras cukup | Pending |
| TC-119 | Aksesibilitas | Cek aplikasi bisa diakses hanya dengan keyboard | Semua fungsi dapat diakses tanpa mouse | Pending |
| TC-120 | Keamanan | Cek access token di httpOnly cookie | Cookie HttpOnly=true, Secure=true (prod), SameSite sesuai | Pending |
| TC-121 | Keamanan | Cek refresh token di httpOnly cookie | Cookie refresh token atribut sama | Pending |
| TC-122 | Keamanan | Cek apakah frontend simpan token di localStorage/sessionStorage | Token tidak ada di localStorage/sessionStorage | Pending |
| TC-123 | Keamanan | Cek apakah frontend bisa akses cookie dari JS (karena HttpOnly) | Cookie tidak terlihat di document.cookie | Pending |
| TC-124 | Keamanan | Cek apakah password disimpan sebagai hash | Di DB hanya hash, tidak plaintext | Pending |
| TC-125 | Keamanan | Cek apakah password plaintext tidak terekam di log | Tidak ada password plaintext di log | Pending |
| TC-126 | Keamanan | Cek apakah input divalidasi dengan class-validator | Semua request melalui validasi DTO | Pending |
| TC-127 | Keamanan | Coba SQL injection pada input | Prisma ORM mencegah SQL injection | Pending |
| TC-128 | Keamanan | Kirim banyak request login dari IP sama dalam waktu singkat | Rate limiting aktif | Pending |
| TC-129 | Keamanan | Setelah beberapa kegagalan login, IP diblokir sementara | IP diblokir untuk mencegah brute force | Pending |
| TC-130 | Keamanan | Request dari origin tidak diizinkan | CORS menghalangi request | Pending |
| TC-131 | Edge Case | TOPSIS dengan M = 0 | Sistem tampilkan pesan error/notifikasi | Pending |
| TC-132 | Edge Case | TOPSIS dengan N = 0 | Sistem tampilkan pesan error | Pending |
| TC-133 | Edge Case | TOPSIS dengan M = 1 | Siswa dapat rank 1 | Pending |
| TC-134 | Edge Case | TOPSIS dengan norm vektor nol | Sistem tangani kasus ini | Pending |
| TC-135 | Edge Case | TOPSIS dengan D+ + D- = 0 | Nilai Vi ditangani (misal: Vi = 0 atau notifikasi) | Pending |
| TC-136 | Edge Case | Nilai siswa negatif (jika tidak diizinkan) | Validasi rejects atau error | Pending |
| TC-137 | Edge Case | Nilai di luar rentang yang ditentukan | Validasi rejects atau warning | Pending |
| TC-138 | Edge Case | SUPER_ADMIN nonaktifkan kriteria yang sedang dipakai | AHP/TOPSIS sebelumnya invalid, perlu recalculate | Pending |
| TC-139 | Edge Case | Setelah kriteria nonaktif, coba jalankan TOPSIS | Sistem tampilkan pesan AHP/TOPSIS tidak valid, harus recalculate | Pending |
| TC-140 | Edge Case | User logout, coba akses halaman yang diproteksi | Diarahkan ke login | Pending |

### 11.19 Kriteria Keberhasilan Pengujian

#### 11.19.1 Kriteria Umum

1. **Seluruh test case fungsional yang diharapkan menghasilkan PASS:** Semua fitur utama berfungsi sesuai requirement. Setiap test case memiliki Expected Result yang spesifik, terukur, dan dapat diverifikasi.
2. **RBAC berfungsi dengan tepat:** User hanya dapat mengakses fitur sesuai role mereka. Jika role tidak memiliki akses ke halaman/endpoint tertentu, sistem menolak akses dengan status 403 atau redirect yang tepat.
3. **Isolasi data GURU berfungsi di backend:** GURU tidak bisa mengakses data kelas lain melalui manipulasi URL/ID. Backend memvalidasi ownership melalui `classes.wali_teacher_id` (FK ke users.id) dan/atau claim `owned_class_ids` dari JWT, lalu mengembalikan 403 untuk akses yang tidak sah.
4. **AHP dan TOPSIS menghasilkan hasil yang benar:** Perhitungan sesuai formula matematis (Bagian 6 dan 7) dan menghasilkan output yang konsisten. Untuk AHP: bobot, λmax, CI, CR dihitung benar. Untuk TOPSIS: normalisasi, pembobotan, D+, D-, Vi, dan ranking dihitung benar.
5. **Keamanan dasar berfungsi:** Cookie httpOnly, password hashing, validasi input (DTO), rate limiting berfungsi sesuai rancangan (Bagian 9).
6. **Error handling yang tepat:** Error message tidak membocorkan informasi internal (stack trace, detail implementasi, informasi sensitif). Format error konsisten dengan Bagian 8.17.
7. **UI/UX sesuai rancangan:** Tampilan, responsivitas (desktop/tablet/mobile), dan aksesibilitas dasar sesuai dengan Bagian 10. Loading state, empty state, validation error, success state, dan error state ditampilkan dengan tepat.

#### 11.19.2 Kriteria Khusus

1. **CR AHP ≤ 0,10 → bobot valid:** Jika CR ≤ 0,10, bobot AHP dapat digunakan untuk TOPSIS. Sistem menyimpan `is_valid = true` dan bobot tersedia.
2. **CR AHP > 0,10 → bobot tidak valid:** Jika CR > 0,10, bobot tidak digunakan untuk TOPSIS. Sistem menyimpan `is_valid = false`, menampilkan pesan peringatan, dan TOPSIS tidak dapat dijalankan dengan bobot tersebut.
3. **TOPSIS benefit/cost:** Kriteria BENEFIT menggunakan max/min yang tepat (A+ = max, A- = min). Kriteria COST menggunakan min/max yang tepat (A+ = min, A- = max). Perhitungan sesuai Bagian 7.6.
4. **Ranking descending:** Siswa dengan Vi tertinggi mendapatkan rank 1. Ranking diurutkan dari Vi tertinggi ke terendah.
5. **Isolasi data GURU:** GURU hanya melihat data kelasnya sendiri. Ownership GURU ditentukan melalui `classes.wali_teacher_id` (FK ke users.id), dan aplikasi menggunakan claim `owned_class_ids` dari JWT atau query join ke tabel `classes` untuk mendapatkan daftar kelas milik GURU. Data kelas lain tidak dapat diakses melalui manipulasi UUID/ID.
6. **AHP dinamis:** N kriteria dapat berubah (tambah/kurang) dan AHP dihitung ulang sesuai N baru. Matriks N×N dibangun secara dinamis dari kriteria aktif.
7. **TOPSIS dinamis:** M siswa dan N kriteria dapat berubah dan TOPSIS dihitung ulang. Matriks keputusan M×N dibangun secara dinamis dari siswa dengan nilai lengkap dan kriteria aktif.

#### 11.19.3 Kriteria Eksekusi

1. **Semua test case TC-001 sampai TC-140 dijalankan** dan status diisi `PASS` atau `FAIL`.
2. **Test case yang gagal (FAIL)** didokumentasikan dengan:
   - Root cause (akar masalah).
   - Langkah reproduce.
   - Rencana perbaikan.
   - Prioritas perbaikan (tinggi/sedang/rendah).
3. **Tidak ada test case yang di-skip tanpa alasan** yang jelas. Jika ada, dokumentasikan alasan skip.
4. **Laporan hasil pengujian** dibuat setelah semua test case selesai, berisi ringkasan jumlah test case, jumlah PASS, jumlah FAIL, dan temuan penting.

### 11.20 Ringkasan

Bagian ini mendokumentasikan rancangan pengujian sistem yang mencakup:

- Pengujian fungsional dan black box.
- Pengujian login/logout dan session.
- Pengujian RBAC dan hak akses sesuai role (SUPER_ADMIN, GURU, KEPALA_SEKOLAH).
- Pengujian isolasi data GURU ( backend enforcement, bukan hanya UI).
- Pengujian CRUD data master (pengguna, periode akademik, kelas, siswa, kriteria).
- Pengujian input nilai (valid, invalid, missing value).
- Pengujian perhitungan AHP (dinamis N kriteria, perbandingan, bobot, CR).
- Pengujian consistency ratio (CR ≤ 0,10 dan CR > 0,10, RI berdasarkan N).
- Pengujian perhitungan TOPSIS (benefit/cost, M×N dinamis, normalisasi, bobot AHP, Vi).
- Pengujian ranking (termasuk tie).
- Pengujian generate dan download laporan PDF.
- Pengujian validasi dan error handling.
- Pengujian responsive UI dan accessibility dasar.
- Pengujian keamanan dasar (JWT/httpOnly cookie, password hashing, validasi input, rate limiting, CORS).
- Skenario edge case (M=0, N=0, M=1, norm nol, denominator nol, missing value, kriteria nonaktif).
- Matriks test case lengkap (TC-001 sampai TC-140) dengan format `ID | Fitur | Skenario/Input | Expected Result | Status`.
- Kriteria keberhasilan pengujian.

Semua test case bersifat rancangan dan menggunakan placeholder status (`Pending`) yang akan diisi saat pengujian aktual dilakukan. Dokumen ini tidak mengklaim bahwa pengujian sudah dilakukan atau sudah lulus. Status PASS/FAIL akan diupdate setelah eksekusi pengujian nyata.

---

*Dokumen ini merupakan Bagian 11 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md beserta Bagian 1–10.*
