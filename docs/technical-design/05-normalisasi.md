# RANCANGAN SISTEM
## 5. NORMALISASI

### 5.1 Tujuan Normalisasi

Tujuan normalisasi basis data dalam sistem ini adalah:
1. Menghindari redundansi data yang dapat menyebabkan inkonsistensi
2. Memastikan integritas referensial antar tabel
3. Memudahkan pemeliharaan dan pengembangan skema di masa depan
4. Mendukung struktur dinamis (jumlah kriteria dapat berubah tanpa migrasi skema)

### 5.2 Definisi Singkat

| Normalisasi | Deskripsi |
|-------------|-----------|
|| **1NF** | Setiap kolom berisi nilai atomik (tidak dapat diuraikan lagi). Tidak ada kelompok nilai atau array dalam satu sel. Setiap baris diidentifikasi secara unik dengan primary key. |

*Catatan:* Dalam desain ini, kolom dengan tipe JSONB tidak dianggap sebagai pemenuhan 1NF secara murni. JSONB digunakan secara terbatas hanya untuk menyimpan **snapshot hasil perhitungan** (AHP/TOPSIS) dan **payload audit** yang bersifat semi-structured — bukan sebagai pengganti tabel relasional atau untuk data yang memerlukan FK/constraint. Tabel relasional utama (`users`, `academic_periods`, `classes`, `students`, `criteria`, `ahp_comparisons`, `scores`) semuanya memenuhi 1NF secara ketat dengan kolom atomik. JSONB diterima sebagai kompromi praktis untuk reproducibility dan fleksibilitas snapshot, bukan karena pertimbangan normalisasi.
| **2NF** | Memenuhi 1NF dan semua atribut non-key bergantung pada **seluruh** primary key (bukan hanya sebagian), untuk tabel dengan composite key. |
| **3NF** | Memenuhi 2NF dan tidak ada **transitive dependency**, yaitu tidak ada atribut non-key yang bergantung pada atribut non-key lain. |

### 5.3 Analisis 1NF

#### 5.3.1 Tabel `users`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal, tidak dapat diuraikan |
| email | ✓ | Satu string email, tidak ada daftar email |
| password_hash | ✓ | Satu string hash, bukan multiple hash |
| name | ✓ | Satu nama lengkap, bukan nama depan + belakang terpisah |
| role | ✓ | Satu nilai enum, bukan daftar role |
| created_at | ✓ | Satu timestamp |
| updated_at | ✓ | Satu timestamp |

**Kesimpulan:** Tabel `users` memenuhi 1NF ✓

#### 5.3.2 Tabel `academic_periods`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| name | ✓ | Satu string nama periode |
| school_year | ✓ | Satu string tahun ajaran |
| semester | ✓ | Satu nilai enum (GANJIL/GENAP) |
| is_active | ✓ | Satu boolean |
| created_at | ✓ | Satu timestamp |

**Kesimpulan:** Tabel `academic_periods` memenuhi 1NF ✓

#### 5.3.3 Tabel `classes`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| name | ✓ | Satu nama kelas |
| academic_period_id | ✓ | Satu UUID periode |
| wali_teacher_id | ✓ | Satu UUID pengguna |
| created_at, updated_at | ✓ | Satu timestamp masing-masing |

**Kesimpulan:** Tabel `classes` memenuhi 1NF ✓

#### 5.3.4 Tabel `students`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| class_id | ✓ | Satu UUID kelas |
| student_code | ✓ | Satu string kode (atau NULL) |
| name | ✓ | Satu nama siswa |
| is_active | ✓ | Satu boolean |
| created_at, updated_at | ✓ | Satu timestamp masing-masing |

**Kesimpulan:** Tabel `students` memenuhi 1NF ✓

#### 5.3.5 Tabel `criteria`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| code | ✓ | Satu kode (misal: C1) |
| name | ✓ | Satu nama kriteria |
| type | ✓ | Satu nilai enum (BENEFIT/COST) |
| is_active | ✓ | Satu boolean |
| description | ✓ | Satu teks (boleh kosong), bukan multiple deskripsi |
| created_at, updated_at | ✓ | Satu timestamp masing-masing |

**Kesimpulan:** Tabel `criteria` memenuhi 1NF ✓

#### 5.3.6 Tabel `ahp_comparisons`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| academic_period_id | ✓ | Satu UUID periode |
| criteria_i_id | ✓ | Satu UUID kriteria |
| criteria_j_id | ✓ | Satu UUID kriteria |
| comparison_value | ✓ | Satu float (nilai perbandingan tunggal) |
| created_by | ✓ | Satu UUID pengguna |
| created_at | ✓ | Satu timestamp |

**Kesimpulan:** Tabel `ahp_comparisons` memenuhi 1NF ✓

#### 5.3.7 Tabel `ahp_calculations`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| academic_period_id | ✓ | Satu UUID periode |
| calculated_at | ✓ | Satu timestamp |
| ci | ✓ | Satu float (Consistency Index) |
| cr | ✓ | Satu float (Consistency Ratio) |
| ri | ✓ | Satu float (Random Index) |
| weight_vector | ⚠ | JSONB — bukan atomik dalam arti tradisional. Kolom ini adalah **pengecualian praktis**, bukan pemenuhan 1NF secara murni. |
| is_valid | ✓ | Satu boolean |
| created_by | ✓ | Satu UUID pengguna |

**Catatan khusus untuk `weight_vector`:** Kolom JSONB ini digunakan semata-mata untuk menyimpan **snapshot hasil perhitungan AHP** — yaitu vektor bobot yang dihasilkan dari proses perbandingan pairwise. JSONB dipilih karena jumlah kriteria (N) bersifat dinamis dan snapshot perlu disimpan sebagai satu kesatuan yang koheren untuk keperluan reproducibility dan audit.

Penting untuk ditekankan: JSONB **tidak digunakan** sebagai pengganti relasi utama atau untuk data yang membutuhkan FK/constraint relasional. Data bobot tidak memerlukan relasi ke kriteria individual karena nilainya adalah hasil perhitungan yang sudah matang — tabel `criteria` tetap menjadi sumber kebenaran untuk definisi kriteria, dan `weight_vector` hanya menyimpan hasilnya dalam bentuk snapshot. Jika di masa depan kebutuhan query terhadap bobot per-kriteria secara individual meningkat, kolom ini dapat dipecah menjadi tabel `ahp_weights` dengan normalisasi lebih tinggi.

**Kesimpulan:** Tabel `ahp_calculations` **tidak memenuhi 1NF secara ketat** karena kolom `weight_vector` (JSONB) bukan atomik secara tradisional. Namun, ini adalah pengecualian yang disengaja dan terdokumentasi: tabel relasional utama sudah memenuhi 1NF, dan JSONB digunakan hanya untuk snapshot hasil perhitungan AHP yang bersifat semi-structured.

#### 5.3.8 Tabel `scores`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| student_id | ✓ | Satu UUID siswa |
| criteria_id | ✓ | Satu UUID kriteria |
| academic_period_id | ✓ | Satu UUID periode |
| value | ✓ | Satu float (nilai tunggal) |
| is_missing | ✓ | Satu boolean |
| note | ✓ | Satu teks (boleh kosong) |
| created_by | ✓ | Satu UUID guru |
| created_at, updated_at | ✓ | Satu timestamp masing-masing |

**Kesimpulan:** Tabel `scores` memenuhi 1NF ✓

#### 5.3.9 Tabel `topsis_calculations`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| academic_period_id | ✓ | Satu UUID periode |
| ahp_calculation_id | ✓ | Satu UUID |
| calculated_at | ✓ | Satu timestamp |
|| decision_matrix | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk snapshot matriks M×N |
|| normalized_matrix | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk snapshot matriks R |
|| weighted_matrix | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk snapshot matriks V |
|| ideal_positive | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk vektor A+ |
|| ideal_negative | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk vektor A- |
|| distance_positive | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk vektor D+ |
|| distance_negative | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk vektor D- |
|| preference_value | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk vektor V_i |
|| rank | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk ranking {student_code: rank} |
| created_by | ✓ | Satu UUID pengguna |

**Catatan khusus untuk JSONB:** Semua kolom JSONB di tabel ini adalah **pengecualian praktis**, bukan pemenuhan 1NF secara murni. JSONB digunakan di sini semata-mata untuk menyimpan **snapshot lengkap hasil perhitungan TOPSIS** dalam satu baris yang koheren. Alasannya:

- Jumlah siswa (M) dan kriteria (N) bersifat dinamis; menyimpan matriks sebagai kolom-kolom tetap membutuhkan duplikasi atau kolom yang missing.
- Snapshot yang lengkap (matriks keputusan, matriks ternormalisasi, matriks tertimbang, vektor ideal, jarak, preference value, rank) diperlukan untuk reproducibility dan audit hasil perhitungan.
- JSONB memungkinkan seluruh snapshot disimpan sebagai satu kesatuan tanpa kehilangan struktur.

Penting: JSONB **tidak digunakan** sebagai pengganti relasi utama atau untuk data yang membutuhkan FK/constraint relasional. Keseluruhan logika relasional (periode, kriteria, siswa, nilai) tetap ditangani oleh tabel-tabel relasional dengan FK dan constraint yang tepat. Kolom JSONB di sini hanya menyimpan hasil perhitungan — bukan data yang perlu di-query secara individual dengan integrity constraint. Jika di masa depan kebutuhan query terhadap elemen-elemen snapshot meningkat, kolom-kolom ini dapat dipecah menjadi tabel terpisah dengan normalisasi lebih tinggi.

**Kesimpulan:** Tabel `topsis_calculations` **tidak memenuhi 1NF secara ketat** karena seluruh kolom JSONB bukan atomik. Namun, ini adalah pengecualian yang disengaja dan terdokumentasi: tabel relasional utama sudah memenuhi 1NF, dan JSONB digunakan hanya untuk snapshot hasil perhitungan yang bersifat semi-structured.

#### 5.3.10 Tabel `audit_logs`

| Kolom | Nilai Atomik? | Alasan |
|-------|---------------|--------|
| id | ✓ | UUID tunggal |
| user_id | ✓ | Satu UUID pengguna |
| action | ✓ | Satu string aksi |
| user_name | ✓ | Satu nama pengguna |
| resource_type | ✓ | Satu string tipe entitas sumber aksi |
| resource_id | ✓ | Satu UUID atau null (jika entitas spesifik tidak ada) |
|| details | ⚠ | JSONB — bukan atomik; **pengecualian praktis** untuk detail/payload aksi yang bervariasi |
|| ip_address | ✓ | Satu string alamat IP (maks 45 karakter untuk IPv6 support) |
|| created_at | ✓ | Satu timestamp |

**Catatan khusus untuk JSONB:** Kolom `details` menggunakan JSONB sebagai **pengecualian praktis**, bukan pemenuhan 1NF secara murni. JSONB digunakan di sini karena:

- Struktur `details` bervariasi tergantung entitas dan aksi yang direkam (payload perubahan data, konteks autentikasi, metadata operasi).
- Fleksibilitas ini diperlukan untuk audit trail yang komprehensif — setiap tindakan bisa memiliki konteks yang berbeda.
- JSONB memungkinkan mencatat konteks aksi secara lengkap tanpa perlu membuat banyak kolom nullable atau tabel turunan.

Penting: JSONB **tidak digunakan** sebagai pengganti relasi utama atau untuk data yang membutuhkan FK/constraint relasional. Payload audit bersifat informatif dan tidak memerlukan integrity constraint. Tabel `audit_logs` tetap memiliki FK ke `users` untuk melacak siapa yang melakukan aksi.

**Kesimpulan:** Tabel `audit_logs` **tidak memenuhi 1NF secara ketat** karena kolom `details` (JSONB) bukan atomik secara tradisional. Namun, ini adalah pengecualian yang disengaja dan terdokumentasi: tabel relasional utama sudah memenuhi 1NF, dan JSONB digunakan hanya untuk payload audit yang bersifat semi-structured.

### 5.4 Analisis 2NF

2NF berlaku untuk tabel dengan **composite primary key** (bukan primary key tunggal). Untuk tabel dengan primary key tunggal (UUID), 2NF otomatis terpenuhi karena hanya ada satu atribut key, sehingga tidak mungkin ada partial dependency partial terhadap sebagian key.

#### 5.4.1 Tabel dengan Primary Key Tunggal

Tabel berikut memiliki primary key berupa UUID tunggal, sehingga 2NF otomatis terpenuhi:
- `users` (id)
- `academic_periods` (id)
- `classes` (id)
- `students` (id)
- `criteria` (id)
- `ahp_calculations` (id)
- `topsis_calculations` (id)
- `audit_logs` (id)

**Kesimpulan:** Semua tabel di atas memenuhi 2NF ✓

#### 5.4.2 Tabel dengan Composite Unique Key: `scores`

Tabel `scores` memiliki composite unique key: `(student_id, criteria_id, academic_period_id)`.

| Atribut Non-Key | Bergantung pada? | Partial? (bergantung pada sebagian key) |
|-----------------|------------------|------------------------------------------|
| value | student_id + criteria_id + academic_period_id | TIDAK — nilai bergantung pada ketiga faktor sekaligus |
| is_missing | student_id + criteria_id + academic_period_id | TIDAK — status missing bergantung pada ketiganya |
| note | student_id + criteria_id + academic_period_id | TIDAK — catatan terkait nilai spesifik ini |
| created_by | student_id + criteria_id + academic_period_id | TIDAK — guru yang memasukkan nilai ini |
| created_at | student_id + criteria_id + academic_period_id | TIDAK — waktu pembuatan nilai ini |
| updated_at | student_id + criteria_id + academic_period_id | TIDAK — waktu pembaruan nilai ini |

**Kesimpulan:** Tidak ada partial dependency → 2NF ✓

#### 5.4.3 Tabel dengan Composite Unique Key: `ahp_comparisons`

Tabel `ahp_comparisons` memiliki composite unique key: `(academic_period_id, criteria_i_id, criteria_j_id)`.

| Atribut Non-Key | Bergantung pada? | Partial? |
|-----------------|------------------|----------|
| comparison_value | academic_period_id + criteria_i_id + criteria_j_id | TIDAK — nilai perbandingan bergantung pada periode DAN kedua kriteria |
| created_by | academic_period_id + criteria_i_id + criteria_j_id | TIDAK — pengguna yang memasukkan perbandingan ini |
| created_at | academic_period_id + criteria_i_id + criteria_j_id | TIDAK — waktu pembuatan perbandingan ini |

**Kesimpulan:** Tidak ada partial dependency → 2NF ✓

### 5.5 Analisis 3NF

3NF: Tidak ada **transitive dependency**, yaitu tidak ada atribut non-key yang bergantung pada atribut non-key lain.

#### 5.5.1 Contoh Transitive Dependency yang Dihindari

**Masalah potensial jika tidak 3NF:**

Jika tabel `students` memiliki kolom:
- `id` (PK)
- `class_id` (FK)
- `class_name` (nama kelas)

Maka `class_name` adalah **transitive dependency** karena:
- `class_name` bergantung pada `class_id`, bukan pada `student_id`
- `class_name` adalah atribut dari `class`, bukan dari `student`

Ini melanggar 3NF karena atribut non-key (`class_name`) bergantung pada atribut non-key lain (`class_id`).

**Solusi yang diterapkan:**

Tabel `students` hanya menyimpan `class_id` (FK), dan `class_name` ada di tabel `classes`. Ketika perlu menampilkan nama kelas, dilakukan JOIN:

```sql
SELECT s.name, c.name AS class_name
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE s.id = ?
```

#### 5.5.2 Contoh Lain: `scores` dengan Nama Siswa

**Masalah potensial:**

Jika tabel `scores` memiliki:
- `student_id` (FK)
- `student_name` (nama siswa)

Maka `student_name` adalah transitive dependency karena nama siswa bergantung pada `student_id`, bukan pada kombinasi `(student_id, criteria_id, academic_period_id)`.

**Solusi yang diterapkan:**

Tabel `scores` hanya menyimpan `student_id`, dan nama siswa diambil dari tabel `students` melalui JOIN. Ini menjaga konsistensi: jika nama siswa berubah, hanya perlu update di satu tempat (tabel `students`).

#### 5.5.3 Pemeriksaan Tabel `ahp_calculations`

| Kolom | Bergantung pada? (PK = id) | Transitive? |
|-------|---------------------------|-------------|
| id | — | — |
| academic_period_id | id | Tidak — ini FK, bukan transitive |
| calculated_at | id | Tidak — milik entitas ini |
| ci | id | Tidak — milik entitas ini |
| cr | id | Tidak — milik entitas ini |
| ri | id | Tidak — milik entitas ini |
| weight_vector | id | Tidak — milik entitas ini |
| is_valid | id | Tidak — milik entitas ini |
| created_by | id | Tidak — ini FK ke user, bukan transitive |

**Kesimpulan:** Tabel `ahp_calculations` **memenuhi aturan dependensi 3NF untuk kolom relasionalnya** — tidak ada atribut non-key yang bergantung pada atribut non-key lain. Kolom `weight_vector` (JSONB) bukan atomik secara ketat dan merupakan pengecualian terhadap 1NF, tetapi untuk tujuan pemeriksaan transitive dependency, semua kolom (termasuk JSONB) dianggap milik entitas ini sendiri dan tidak bergantung pada atribut non-key lain.

#### 5.5.4 Pemeriksaan Tabel `topsis_calculations`

| Kolom | Bergantung pada? (PK = id) | Transitive? |
|-------|---------------------------|-------------|
| id | — | — |
| academic_period_id | id | Tidak — FK |
| ahp_calculation_id | id | Tidak — FK |
| calculated_at | id | Tidak — milik entitas |
|| Seluruh kolom JSONB | id | Tidak — milik entitas, meski bukan atomik secara murni. Kolom ini adalah pengecualian praktis untuk snapshot. |
| created_by | id | Tidak — FK |

**Kesimpulan:** Tabel `topsis_calculations` **memenuhi aturan dependensi 3NF untuk kolom relasionalnya** — tidak ada atribut non-key yang bergantung pada atribut non-key lain. Keseluruhan kolom JSONB merupakan pengecualian terhadap 1NF secara ketat, tetapi untuk tujuan pemeriksaan transitive dependency, semua kolom (termasuk JSONB) dianggap milik entitas ini sendiri dan tidak bergantung pada atribut non-key lain.

#### 5.5.5 Pemeriksaan Tabel `scores`

| Kolom | Bergantung pada? (PK = id) | Transitive? |
|-------|---------------------------|-------------|
| id | — | — |
| student_id | id | Tidak — FK |
| criteria_id | id | Tidak — FK |
| academic_period_id | id | Tidak — FK |
| value | id | Tidak — milik entitas |
| is_missing | id | Tidak — milik entitas |
| note | id | Tidak — milik entitas |
| created_by | id | Tidak — FK |
| created_at | id | Tidak — milik entitas |
| updated_at | id | Tidak — milik entitas |

**Kesimpulan:** Tabel `scores` **memenuhi aturan dependensi 3NF untuk kolom relasionalnya** — tidak ada atribut non-key yang bergantung pada atribut non-key lain. Kolom `academic_period_id` (FK) sengaja dipertahankan sebagai atribut independen untuk alasan historical data dan reproducibility (lihat 4.2.8 di Bagian 4).

#### 5.5.6 Pemeriksaan Tabel `ahp_comparisons`

| Kolom | Bergantung pada? (PK = id) | Transitive? |
|-------|---------------------------|-------------|
| id | — | — |
| academic_period_id | id | Tidak — FK |
| criteria_i_id | id | Tidak — FK |
| criteria_j_id | id | Tidak — FK |
| comparison_value | id | Tidak — milik entitas |
| created_by | id | Tidak — FK |
| created_at | id | Tidak — milik entitas |

**Kesimpulan:** Tabel `ahp_comparisons` **memenuhi aturan dependensi 3NF untuk kolom relasionalnya** — tidak ada atribut non-key yang bergantung pada atribut non-key lain.

#### 5.5.7 Pemeriksaan Tabel `users`, `academic_periods`, `classes`, `criteria`, `audit_logs`

Semua tabel yang memiliki primary key tunggal (UUID) — `users`, `academic_periods`, `classes`, `criteria`, `audit_logs` — telah diperiksa dan **memenuhi aturan dependensi 3NF** karena tidak ditemukan transitive dependency. Observasi ini mengonfirmasi bahwa meskipun PK tunggal tidak otomatis menjamin bebas transitive dependency, dalam desain spesifik ini tidak ada atribut non-key yang bergantung pada atribut non-key lain. Perlu dicatat bahwa `audit_logs` memiliki kolom `details` (JSONB) yang merupakan pengecualian terhadap 1NF secara ketat, meskipun untuk tujuan pemeriksaan transitive dependency, kolom tersebut dianggap milik entitas ini dan tidak menimbulkan masalah 3NF.

**Kesimpulan:** Semua tabel memenuhi aturan dependensi 3NF untuk kolom relasionalnya ✓

### 5.6 Ringkasan Normalisasi

| Tahap | Status | Keterangan |
|-------|--------|------------|
|| **1NF** | ✓ (dengan pengecualian terdokumentasi) | Tabel relasional utama (`users`, `academic_periods`, `classes`, `students`, `criteria`, `ahp_comparisons`, `scores`) semuanya memiliki kolom atomik dan primary key unik, memenuhi 1NF secara ketat. Tabel `ahp_calculations` (kolom `weight_vector`) dan `topsis_calculations` (9 kolom JSONB snapshot) serta `audit_logs` (kolom `details`) tidak memenuhi 1NF secara ketat karena menggunakan JSONB yang bukan atomik secara tradisional. Pengecualian ini disengaja dan terdokumentasi: JSONB digunakan semata-mata untuk menyimpan snapshot hasil perhitungan dan payload audit yang bersifat semi-structured, bukan sebagai pengganti relasi utama atau untuk data yang memerlukan FK/constraint. |
| **2NF** | ✓ | Tidak ada partial dependency. Tabel dengan primary key tunggal otomatis memenuhi. Tabel dengan composite key (`scores`, `ahp_comparisons`) tidak memiliki partial dependency. |
|| **3NF** | ✓ (untuk kolom relasional) | Tidak ada transitive dependency pada tabel relasional utama. Nama kelas, nama siswa, nama kriteria tidak disimpan redundan di tabel lain. Catatan: tabel dengan JSONB (`ahp_calculations`, `topsis_calculations`, `audit_logs`) memenuhi aturan dependensi 3NF untuk kolom relasionalnya, tetapi merupakan pengecualian terhadap 1NF secara ketat karena JSONB bukan atomik secara tradisional (lihat 5.3.7, 5.3.9, 5.3.10 dan 5.2 untuk dokumentasi pengecualian). |

### 5.7 Alasan Struktur Dinamis

Desain basis data ini sengaja tidak men-hardcode jumlah kriteria ke dalam skema. Alasannya:

#### 5.7.1 Kriteria sebagai Tabel, Bukan Kolom

Kriteria disimpan sebagai baris di tabel `criteria`, bukan sebagai kolom fixed seperti `nilai_pengetahuan`, `nilai_prakerin`, dst.

**Mengapa?**
- Jika kriteria berubah (ditambah atau dikurangi), tidak perlu migrasi database
- Sistem dapat menangani N kriteria dengan N berbeda-beda
- Kriteria dapat di-nonaktifkan tanpa menghapus data yang sudah ada
- Perhitungan AHP dan TOPSIS dapat beradaptasi otomatis

#### 5.7.2 Nilai Siswa sebagai Baris, Bukan Kolom

Nilai siswa disimpan dalam tabel `scores` sebagai baris per kriteria (bukan kolom per kriteria dalam tabel `students`).

**Mengapa?**
- Jika jumlah kriteria berubah, skema tabel `scores` tidak perlu berubah
- Siswa dengan missing value tetap tercatat dengan status `is_missing = true`
- Validasi constraint yang tepat dapat diterapkan
- Query untuk mengambil nilai siswa untuk kriteria tertentu lebih efisien dengan indexed FK

#### 5.7.3 Relasi Kelas dan Periode Akademik

`'students'` hanya memiliki `'class_id'`. Periode akademik seorang siswa diturunkan melalui relasi ke tabel `classes`:

```
students.class_id → classes.id → classes.academic_period_id
```

Desain ini sengaja menghindari penyimpanan `academic_period_id` secara redundan di tabel `students`, karena:

- Nama/ID periode untuk siswa adalah transitive dependency: periode bergantung pada `class_id`, bukan pada `student_id` secara langsung.
- Dengan hanya menyimpan `class_id` (FK ke `classes`), siswa terdaftar dalam konteks periode tertentu tanpa duplikasi informasi.
- Siswa bisa pindah kelas atau tidak aktif di periode berikutnya (dengan mencatat status `is_active`), dan periode akademik akan berubah mengikuti `classes.academic_period_id`.
- Isolasi data per kelas per periode menjamin keamanan data saat GURU hanya melihat kelasnya sendiri.

Namun, perlu dicatat bahwa meskipun periode akademik siswa diturunkan melalui `classes.academic_period_id`, tabel `scores` tetap memiliki `academic_period_id` eksplisit (lihat 4.2.8 dan 5.5.5) untuk menjaga konteks historis nilai per periode. Ini penting untuk kasus perpindahan kelas antar-periode dan remedial/penilaian khusus, di mana nilai yang dimasukkan perlu dikaitkan dengan periode asli pencatatan, tidak bergantung pada `class_id` siswa pada saat query.

#### 5.7.4 JSONB untuk Data Perhitungan

JSONB digunakan di `ahp_calculations.weight_vector` dan seluruh kolom JSONB di `topsis_calculations` karena:
- Jumlah kriteria (N) dan siswa (M) bersifat dinamis
- Menyimpan seluruh snapshot perhitungan dalam satu baris yang koheren
- Memudahkan reproducibility: pengembang dapat memeriksa hasil perhitungan tanpa perlu query kompleks ke banyak tabel

**Catatan:** JSONB bukan pemenuhan 1NF secara ketat karena bukan tipe atomik (JSONB adalah objek/struktur, bukan nilai tunggal yang tidak dapat diuraikan). JSONB digunakan sebagai pengecualian praktis untuk menyimpan snapshot hasil perhitungan yang bersifat semi-structured — bukan sebagai pengganti relasi utama atau untuk data yang membutuhkan FK/constraint. Tabel relasional utama tetap memenuhi 1NF secara ketat.

### 5.8 Catatan Tambahan

1. **Soft delete:** Tidak semua tabel memerlukan soft delete. Untuk tabel yang memerlukan riwayat (scores, kriteria), pertimbangkan kolom `deleted_at` atau status `is_active`. Saat ini, `is_active` digunakan untuk kriteria dan siswa.

2. **Indeks:** Untuk performa query, rekomendasikan indeks pada:
   - FK columns (class_id, student_id, criteria_id, academic_period_id, dll.)
   - Kolom yang sering digunakan dalam pencarian dan filter (email, name, is_active, dll.)
   - JSONB columns jika perlu query ke dalam isinya (menggunakan GIN index)

3. **Migrasi:** Jika struktur JSONB ternyata kurang efisien untuk query tertentu di masa depan, dapat mempertimbangkan untuk memecahnya menjadi tabel-tabel terpisah dengan normalisasi lebih tinggi.

---

*Dokumen ini merupakan Bagian 5 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md.*
