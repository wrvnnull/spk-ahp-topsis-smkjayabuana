# RANCANGAN SISTEM
## 10. PERANCANGAN UI/UX

### 10.1 Prinsip Desain UI/UX dan Tujuan Pengguna

#### 10.1.1 Prinsip Umum

Desain antarmuka pengguna (UI) dan pengalaman pengguna (UX) sistem mengacu pada prinsip-prinsip berikut:

1. **Berpusat pada pengguna (user-centered):** Setiap halaman dan fitur dirancang untuk memudahkan pengguna mencapai tujuannya berdasarkan peran masing-masing.
2. **Jelas dan konsisten:** Navigasi, layout, dan terminologi harus konsisten di seluruh aplikasi. Pengguna tidak perlu menebak fungsi halaman yang berbeda.
3. **Efisien:** Mousepath pendek, klik minimal, dan informasi terstruktur rapi.
4. **Aman:** Proteksi UI berdasarkan role, tetapi keamanan utama tetap di-backend (lihat Bagian 8 dan 9).
5. **Responsif:** Tampilan menyesuaikan untuk desktop, tablet, dan mobile.
6. **Aksesibel:** Memenuhi standar aksesibilitas dasar (terlihat di 10.16).

#### 10.1.2 Tujuan Pengguna Berdasarkan Role

| Role | Tujuan Utama |
|------|--------------|
| **SUPER_ADMIN** | Mengelola seluruh aspek sistem: pengguna, periode akademik, kelas, siswa, kriteria, konfigurasi AHP, menjalankan perhitungan AHP/TOPSIS, melihat audit log. |
| **GURU** | Memasukkan dan mengelola data siswa di kelasnya, memasukkan nilai, melihat ranking siswa di kelasnya. |
| **KEPALA_SEKOLAH** | Melihat ranking sekolah, hasil perhitungan AHP/TOPSIS, dan membuat laporan PDF untuk keperluan pelaporan. |

### 10.2 Struktur Navigasi Berdasarkan Role

#### 10.2.1 Navigasi Global

Semua pengguna memiliki navigasi global berikut (disesuaikan berdasarkan role):

- **Sidebar (di desktop) / Bottom navigation (di mobile):** Menu utama.
- **Navbar (atas):** Menunjukkan identitas pengguna, role, dan tombol logout.

#### 10.2.2 Menu Berdasarkan Role

**SUPER_ADMIN:**
- Dashboard
- Pengguna (Users)
- Periode Akademik
- Kelas
- Siswa
- Kriteria
- AHP (Perbandingan & Perhitungan)
- TOPSIS (Perhitungan & Ranking)
- Laporan PDF
- Audit Log
- Pengaturan (opsional)

**GURU:**
- Dashboard (kelas mereka)
- Siswa (kelas mereka)
- Nilai Siswa (kelas mereka)
- Ranking Siswa (kelas mereka)
- Periode Akademik (lihat saja)

**KEPALA_SEKOLAH:**
- Dashboard
- Ranking Siswa (semua)
- Hasil AHP (lihat saja)
- Hasil TOPSIS (lihat saja)
- Laporan PDF
- Periode Akademik (lihat saja)

### 10.3 Layout Utama / Dashboard

#### 10.3.1 Dashboard SUPER_ADMIN

**Struktur halaman:**

1. **Header/Navbar:**
   - Logo aplikasi (`logo-smk-jayabuana.png`, tidak digunakan sebagai logo standalone di PDF — khusus untuk UI frontend).
   - Nama pengguna dan role.
   - Tombol logout.

2. **Sidebar:**
   - Menu navigasi (lihat 10.2.2).

3. **Konten utama (grid statistik):**
   - Statistik periode aktif.
   - Jumlah pengguna aktif.
   - Jumlah siswa (periode aktif).
   - Jumlah kelas.
   - Status AHP (apakah ada perhitungan yang valid).
   - Status TOPSIS (apakah ada ranking yang tersedia).

4. **Menu aksi cepat (quick actions):**
   - Buat pengguna baru.
   - Kelola periode akademik.
   - Kelola kelas.
   - Kelola kriteria.
   - Konfigurasi AHP.
   - Jalankan perhitungan AHP.
   - Jalankan perhitungan TOPSIS.

**Contoh statistik (data dummy):**
```
Periode Aktif: 2024/2025-Ganjil
Pengguna Aktif: 12
Siswa: 96
Kelas: 4
Kriteria Aktif: 4
AHP Valid: Ya
TOPSIS Tersedia: Ya
```

#### 10.3.2 Dashboard GURU

**Struktur halaman:**

1. **Header/Navbar:** Nama guru, role, kelas yang diampu.
2. **Sidebar:** Menu terbatas (lihat 10.2.2).
3. **Konten utama (ringkasan):**
   - Identitas guru dan kelas yang diampu.
   - Jumlah siswa di kelas tersebut.
   - Jumlah kriteria aktif.
   - Status input nilai (berapa siswa sudah diberi nilai untuk kriteria tertentu).
   - Ranking kelas (jika sudah ada perhitungan TOPSIS).

**Contoh ringkasan (data dummy):**
```
kelas: 11 TKJ 6
wali guru: Pak Budi
Siswa: 24
Kriteria: 4
Nilai siswa dengan data lengkap: 18/24
Ranking tersedia: Ya
```

#### 10.3.3 Dashboard KEPALA_SEKOLAH

**Struktur halaman:**

1. **Header/Navbar:** Nama kepala sekolah, role.
2. **Sidebar:** Menu terbatas (lihat 10.2.2).
3. **Konten utama (ringkasan):**
   - Periode aktif.
   - Status perhitungan (AHP dan TOPSIS).
   - Ringkasan ranking (top 5 atau keseluruhan jika dimungkinkan).
   - Akses ke laporan PDF.

**Contoh ringkasan (data dummy):**
```
Periode Aktif: 2024/2025-Ganjil
AHP Terhitung: Ya (CR: 0,04)
TOPSIS Terhitung: Ya
Ranking Siswa: 96 siswa terhitung
Laporan: 3 laporan dihasilkan bulan ini
```

### 10.4 Halaman Login

**Struktur halaman login:**

1. **Header sederhana:** Logo aplikasi (placeholder), judul aplikasi.
2. **Form login:**
   - Email (with label and hint).
   - Password (with show/hide toggle).
   - Tombol "Masuk".
   - Link "Lupa password?" (opsional — bisa ditambahkan nanti jika diperlukan).
3. **Error state:**
   - Menampilkan pesan error jika login gagal (email tidak ditemukan, password salah, atau akun tidak aktif).
4. **Loading state:**
   - Menampilkan spinner atau indikator loading saat proses login.
5. **Validasi input:**
   - Email harus format email yang valid.
   - Password wajib diisi.
6. **Aksesibilitas:**
   - Label terhubung dengan input.
   - Focus management yang baik.
   - Keyboard navigable.

**Catatan keamanan:** Password tidak pernah disimpan di localStorage/sessionStorage. Cookie httpOnly digunakan (lihat Bagian 9).

### 10.5 Dashboard SUPER_ADMIN

#### 10.5.1 Ringkasan

Dashboard SUPER_ADMIN menyediakan:

- Statistik umum sistem.
- Menu aksi cepat.
- Link ke halaman manajemen (pengguna, kelas, siswa, kriteria, AHP, TOPSIS, laporan, audit log).

#### 10.5.2 Statistik

Statistik ditampilkan dalam card-grid layout:

- **Periode aktif:** Nama periode, tanggal mulai, tanggal akhir.
- **Pengguna:** Total pengguna aktif (SUPER_ADMIN, GURU, KEPALA_SEKOLAH).
- **Siswa:** Jumlah siswa periode aktif.
- **Kelas:** Jumlah kelas periode aktif.
- **Kriteria:** Jumlah kriteria aktif.
- **AHP status:** Menunjukkan apakah ada perhitungan AHP yang valid (CR ≤ 0,10).
- **TOPSIS status:** Menunjukkan apakah ada hasil TOPSIS yang tersedia.

#### 10.5.3 Menu Aksi Cepat

Tombol atau card yang memungkinkan SUPER_ADMIN langsung menuju:

- Buat pengguna baru.
- Kelola periode akademik.
- Kelola kelas.
- Kelola siswa.
- Kelola kriteria.
- AHP: konfigurasi perbandingan.
- AHP: jalankan perhitungan.
- TOPSIS: jalankan perhitungan.
- Lihat ranking.
- Buat laporan PDF.
- Lihat audit log.

### 10.6 Dashboard GURU

#### 10.6.1 Ringkasan

Dashboard GURU ditujukan untuk:

- Memberikan informasi tentang kelas yang diampu.
- Menjadi pintu masuk ke halaman siswa, nilai, dan ranking.

#### 10.6.2 Identitas Kelas

Informasi yang ditampilkan:

- Nama guru.
- Kelas yang diampu (misal: "11 TKJ 6").
- Periode akademik.
- Jumlah siswa di kelas tersebut.

#### 10.6.3 Status Input Nilai

Menunjukkan progres input nilai:

- Per kriteria: berapa siswa yang sudah diberi nilai vs total siswa di kelas.
- Status missing value: jika ada siswa dengan nilai yang tidak lengkap, ditampilkan sebagai indikator.

### 10.7 Dashboard KEPALA_SEKOLAH

#### 10.7.1 Ringkasan

Dashboard KEPALA_SEKOLAH menyediakan:

- Ringkasan periode akademik.
- Status perhitungan AHP dan TOPSIS.
- Akses cepat ke ranking siswa dan laporan.

#### 10.7.2 Status Perhitungan

- **AHP:** Menunjukkan apakah ada perhitungan AHP yang valid (CR ≤ 0,10). Jika ya, menampilkan CR terakhir dan bobot kriteria.
- **TOPSIS:** Menunjukkan apakah ada hasil TOPSIS yang tersedia.

#### 10.7.3 Ranking

Menampilkan ringkasan ranking siswa (bisa dalam bentuk daftar atau tabel). Link ke halaman ranking lengkap.

### 10.8 Manajemen Data (Periode, Kelas, Siswa, Kriteria)

#### 10.8.1 Manajemen Periode Akademik

**Halaman: List Periode Akademik**

- Tabel/list periode akademik dengan kolom:
  - Nama periode (misal: "2024/2025-Ganjil").
  - Tanggal mulai.
  - Tanggal akhir.
  - Status (aktif/nonaktif).
  - Aksi (set active untuk SUPER_ADMIN).
- Filter: berdasarkan status.
- Aksi: SUPER_ADMIN dapat membuat periode baru, mengedit, dan menghapus (soft delete).
- **Set Active:** Hanya satu periode yang bisa aktif setiap saat. Setiap periode baru yang di-set aktif akan menonaktifkan periode sebelumnya.

**Halaman: Form Tambah/Edit Periode Akademik**

- Nama periode.
- Tanggal mulai.
- Tanggal akhir.
- Validasi: tanggal mulai harus sebelum tanggal akhir.

#### 10.8.2 Manajemen Kelas

**Halaman: List Kelas**

- Tabel/list kelas dengan kolom:
  - Nama kelas (misal: "11 TKJ 6").
  - Periode akademik.
  - Wali kelas (nama guru).
  - Jumlah siswa.
- Filter: berdasarkan periode akademik.
- Aksi SUPER_ADMIN: tambah kelas, edit kelas, hapus kelas.
- GURU hanya melihat kelas yang menjadi tanggung jawabnya (jika ada).

**Halaman: Form Tambah/Edit Kelas**

- Nama kelas.
- Periode akademik (dropdown).
- Wali kelas (dropdown guru) — untuk SUPER_ADMIN.

#### 10.8.3 Manajemen Siswa

**Halaman: List Siswa**

- Tabel/list siswa dengan kolom:
  - Kode siswa (student_code).
  - Nama siswa.
  - Kelas.
  - Periode akademik.
  - Status (aktif/nonaktif).
- Filter: berdasarkan kelas, periode akademik.
- Aksi:
  - SUPER_ADMIN: tambah siswa, edit siswa, nonaktifkan (soft delete).
  - GURU: tambah siswa (hanya untuk kelasnya), edit siswa, nonaktifkan.
  - KEPALA_SEKOLAH: lihat saja.
- Proteksi ownership: GURU hanya melihat dan mengelola siswa di kelasnya sendiri.

**Halaman: Form Tambah/Edit Siswa**

- Kode siswa (student_code).
- Nama siswa.
- Kelas (dropdown, hanya kelas yang diampu GURU jika user GURU).
- Validasi: kode siswa unik dalam periode akademik dan kelas.

#### 10.8.4 Manajemen Kriteria

**Halaman: List Kriteria**

- Tabel/list kriteria dengan kolom:
  - Kode kriteria (misal: "C1").
  - Nama kriteria.
  - Tipe (BENEFIT/COST).
  - Deskripsi (jika ada).
  - Status (aktif/nonaktif).
- Filter: berdasarkan periode akademik.
- Aksi SUPER_ADMIN:
  - Tambah kriteria.
  - Edit kriteria.
  - Nonaktifkan kriteria (soft delete, tidak dihapus dari database).
- GURU dan KEPALA_SEKOLAH hanya melihat.

**Peringatan jika nonaktifkan kriteria:** Jika kriteria dinonaktifkan, hasil AHP dan TOPSIS yang terkait menjadi tidak valid. Sistem harus menampilkan peringatan bahwa pengguna harus melakukan recalculation AHP dan TOPSIS setelah perubahan konfigurasi kriteria (lihat Bagian 9.16.1 poin 6).

**Halaman: Form Tambah/Edit Kriteria**

- Kode kriteria.
- Nama kriteria.
- Tipe (BENEFIT atau COST).
- Deskripsi (opsional).
- Periode akademik (dropdown).

### 10.9 Input/Edit Nilai Siswa

#### 10.9.1 Halaman List Nilai

**Halaman: Nilai Siswa (GURU)**

- Tabel nilai dengan baris: siswa.
- Kolom: kriteria (tabel dinamis, satu kolom per kriteria aktif).
- Setiap sel berisi:
  - Input angka (untuk nilai yang ada).
  - Indikator missing value (misal: tulisan "Missing" atau icon khusus).
  - Tombol untuk menandai sebagai missing.
- Footer: rata-rata, minimum, maksimum per kriteria (opsional).

**Contoh tampilan:**
```
| Siswa (kode) | C1: Pengetahuan | C2: Prakerin | C3: Absensi | C4: Ekskul |
|--------------|----------------|-------------|-----------|-----------|
| STU-001      | 85             | 90          | 2         | 1         |
| STU-002      | 90             | 85          | 1         | 0         |
| STU-003      | [Missing]      | 88          | 3         | 2         |
```

**Indikator missing value:**

- Jika `is_missing = true`, sel menampilkan indikator yang jelas (misal: warna gelap, icon "tidak ada data", atau tulisan "Missing").
- GURU dapat mengubah status missing dengan mengklik icon (set `is_missing = false` dan memasukkan nilai).

#### 10.9.2 Form Input Nilai (Detail Siswa)

**Halaman: Input Nilai Siswa**

- Tampilkan data siswa (kode, nama) di bagian atas.
- Daftar kriteria aktif dengan input:
  - Nomor urut kriteria.
  - Nama kriteria.
  - Tipe (BENEFIT/COST).
  - Input nilai (angka).
  - Checkbox "Tandai sebagai missing value".
- Tombol "Simpan".
- Validasi:
  - Nilai harus numerik.
  - Jika `is_missing = true`, nilai harus `null` (kosong).
  - Jika `is_missing = false`, nilai wajib diisi.

#### 10.9.3 Validasi Input Nilai

- **Rentang nilai:** Misal 0–100 untuk skor. Validasi di frontend dan backend.
- **Missing value:** Jika `is_missing = true`, input nilai di-disable atau dihapus, dan sistem menyimpan `is_missing = true` dengan `value = null`.
- **Error:** Menampilkan pesan error jika input tidak valid.

### 10.10 Halaman Konfigurasi AHP dan Hasil Consistency Ratio

#### 10.10.1 Halaman List Perbandingan AHP

**Halaman: AHP - Perbandingan**

- Ditujukan untuk SUPER_ADMIN.
- Menampilkan matriks perbandingan berpasangan dalam bentuk tabel.
- Kolom: kriteria ke-i, kriteria ke-j, nilai perbandingan.
- Diagonal tidak ditampilkan (selalu 1).
- Nilai a_ji ditampilkan sebagai reciprocal dari a_ij.

**Contoh matriks:**
```
|       | C1   | C2   | C3   | C4   |
|-------|------|------|------|------|
| C1    | 1    | 3    | 5    | 7    |
| C2    | 1/3  | 1    | 3    | 5    |
| C3    | 1/5  | 1/3  | 1    | 3    |
| C4    | 1/7  | 1/5  | 1/3  | 1    |
```

#### 10.10.2 Form Input Perbandingan

**Halaman: AHP - Tambah/Edit Perbandingan**

- Dropdown untuk memilih pasangan kriteria (i, j).
- Input nilai perbandingan (1–9 atau reciprocal).
- Validasi: nilai harus antara 1–9 (atau reciprocal yang valid), harus > 0.
- Opsi "Isi semua" — untuk memasukkan kriteria yang belum ada.
- Opsi "Batal" — kembali ke list.

**Peringatan:** Jika CR > 0,10 setelah perhitungan, sistem akan menampilkan notifikasi bahwa perbandingan tidak konsisten dan perlu direvisi.

#### 10.10.3 Halaman Hasil Perhitungan AHP

**Halaman: AHP - Perhitungan**

- Menampilkan hasil perhitungan AHP:
  - Vektor bobot (weight vector).
  - CI (Consistency Index).
  - CR (Consistency Ratio).
  - RI (Random Index yang digunakan).
  - λ_max (Lambda maksimum).
  - Status: konsisten (CR ≤ 0,10) atau tidak konsisten (CR > 0,10).
  - Pesan: jika tidak konsisten, pesan peringatan.
  - Tombol "Jalankan Ulang Perhitungan" (supaya user bisa merevisi perbandingan).

**Contoh hasil (data dummy):**
```
Bobot Kriteria:
- C1 (Pengetahuan): 0,4000
- C2 (Prakerin): 0,3000
- C3 (Absensi): 0,2000
- C4 (Ekskul): 0,1000

CI: 0,0400
CR: 0,0444
RI: 0,9000
λ_max: 4,0400

Status: KR Konsisten (CR ≤ 0,10)
```

**Keterangan:** Halaman ini hanya diakses oleh SUPER_ADMIN (lihat Bagian 9.5.3).

### 10.11 Halaman Proses dan Hasil TOPSIS/Ranking

#### 10.11.1 Halaman Ranking Siswa

**Halaman: Ranking Siswa**

- Ditampilkan dalam bentuk tabel/daftar:
  - Peringkat (1, 2, 3, ...).
  - Kode siswa.
  - Nama siswa.
  - Kelas (untuk KEPALA_SEKOLAH dan SUPER_ADMIN).
  - Nilai preferensi (Vi).
- Filter:
  - SUPER_ADMIN: semua siswa, semua kelas.
  - KEPALA_SEKOLAH: semua siswa, semua kelas.
  - GURU: hanya siswa di kelasnya (otomatis difilter backend, lihat Bagian 9.6).
- Tombol "Jalankan Perhitungan TOPSIS" (SUPER_ADMIN).

**Contoh ranking (data dummy):**
```
| Peringkat | Kode Siswa | Nama Siswa | Kelas     | Nilai Preferensi |
|-----------|------------|------------|-----------|------------------|
| 1         | STU-012    | Siswa A    | 11 TKJ 6  | 0,987            |
| 2         | STU-007    | Siswa B    | 11 TKJ 6  | 0,965            |
| 3         | STU-023    | Siswa C    | 11 TKJ 7  | 0,952            |
```

**Tie-breaking:** Jika ada siswa dengan nilai preferensi yang sama, sistem dapat menampilkan "draw" atau menggunakan kriteria tie-breaker (lihat Bagian 7.9 — ini adalah OPEN QUESTION yang perlu ditentukan nanti).

#### 10.11.2 Halaman Detail Ranking (opsional)

**Halaman: Detail Ranking Siswa**

- Selain ranking, menampilkan detail perhitungan untuk siswa tertentu:
  - Nilai asli untuk setiap kriteria.
  - Matriks ternormalisasi.
  - Matriks terbobot.
  - Jarak ke solusi ideal positif dan negatif.
  - Nilai preferensi.

### 10.12 Halaman Laporan PDF

#### 10.12.1 Halaman List Laporan

**Halaman: Laporan PDF**

- Ditampilkan untuk KEPALA_SEKOLAH dan SUPER_ADMIN.
- Tabel list laporan dengan kolom:
  - ID laporan.
  - Periode akademik.
  - Tanggal dibuat.
  - Status (siap).
  - Tombol "Unduh PDF".
  - Tombol "Hapus" (opsional).

#### 10.12.2 Halaman Generate Laporan

**Halaman: Buat Laporan PDF**

- Form untuk memilih periode akademik.
- Pilihan: gunakan hasil TOPSIS terbaru atau pilih perhitungan tertentu.
- Tombol "Generasi Laporan".
- Setelah generasi selesai, laporan muncul di list laporan dengan status "siap".

#### 10.12.3 Preview Laporan (opsional)

- Preview teks laporan sebelum diunduh (tanpa logo resmi, hanya placeholder KOP).
- Konten: judul laporan, identitas, periode, tabel ranking, hasil perhitungan, ruang tanda tangan.

### 10.13 Audit Log untuk SUPER_ADMIN

#### 10.13.1 Halaman Audit Log

**Halaman: Audit Log**

- Hanya diakses oleh SUPER_ADMIN.
- Tabel/list log aktivitas dengan kolom:
  - Waktu (timestamp).
  - Pengguna.
  - Tipe aksi (LOGIN, CREATE, UPDATE, DELETE, CALCULATE, dll.).
  - Resource (jenis resource, misal: "students", "criteria", dll.).
  - Detail (opsional, ringkasan).
- Filter:
  - User.
  - Tipe aksi.
  - Periode tanggal.
  - Resource type.
- Pagination.

### 10.14 Loading, Empty State, Validation Error, Success State, dan Error State

#### 10.14.1 Loading State

- Seluruh halaman yang memuat data dari API akan menampilkan loading state (spinner, skeleton screen, atau progress indicator).
- Contoh: saat tabel siswa memuat, tampilkan skeleton rows.

#### 10.14.2 Empty State

- Jika data kosong (misal: tidak ada siswa di kelas, tidak ada nilai), tampilkan pesan ramah:

```
Belum ada data.
[ Tambah Siswa ] [ Isi Nilai ]
```

- Untuk halaman yang bisa diisi, berikan tombol aksi.

#### 10.14.3 Validation Error

- Error input ditampilkan dekat dengan field yang bermasalah.
- Pesan error yang jelas dan spesifik.
- Contoh: "Email tidak valid", "Password minimal 8 karakter".
- Error harus dapat diakses oleh screen reader.

#### 10.14.4 Success State

- Setelah operasi berhasil, tampilkan notifikasi sukses (misal: toast/alert):
  - "Data berhasil disimpan."
  - "Nilai berhasil diperbarui."
  - "Laporan berhasil dibuat."
- Notifikasi bisa otomatis hilang setelah beberapa detik, atau tetap sampai user menutupnya.

#### 10.14.5 Error State

- Error API (misal: 400, 403, 404, 500) ditampilkan sebagai pesan error yang informatif tapi tidak membocorkan informasi internal.
- Contoh pesan error:
  - 400: "Data tidak valid. Harap periksa input Anda."
  - 403: "Anda tidak memiliki akses ke halaman ini."
  - 404: "Data tidak ditemukan."
  - 500: "Terjadi kesalahan sistem. Silakan coba lagi nanti."
- Jangan tampilkan stack trace atau detail teknis.

### 10.15 Responsive Design

#### 10.15.1 Breakpoints

- **Desktop:** ≥ 1024 px — sidebar dan layout penuh.
- **Tablet:** 768 px – 1023 px — sidebar bisa collapse atau menjadi drawer.
- **Mobile:** < 768 px — bottom navigation, layout stack, tabel menjadi scrollable atau card-based.

#### 10.15.2 Prinsip Responsif

- Tidak ada horizontal scroll di mobile.
- Tabel yang memiliki banyak kolom dapat di-scroll horizontal.
- Touch target minimal 44×44 px untuk elemen interaktif.
- Ukuran font yang tetap terbaca di semua ukuran layar.

#### 10.15.3 Perilaku Mobile Khusus

- Sidebar diubah menjadi drawer yang bisa dibuka dengan tombol hamburger atau swipe.
- Bottom navigation untuk halaman yang sering diakses.
- Form input full-width.
- Tombol "Simpan" dan "Batal" berukuran lebih besar untuk finger-friendly.

### 10.16 Accessibility Dasar

#### 10.16.1 Level WCAG Target

Target keterjangkauan minimal WCAG 2.1 Level A, dengan target Level AA untuk hal-hal penting.

#### 10.16.2 Prinsip Aksesibilitas yang Diterapkan

1. **Contrast warna:** Pastikan kontras teks dan background memenuhi standar WCAG (minimal 4,5:1 untuk teks normal).
2. **Label dan aria-label:** Semua input memiliki label yang terhubung.
3. **Focus indicator:** Focus state yang terlihat jelas (bukan hanya perubahan warna, tapi juga outline atau border).
4. **Keyboard navigation:** Semua fungsi dapat diakses dengan keyboard (tanpa mouse).
5. **Alt text untuk image:** Jika ada image (logo placeholder, icon), berikan alt text yang deskriptif.
6. **Heading hierarchy:** Gunakan heading yang terstruktur (h1 > h2 > h3).
7. **Skip link:** Link untuk melewati navigasi dan langsung ke konten utama.
8. **Error identification:** Error form diidentifikasi dengan teks dan atribut aria-invalid.

#### 10.16.3 Contoh Implementasi

- Input email:
```html
<label for="email">Email</label>
<input id="email" type="email" name="email" required />
```

- Error message:
```html
<div class="error" role="alert">
  <span aria-hidden="true">⚠</span> Email tidak valid.
</div>
```

### 10.17 Proteksi UI Berdasarkan Role

#### 10.17.1 Prinsip Utama

- Menu navigasi ditampilkan sesuai dengan role pengguna.
- Halaman yang tidak relevan untuk role TIDAK ditampilkan di menu.
- Namun, **proteksi UI bukan pengganti keamanan backend**.
- Backend tetap memvalidasi setiap request (lihat Bagian 8 dan 9).

#### 10.17.2 Contoh Proteksi UI

- **SUPER_ADMIN:** Menu lengkap.
- **GURU:** Menu terbatas (tidak ada menu "Pengguna", "Kriteria", "AHP", "TOPSIS", "Audit Log").
- **KEPALA_SEKOLAH:** Menu untuk melihat hasil dan laporan, tanpa akses ke konfigurasi.

#### 10.17.3 Proteksi Halaman

- Jika pengguna mencoba mengakses halaman yang tidak diizinkan (misal: GURU mencoba mengakses `/admin/users`), halaman harus menampilkan pesan "Anda tidak memiliki akses ke halaman ini" atau redirect ke halaman yang sesuai.
- Ini adalah UX, bukan pengganti backend guard.

### 10.18 Tabel Ringkas: Role × Halaman × Akses

| Halaman | SUPER_ADMIN | GURU | KEPALA_SEKOLAH |
|---------|-------------|------|----------------|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ (lengkap) | ✅ (kelas) | ✅ (lihat hasil) |
| Pengguna (Users) | ✅ CRUD | — | — |
| Periode Akademik | ✅ CRUD | ✅ Lihat | ✅ Lihat |
| Kelas | ✅ CRUD | ✅ Lihat (kelas sendiri) | ✅ Lihat |
| Siswa | ✅ CRUD (semua) | ✅ CRUD (kelas sendiri) | ✅ Lihat |
| Kriteria | ✅ CRUD | ✅ Lihat | ✅ Lihat |
| Nilai Siswa | ✅ CRUD (semua) | ✅ CRUD (kelas sendiri) | ✅ Lihat |
| AHP - Perbandingan | ✅ CRUD | — | — |
| AHP - Perhitungan | ✅ CRUD | — | ✅ Lihat |
| TOPSIS - Perhitungan | ✅ CRUD | — | ✅ Lihat |
| TOPSIS - Ranking | ✅ Lihat (semua) | ✅ Lihat (kelas sendiri) | ✅ Lihat (semua) |
| Laporan PDF | ✅ CRUD | — | ✅ CRUD |
| Audit Log | ✅ Lihat | — | — |

**Keterangan:**
- ✅ = Full access sesuai hak.
- CRUD = Create, Read, Update, Delete.
- Lihat = Hanya dapat membaca, tidak dapat mengubah.
- "—" = Tidak memiliki akses (halaman tidak muncul di menu).
- GURU hanya memiliki akses untuk data di kelas yang menjadi tanggung jawabnya. Ownership GURU ditentukan melalui `classes.wali_teacher_id` (FK ke users.id), tidak melalui kolom di tabel `users`. Setelah login, GURU mendapatkan claim `owned_class_ids` (array UUID kelas miliknya) yang digunakan frontend untuk menampilkan menu dan data yang relevan. Data di kelas lain tidak dapat diakses.
- KEPALA_SEKOLAH hanya memiliki akses "lihat" untuk sebagian besar halaman (tidak dapat mengubah konfigurasi).
- SUPER_ADMIN memiliki akses penuh.

### 10.19 Konsistensi dengan Bagian Lain

- **Bagian 8 (REST API):** Setiap halaman harus terhubung dengan endpoint yang telah didokumentasikan (lihat tabel akses di atas).
- **Bagian 4 (Database):** Struktur data (student_code, class_id, wali_teacher_id, criteria, scores) mendukung tampilan yang dirancang.
- **Bagian 6 (AHP):** Halaman AHP sesuai dengan logika AHP dinamis (N kriteria, perbandingan N×N).
- **Bagian 7 (TOPSIS):** Halaman ranking sesuai dengan logika TOPSIS dinamis (M siswa, N kriteria).
- **Bagian 9 (Keamanan):** Proteksi UI berdasarkan role, tapi backend tetap melakukan validasi ownership.

### 10.20 Ringkasan

Bagian ini mendokumentasikan perancangan UI/UX yang sesuai dengan requirement proyek, role pengguna, dan endpoint API yang telah ditentukan. Setiap halaman dirancang dengan mempertimbangkan prinsip usability, aksesibilitas, dan keamanan. Proteksi UI dilakukan berdasarkan role, tetapi keamanan utama tetap di-backend sesuai Bagian 8 dan 9. Dokumen ini tidak berisi implementasi kode atau wireframe gambar — hanya dokumentasi rancangan antarmuka.

---

*Dokumen ini merupakan Bagian 10 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md beserta Bagian 1–9.*
