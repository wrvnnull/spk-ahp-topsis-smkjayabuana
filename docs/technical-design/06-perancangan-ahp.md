# RANCANGAN SISTEM
## 6. PERANCANGAN METODE AHP

### 6.1 Tujuan AHP dalam Sistem

Analytical Hierarchy Process (AHP) digunakan dalam sistem ini untuk menentukan bobot prioritas dari kriteria penilaian siswa berprestasi secara objektif dan terukur. AHP dipilih karena:

1. **Perbandingan berpasangan (pairwise comparison):** Memungkinkan judgement subjektif diubah menjadi nilai numerik terstruktur.
2. **Uji konsistensi:** Mekanisme CR (Consistency Ratio) memastikan bahwa judgement yang diberikan tidak kontradiktif.
3. **Fleksibel terhadap jumlah kriteria:** Sistem mendukung N kriteria, bukan hanya 4 kriteria tertentu. Jika kriteria ditambah/dikurangi, matriks beradaptasi otomatis.
4. **Dokumentasi keputusan:** Setiap pairwise comparison tercatat dalam database (audit trail).

### 6.2 Input: Matriks Perbandingan Berpasangan Dinamis N×N

#### 6.2.1 Konsep Dasar

Setiap pengguna (SUPER_ADMIN) memberikan judgement tentang tingkat kepentingan relatif antar pasangan kriteria. Untuk N kriteria, matriks perbandingan berukuran N×N.

**Contoh:** Jika ada 3 kriteria (C1, C2, C3), matriksnya:

```
     | C1  | C2  | C3
-----|-----|-----|-----
C1   |  1  | a12 | a13
C2   | a21 |  1  | a23
C3   | a31 | a32 |  1
```

Di mana:
- a_ii = 1 untuk semua i (diagonal)
- a_ij = judgement tentang seberapa penting kriteria i dibanding j
- a_ji = 1/a_ij (reciprocal)

#### 6.2.2 Penyimpanan di Database

Tabel `ahp_comparisons` menyimpan pasangan perbandingan:

| Kolom | Keterangan |
|-------|------------|
| `id` | Primary key |
| `academic_period_id` | Periode akademik |
| `criteria_i_id` | FK ke criteria (kriteria baris) |
| `criteria_j_id` | FK ke criteria (kriteria kolom) |
| `comparison_value` | Nilai a_ij (float > 0) |
| `created_by` | User yang memasukkan |
| `created_at` | Timestamp |

**Constraint:** UNIQUE (academic_period_id, criteria_i_id, criteria_j_id)

**Catatan:** Diagonal (a_ii) tidak disimpan karena selalu 1. Nilai a_ji dihitung sebagai 1/a_ij saat runtime.

#### 6.2.3 Dinamika N

- Sistem membaca semua kriteria aktif dari database (`criteria.is_active = true`)
- Jumlah kriteria = N (bisa berubah sewaktu-waktu)
- Matriks dibangun saat runtime dengan ukuran N×N
- Tidak ada hard-code untuk N tertentu

### 6.3 Skala Saaty untuk Perbandingan Berpasangan

Skala intensitas preferensi Saaty:

| Nilai | Keterangan |
|-------|------------|
| 1 | Kedua elemen sama pentingnya |
| 2 | Sedikit lebih penting (kompromi antara 1 dan 3) |
| 3 | Elemen pertama sedikit lebih penting dari elemen kedua |
| 4 | Sedikit lebih penting (kompromi antara 3 dan 5) |
| 5 | Elemen pertama lebih penting dari elemen kedua |
| 6 | Lebih penting (kompromi antara 5 dan 7) |
| 7 | Elemen pertama sangat lebih penting dari elemen kedua |
| 8 | Sangat lebih penting (kompromi antara 7 dan 9) |
| 9 | Elemen pertama mutlak lebih penting dari elemen kedua |
| > 9 | Tidak direkomendasikan ( overshoot) |

**Aturan penggunaan:**
- Hanya nilai 1–9 yang direkomendasikan
- Nilai reciprocal: jika a_ij = x, maka a_ji = 1/x
- a_ij harus > 0

### 6.4 Normalisasi Matriks

Diberikan matriks perbandingan A berukuran N×N dengan elemen a_ij.

**Langkah normalisasi:**

Untuk setiap kolom j:
```
jumlah_kolom_j = Σ(a_ij) untuk semua i dari 1 sampai N
n_ij = a_ij / jumlah_kolom_j
```

Di mana n_ij adalah elemen matriks ternormalisasi.

**Contoh:** Jika kolom 1 adalah [1, 3, 5], maka:
```
jumlah = 1 + 3 + 5 = 9
n_11 = 1/9 = 0.111
n_21 = 3/9 = 0.333
n_31 = 5/9 = 0.556
```

### 6.5 Perhitungan Vektor Prioritas (Bobot)

Vektor prioritas w berukuran N adalah rata-rata setiap baris dari matriks ternormalisasi:

```
w_i = (Σ n_ij untuk semua j) / N
```

Di mana w_i adalah bobot kriteria ke-i.

**Contoh:**
Jika matriks ternormalisasi adalah:
```
     |  n_11  |  n_12  |  n_13
-----|--------|--------|--------
n_11 |  0.111 |  0.200 |  0.150   → rata-rata = w_1
n_21 |  0.333 |  0.500 |  0.300   → rata-rata = w_2
n_31 |  0.556 |  0.300 |  0.550   → rata-rata = w_3
```

### 6.6 Perhitungan λ_max (Lambda Maksimum)

λ_max adalah eigenvalue approksimasi terbesar dari matriks perbandingan.

**Rumus:**
```
λ_max = (Σ (Σ a_ij × w_j) / w_i) / N
```

Atau secara lebih eksplisit:
```
Untuk setiap baris i:
  Σ_i = Σ(a_ij × w_j) untuk semua j  (ini adalah elemen A×w)

λ_max = (Σ (Σ_i / w_i) untuk semua i) / N
```

**Penjelasan:**
- A × w menghasilkan vektor baru (N×1)
- Membagi setiap elemen hasil dengan w_i yang bersesuaian
- Rata-rata dari hasil ini adalah λ_max

### 6.7 Consistency Index (CI)

Consistency Index mengukur seberapa konsisten judgement yang diberikan.

**Rumus:**
```
CI = (λ_max - N) / (N - 1)
```

Di mana:
- λ_max = lambda maksimum (dari perhitungan sebelumnya)
- N = jumlah kriteria (ukuran matriks)

**Interpretasi:**
- Jika judgement sempurna konsisten: λ_max = N, maka CI = 0
- Semakin besar CI, semakin tidak konsisten judgement

### 6.8 Random Index (RI)

Random Index adalah nilai rata-rata CI dari matriks perbandingan acak (random matrix) dengan ukuran N×N.

**Tabel RI untuk N = 1 sampai 10:**

| N | RI |
|---|-----|
| 1 | 0.00 |
| 2 | 0.00 |
| 3 | 0.58 |
| 4 | 0.90 |
| 5 | 1.12 |
| 6 | 1.24 |
| 7 | 1.32 |
| 8 | 1.41 |
| 9 | 1.45 |
| 10 | 1.49 |

**Catatan:**
- RI bergantung pada N (bukan konstan 0.90 seperti dalam beberapa referensi untuk kasus spesifik N=4)
- RI diambil dari tabel Saaty (1980)
- Untuk N > 10, dapat menggunakan interpolasi linear atau tabel extended

**KODE REFERENSI (Pseudocode):**

```python
RANDOM_INDEX = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
}

def get_random_index(n):
    if n <= 10:
        return RANDOM_INDEX[n]
    else:
        # Interpolasi linear untuk N > 10
        # FL: implementasi interpolasi atau fallback ke tabel extended
        raise ValueError(f"RI untuk N={n} belum tersedia, gunakan interpolasi")
```

### 6.9 Consistency Ratio (CR)

Consistency Ratio adalah rasio antara CI dan RI.

**Rumus:**
```
CR = CI / RI
```

**Validasi:**
- Jika CR ≤ 0.10: judgement dianggap konsisten (diterima)
- Jika CR > 0.10: judgement tidak konsisten (perlu direvisi)

**Catatan:** Threshold 0.10 adalah standar yang umum digunakan dalam literatur AHP (Saaty, 1980).

### 6.10 Penanganan Kasus Khusus

#### 6.10.1 N = 1

Jika hanya ada 1 kriteria:
- Matriks berukuran 1×1: [1]
- Tidak perlu perbandingan berpasangan
- Bobot otomatis = 100% (w_1 = 1.00)
- CR tidak terdefinisi (CI = 0/0)
- **Penanganan:** Sistem harus menampilkan notifikasi "CR tidak dapat dihitung untuk N=1" dan bobot dianggap valid secara default. Konfirmasi admin diperlukan.

#### 6.10.2 N = 2

Jika ada 2 kriteria:
- Matriks 2×2: [[1, a12], [a21, 1]] dengan a21 = 1/a12
- λ_max = 2 (selalu, karena matriks 2×2 selalu konsisten secara matematis)
- CI = (2 - 2) / (2 - 1) = 0
- CR = 0 / RI(2) = 0 / 0 = undefined

**Penanganan:** CR untuk N=2 diperlakukan sebagai 0 karena matriks 2×2 selalu konsisten secara matematis (λ_max = 2, CI = 0) dan RI(2) = 0, sehingga tidak dilakukan pembagian 0/0. Sistem harus menampilkan notifikasi bahwa CR tidak dihitung untuk N=2 (dianggap konsisten sempurna dengan catatan). Bobot tetap dihitung dan dianggap valid. Konfirmasi admin diperlukan.

#### 6.10.3 N ≥ 3

Untuk N ≥ 3, CR dapat dihitung dengan normal:
- RI > 0 untuk N ≥ 3
- CR = CI / RI
- Validasi CR ≤ 0.10 berlaku

### 6.11 Alur Jika Matriks Tidak Konsisten

Jika CR > 0.10:

1. **Notifikasi ke pengguna:** Sistem menampilkan pesan "Matriks perbandingan tidak konsisten. CR = X exceeds threshold 0,10. Mohon tinjau kembali pairwise comparison Anda."

2. **Tidak menyimpan bobot:** Bobot dari perhitungan ini TIDAK disimpan ke `ahp_calculations` dengan status `is_valid = true`.

3. **Kembali ke input:** Pengguna diminta untuk merevisi pairwise comparison.

4. **Audit trail:** Setiap iterasi perbandingan tercatat di `ahp_comparisons` dengan timestamp.

5. **Ulangi:** Pengguna dapat mengubah nilai tertentu dan sistem menghitung ulang CI, CR.

6. **Sampai valid:** Hanya jika CR ≤ 0.10, bobot disimpan dengan `is_valid = true`.

**Flowchart Singkat:**

```
Input Pairwise Comparison → Build Matriks N×N → Normalisasi
    → Hitung Bobot → Hitung λmax → Hitung CI
    → Hitung RI (berdasarkan N) → Hitung CR
    → CR ≤ 0.10?
        → Ya: Simpan ke ahp_calculations, selesai
        → Tidak: Notifikasi, kembali ke input
```

### 6.12 Penyimpanan Hasil untuk Reproducibility

Hasil perhitungan AHP disimpan di tabel `ahp_calculations`:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | Primary key |
| `academic_period_id` | UUID FK | Periode akademik |
| `calculated_at` | TIMESTAMP | Waktu perhitungan |
| `ci` | FLOAT | Consistency Index |
| `cr` | FLOAT | Consistency Ratio |
| `ri` | FLOAT | Random Index yang digunakan |
| `weight_vector` | JSONB | `{ "C1": 0.4, "C2": 0.3, ... }` |
| `is_valid` | BOOLEAN | CR ≤ 0.10? |
| `created_by` | UUID FK | User yang melakukan perhitungan |

**Alasan penyimpanan:**
- Memungkinkan verifikasi ulang hasil perhitungan
- Audit trail lengkap (siapa, kapan, apa yang dihitung)
- Reproducibility: pengembang dapat memeriksa apakah CR memang ≤ 0.10 pada waktu perhitungan
- Bobot dapat digunakan berulang untuk perhitungan TOPSIS

### 6.13 Contoh Alur Perhitungan AHP (Pseudocode)

```python
def hitung_ahp(criteria_active, comparisons, n):
    """
    Menghitung bobot AHP dari matriks perbandingan berpasangan.

    Args:
        criteria_active: list berisi dict {id, code} untuk kriteria aktif (terurut)
        comparisons: dict dengan kunci (criteria_i_id, criteria_j_id) → comparison_value
        n: jumlah kriteria (len(criteria_active))

    Returns:
        weight_vector: dict {criteria_code: bobot}
        ci: Consistency Index
        cr: Consistency Ratio
        ri: Random Index yang digunakan
        is_valid: apakah CR ≤ 0.10
    """
    # 1. Build matriks N×N
    matrix = [[0.0] * n for _ in range(n)]
    
    # Fill diagonal dengan 1
    for i in range(n):
        matrix[i][i] = 1.0
    
    # Fill a_ij dari comparisons
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            key = (criteria_active[i]['id'], criteria_active[j]['id'])
            if key in comparisons:
                matrix[i][j] = comparisons[key]
            else:
                # Hitung reciprocal: a_ji = 1/a_ij
                reverse_key = (criteria_active[j]['id'], criteria_active[i]['id'])
                if reverse_key in comparisons:
                    matrix[i][j] = 1.0 / comparisons[reverse_key]
                else:
                    raise ValueError(f"Missing comparison for ({criteria_active[i]['code']}, {criteria_active[j]['code']})")
    
    # 2. Normalisasi matriks
    normalized = [[0.0] * n for _ in range(n)]
    for j in range(n):
        col_sum = sum(matrix[i][j] for i in range(n))
        for i in range(n):
            normalized[i][j] = matrix[i][j] / col_sum
    
    # 3. Hitung vektor prioritas (bobot)
    weights = []
    for i in range(n):
        avg = sum(normalized[i]) / n
        weights.append(avg)
    
    # 4. Hitung λ_max
    # A × w
    aw = [sum(matrix[i][j] * weights[j] for j in range(n)) for i in range(n)]
    # λ_max = (Σ (aw_i / w_i)) / N
    sum_lambda = sum(aw[i] / weights[i] for i in range(n))
    lambda_max = sum_lambda / n
    
    # 5. Hitung CI
    ci = (lambda_max - n) / (n - 1) if n > 1 else 0
    
    # 6. Pilih RI
    ri = get_random_index(n)
    
    # 7. Hitung CR
    if ri == 0:
        cr = None  # Undefined untuk N=1 atau N=2
    else:
        cr = ci / ri
    
    # 8. Validasi
    if cr is None:
        is_valid = True  # Not defined, tapi dianggap valid dengan notifikasi
    else:
        is_valid = cr <= 0.10
    
    # 9. Buat weight_vector sebagai dict
    weight_vector = {criteria_active[i]['code']: weights[i] for i in range(n)}
    
    return {
        'weight_vector': weight_vector,
        'ci': ci,
        'cr': cr,
        'ri': ri,
        'is_valid': is_valid,
        'lambda_max': lambda_max,
    }
```

### 6.14 Validasi Input

Sebelum perhitungan AHP dilakukan, sistem harus memvalidasi input pairwise comparison:

1. **Nilai harus > 0:** `comparison_value > 0` untuk semua a_ij
2. **Nilai dalam range yang direkomendasikan:** 1 ≤ comparison_value ≤ 9 (atau reciprocalnya)
3. **Reciprocal consistency:** a_ji harus = 1/a_ij (dapat dicek dengan toleransi floating point)
4. **Diagonal = 1:** a_ii harus = 1 untuk semua i
5. **Matriks lengkap:** Semua pasangan (i,j) dengan i≠j harus memiliki nilai

Jika ada pelanggaran, sistem menolak perhitungan dan mengembalikan pesan error yang spesifik.

### 6.15 Catatan Penting

1. **AHP dinamis:** Seluruh perhitungan AHP bersifat dinamis berdasarkan N kriteria aktif dari database. Tidak ada hard-code untuk 4 kriteria tertentu.

2. **RI dinamis:** Random Index dipilih berdasarkan N, bukan menggunakan nilai tetap 0.90. Untuk N=4, RI=0.90; untuk N lain, RI berbeda.

3. **CR threshold:** Hanya perhitungan AHP dengan CR ≤ 0.10 yang dianggap valid dan dapat digunakan untuk perhitungan TOPSIS.

4. **Kasus N < 3:** CR tidak dapat dihitung secara matematis. Sistem menampilkan notifikasi dan meminta konfirmasi admin.

5. **Penyimpanan:** Setiap hasil perhitungan AHP disimpan lengkap dengan ci, cr, ri, dan weight_vector untuk reproducibility.

6. **Konsistensi input:** Sistem harus memvalidasi reciprocal relationship a_ji = 1/a_ij saat membangun matriks dari database.

---

*Dokumen ini merupakan Bagian 6 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md.*
