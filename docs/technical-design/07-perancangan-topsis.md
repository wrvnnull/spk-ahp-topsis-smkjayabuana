# RANCANGAN SISTEM
## 7. PERANCANGAN METODE TOPSIS

### 7.1 Tujuan TOPSIS dalam Sistem

Technique for Order Preference by Similarity to Ideal Solution (TOPSIS) digunakan dalam sistem ini untuk menghasilkan perangkingan siswa berprestasi berdasarkan kedekatan nilai siswa dengan solusi ideal positif dan kejauhan dari solusi ideal negatif. TOPSIS dipilih karena:

1. **Mampu menangani kriteria benefit dan cost secara simultan** — sesuai dengan karakteristik kriteria dinamis yang mencakup kedua tipe.
2. **Tidak memerlukan iterasi berulang** — perhitungan langsung dan deterministik.
3. **Menghasilkan skor [0, 1] yang mudah diinterpretasi** — semakin mendekati 1, semakin baik performa siswa.
4. **Working dengan bobot AHP** — bobot yang sudah diuji konsistensinya digunakan sebagai masukan.
5. **Skalabel untuk N dan M dinamis** — jumlah kriteria dan siswa tidak di-hard-code.

### 7.2 Input: Matriks Keputusan Dinamis M×N

#### 7.2.1 Definisi

- M = jumlah alternatif (siswa yang memiliki nilai lengkap untuk semua kriteria aktif)
- N = jumlah kriteria aktif
- X_ij = nilai siswa ke-i terhadap kriteria ke-j

Matriks keputusan X berukuran M×N:

```
     | C1    | C2    | ... | CN
-----|-------|-------|-----|-------
S1   | x_11  | x_12  | ... | x_1N
S2   | x_21  | x_22  | ... | x_2N
...  | ...   | ...   | ... | ...
SM   | x_M1  | x_M2  | ... | x_MN
```

#### 7.2.2 Sumber Data

Nilai siswa diambil dari tabel `scores`:

| Kolom | Sumber |
|-------|--------|
| siswa | `scores.student_id` → `students.id` |
| kriteria | `scores.criteria_id` → `criteria.id` |
| nilai | `scores.value` (FLOAT) |
| missing flag | `scores.is_missing` (BOOLEAN) |
| periode | `scores.academic_period_id` |

Kriteria aktif: `criteria.is_active = true` dan `criteria.type` (BENEFIT/COST).

Bobot AHP: diambil dari tabel `ahp_calculations` untuk periode yang bersangkutan (`ahp_calculations.weight_vector`).

#### 7.2.3 Dinamika M dan N

- **M:** Semua siswa di kelas-kelas yang dipilih untuk periode yang bersangkutan, dikurangi siswa dengan missing value (lihat Bagian 7.8).
- **N:** Semua kriteria aktif untuk periode tersebut.
- Tidak ada hard-code untuk M maupun N.
- Nilai M dan N ditentukan saat runtime berdasarkan query database.

### 7.3 Tipe Kriteria: BENEFIT dan COST

Setiap kriteria memiliki tipe:

| Tipe | Definisi | Arah Ideal |
|------|----------|------------|
| BENEFIT | Semakin tinggi nilai, semakin baik | Maksimum |
| COST | Semakin rendah nilai, semakin baik | Minimum |

Nilai tipe kriteria berasal dari database: `criteria.type` ∈ {BENEFIT, COST}.

**Contoh konfigurasi (penelitian):**
- C1: PENGETAHUAN → BENEFIT
- C2: PRAKERIN → BENEFIT
- C3: KETIDAKHADIRAN → COST (semakin sedikit absensi, semakin baik)
- C4: EKSTRAKURIKULER → BENEFIT

Namun sistem **tidak hard-code** ini — pembacaan tipe dilakukan dari database saat runtime.

### 7.4 Normalisasi Vektor (Vector Normalization)

Diberikan matriks keputusan X berukuran M×N.

Untuk setiap kriteria j, hitung norm vektor:

```
||X_j|| = √(Σ(x_ij²) untuk semua i dari 1 sampai M)
```

Normalisasi vektor:

```
r_ij = x_ij / ||X_j||
```

di mana r_ij adalah elemen matriks ternormalisasi R berukuran M×N.

**Catatan:**
- Normalisasi vektor (bukan min-max normalization) digunakan dalam TOPSIS standar.
- Setiap kolom dinormalisasi secara independen.
- Jika ||X_j|| = 0 (semua nilai nol untuk kriteria j), perlu penanganan khusus (lihat Bagian 7.10).

### 7.5 Matriks Ternormalisasi Berbobot

Setelah normalisasi, setiap elemen dinormalisasi:

```
v_ij = r_ij × w_j
```

di mana:
- v_ij = elemen matriks terbobot V berukuran M×N
- r_ij = nilai ternormalisasi (dari langkah 7.4)
- w_j = bobot kriteria ke-j (dari AHP)

Matriks terbobot V:

```
     | v_11  | v_12  | ... | v_1N
-----|-------|-------|-----|-------
S1   | v_11  | v_12  | ... | v_1N
S2   | v_21  | v_22  | ... | v_2N
...  | ...   | ...   | ... | ...
SM   | v_M1  | v_M2  | ... | v_MN
```

### 7.6 Solusi Ideal Positif dan Negatif

#### 7.6.1 Solusi Ideal Positif (A+)

Untuk setiap kriteria j:

```
Jika type[j] = BENEFIT:
  A+_j = max(v_ij) untuk semua i
Jika type[j] = COST:
  A+_j = min(v_ij) untuk semua i
```

Vektor A+ = (A+_1, A+_2, ..., A+_N)

**Penjelasan:**
- BENEFIT: semakin tinggi semakin baik → ambil nilai maksimum
- COST: semakin rendah semakin baik → ambil nilai minimum (karena nilai cost yang lebih kecil adalah lebih baik dalam konteks normalized+weighted)

#### 7.6.2 Solusi Ideal Negatif (A-)

Untuk setiap kriteria j:

```
Jika type[j] = BENEFIT:
  A-_j = min(v_ij) untuk semua i
Jika type[j] = COST:
  A-_j = max(v_ij) untuk semua i
```

Vektor A- = (A-_1, A-_2, ..., A-_N)

**Penjelasan:**
- BENEFIT: solusi terburuk adalah nilai minimum
- COST: solusi terburuk adalah nilai maksimum (karena cost tinggi = buruk)

### 7.7 Jarak Euclidean (D+ dan D-)

Untuk setiap alternatif (siswa) i:

```
D+_i = √(Σ(v_ij - A+_j)² untuk semua j dari 1 sampai N)

D-_i = √(Σ(v_ij - A-_j)² untuk semua j dari 1 sampai N)
```

di mana:
- D+_i = jarak dari solusi ideal positif
- D-_i = jarak dari solusi ideal negatif

Semakin kecil D+_i, semakin dekat siswa ke solusi ideal positif.
Semakin besar D-_i, semakin jauh siswa dari solusi ideal negatif.

### 7.8 Nilai Preferensi (Vi)

Nilai preferensi untuk setiap alternatif:

```
Vi = D-_i / (D+_i + D-_i)
```

di mana:
- Vi ∈ [0, 1] (selalu dalam rentang 0 sampai 1, karena D+, D- ≥ 0)
- Vi mendekati 1: performa sangat baik (dekat solusi ideal, jauh dari solusi terburuk)
- Vi mendekati 0: performa kurang baik (jauh dari ideal, dekat dengan terburuk)

**Indexing note:** Perhatikan bahwa Vi = D-/(D+ + D-). Bukan D+/(D+ + D-).

### 7.9 Ranking

Setelah semua Vi dihitung:

1. Urutkan siswa berdasarkan Vi descending (dari terbesar ke terkecil).
2. Rank 1 = siswa dengan Vi terbesar (siswa berprestasi).
3. Rank M = siswa dengan Vi terkecil.

Jika ada tie (Vi sama), sistem dapat menggunakan kriteria tie-breaker (misalnya: nilai tertinggi pada kriteria tertentu) atau menandai "draw" — ini adalah OPEN QUESTION untuk keputusan akademik.

### 7.10 Penanganan Kasus Khusus

#### 7.10.1 Missing Value

Definisi missing value:
- `is_missing = TRUE` di tabel `scores`
- `value = NULL` (atau tidak ada baris untuk kombinasi tertentu)

Penanganan:
- Siswa dengan minimal satu missing value untuk kriteria aktif **TIDAK** dimasukkan ke dalam matriks keputusan.
- Siswa tersebut ditampilkan terpisah dengan status "Data tidak lengkap" di UI.
- Sistem TIDAK mengubah missing value menjadi 0 secara diam-diam.
- Sistem TIDAK menghapus siswa dari database karena missing value.

**Penundaan keputusan akademik:** Bagaimana sekolah menghadapi siswa dengan missing value (apakah dianggap tidak ikut, diimputasi, atau dikonfirmasi secara manual) adalah OPEN QUESTION yang perlu ditentukan oleh pembimbing/peneliti. Sistem hanya mendeteksi, menandai, dan men-exclude dari perhitungan.

#### 7.10.2 Denominator Nol (D+ + D- = 0)

Jika untuk siswa tertentu, D+_i + D-_i = 0, maka Vi = D-_i / 0 = undefined.

Kapan ini bisa terjadi?
- Jika semua kriteria memiliki nilai yang identik dengan solusi ideal posisitif DAN solusi ideal negatif sekaligus (artinya nilai siswa persis sama dengan semua kriteria ideal dan terburuk sekaligus, yaitu semua v_ij = A+_j = A-_j untuk semua j).
- Ini terjadi jika N=0 atau jika semua nilai siswa identik untuk semua kriteria (matriks tanpa variasi).

**Penanganan:**
```
if (D+_i + D-_i) == 0:
    Vi = 0  # atau NULL, atau notifikasi khusus
    # Log peringatan: siswa dengan tidak ada variasi relatif
```

**Pertimbangan:** Jika semua siswa dalam populasi memiliki Vi yang sama (atau tidak terdefinisi), ranking tidak bermakna. Ini adalah kondisi edge yang jarang terjadi dalam data nyata, tapi perlu ditangani.

#### 7.10.3 M = 0 atau N = 0

- **M = 0:** Tidak ada siswa yang bisa dihitung (semua missing value atau tidak ada siswa). Sistem harus menampilkan pesan "Tidak ada siswa valid untuk perhitungan TOPSIS".
- **N = 0:** Tidak ada kriteria aktif. TOPSIS tidak dapat dijalankan. Sistem harus menampilkan pesan "Tidak ada kriteria aktif untuk perhitungan TOPSIS".
- **M = 1:** Hanya satu siswa. Semua siswa mendapatkan rank 1. Ini valid secara matematis tapi tidak informatif untuk ranking.

#### 7.10.4 Norm Vektor Nol (||X_j|| = 0)

Jika ||X_j|| = 0 untuk kriteria tertentu:
- Semua siswa memiliki nilai nol (atau nilai yang sama dengan nol) untuk kriteria tersebut.
- Normalisasi: r_ij = x_ij / 0 = undefined.

**Penanganan (Kebijakan FINAL):** Sistem mengirimkan notifikasi/peringatan bahwa kriteria tanpa variasi terdeteksi, dan memberikan nilai normalisasi `r_ij = 0` untuk semua baris pada kolom tersebut (artinya kontribusi efektif nol terhadap perbedaan siswa). Pendekatan ini menggabungkan opsi A dan opsi C: tetap ada notifikasi ke admin agar masalah data/konfigurasi dapat ditinjau, sekaligus perhitungan tetap berjalan dengan nilai normalisasi 0 untuk kolom yang tidak memiliki variasi.
```
if ||X_j|| == 0:
    # Kriteria ini tidak memiliki variasi — beri bobot nol atau skip kriteria ini
    # Opsi A: Setiap r_ij = 0 untuk kriteria ini (artinya bobot efektif nol)
    # Opsi B: Skip kriteria ini dalam perhitungan (reduces N secara efektif)
    # Opsi C: Notifikasi error kepada admin
```

**Rekomendasi (Kebijakan FINAL):** Notifikasi dikirim ke admin karena kriteria tanpa variasi dapat mengindikasikan masalah data atau konfigurasi, dan nilai normalisasi `r_ij = 0` digunakan untuk semua elemen di kolom ini sehingga perhitungan tetap berjalan dengan kontribusi efektif nol.

#### 7.10.5 Kriteria dengan variasi nol tapi bobot > 0

Jika kriteria memiliki tipe BENEFIT/COST yang jelas, semua nilai sama (misal semua siswa dapat 80 untuk Pengetahuan), tapi bobot AHP-calculated lebih dari 0:
- Kriteria ini tidak berkontribusi dalam diferensiasi siswa.
- Namun tetap termasuk dalam perhitungan.
- Ini tidak masalah secara matematis (semua siswa dapat kontribusi yang sama dari kriteria ini).

### 7.11 Penyimpanan Hasil dan Snapshot untuk Reproducibility

Hasil perhitungan TOPSIS disimpan di tabel `topsis_calculations`:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | Primary key |
| `academic_period_id` | UUID FK | Periode akademik |
| `ahp_calculation_id` | UUID FK | Reference ke hasil AHP yang digunakan |
| `calculated_at` | TIMESTAMP | Waktu perhitungan |
| `decision_matrix` | JSONB | Snapshot matriks X (M×N) |
| `normalized_matrix` | JSONB | Snapshot matriks R (M×N) setelah normalisasi |
| `weighted_matrix` | JSONB | Snapshot matriks V (M×N) terbobot |
| `ideal_positive` | JSONB | Vektor A+ (N elemen) |
| `ideal_negative` | JSONB | Vektor A- (N elemen) |
| `distance_positive` | JSONB | Vektor D+ (M elemen) |
| `distance_negative` | JSONB | Vektor D- (M elemen) |
| `preference_value` | JSONB | Vektor Vi (M elemen) |
| `rank` | JSONB | `{ "student_code": rank }` |
| `created_by` | UUID FK | User yang melakukan perhitungan |

**Alasan penyimpanan snapshot:**
- Reproducibility: semua matriks yang terlibat dapat diverifikasi ulang.
- Audit trail: siapa, kapan, dengan bobot AHP apa, ranking apa yang dihasilkan.
- Debugging: jika ada pertanyaan tentang hasil ranking, pengembang dapat memeriksa setiap langkah.
- Verifikasi: pengembang dapat memeriksa apakah Vi dihitung dari D+ dan D- yang sesuai.

**Format JSONB untuk matriks:**

```json
{
  "decision_matrix": {
    "siswa_1": {"C1": 85, "C2": 90, "C3": 2, "C4": 1},
    "siswa_2": {"C1": 90, "C2": 85, "C3": 1, "C4": 0},
    ...
  },
  "normalized_matrix": {
    "siswa_1": {"C1": 0.682, "C2": 0.679, "C3": 0.079, "C4": 0.089},
    "siswa_2": {"C1": 0.726, "C2": 0.641, "C3": 0.039, "C4": 0.000},
    ...
  },
  "weighted_matrix": {
    "siswa_1": {"C1": 0.307, "C2": 0.189, "C3": 0.022, "C4": 0.025},
    "siswa_2": {"C1": 0.327, "C2": 0.180, "C3": 0.011, "C4": 0.000},
    ...
  },
  "ideal_positive": {"C1": 0.327, "C2": 0.189, "C3": 0.011, "C4": 0.025},
  "ideal_negative": {"C1": 0.307, "C2": 0.180, "C3": 0.022, "C4": 0.000},
  "distance_positive": {"siswa_1": 0.025, "siswa_2": 0.000},
  "distance_negative": {"siswa_1": 0.048, "siswa_2": 0.048},
  "preference_value": {"siswa_1": 0.658, "siswa_2": 1.000},
  "rank": {"siswa_2": 1, "siswa_1": 2}
}
```

**Catatan format:**
- Kunci untuk siswa menggunakan `student_code` (bukan nama asli untuk keamanan data). Contoh di atas menggunakan placeholder anonim `siswa_1`, `siswa_2` — bukan student_code riil.
- Kunci untuk kriteria menggunakan `code` (C1, C2, dst.) atau `id`.
- Bobot AHP yang digunakan dicatat di `ahp_calculation_id`.

### 7.12 Validasi Input TOPSIS

Sebelum perhitungan dilakukan, sistem harus memvalidasi:

1. **Data siswa lengkap:** Minimal satu siswa dengan nilai lengkap untuk semua kriteria aktif. Jika tidak ada, hentikan dan notifikasi.
2. **Minimal satu kriteria aktif:** Jika tidak ada kriteria aktif, hentikan dan notifikasi.
3. **Bobot AHP tersedia dan valid:** `ahp_calculations.is_valid = true` untuk periode yang dipilih. Jika tidak ada bobot AHP yang valid, TOPSIS tidak dapat dijalankan.
4. **Nilai numerik:** Semua `value` di `scores` adalah numerik (FLOAT). Jika ada nilai non-numerik, hentikan.
5. **Tidak ada nilai negatif:** Kecuali kriteria yang secara definisi memungkinkan nilai negatif (jarang), nilai seharusnya >= 0. Sistem bisa memvalidasi ini.
6. **Range nilai:** Jika ada range yang ditentukan untuk kriteria tertentu (misalnya KETIDAKHADIRAN maksimal 30 hari), validasi apakah nilai di luar range.

### 7.13 Contoh Alur Perhitungan TOPSIS (Pseudocode)

```python
def hitung_topsis(siswa_nilai, kriteria_aktif, bobot_ahp, academic_period_id, created_by):
    """
    Menghitung perangkingan TOPSIS dari data siswa dan kriteria.
    
    Args:
        siswa_nilai: dict {student_code: {criteria_code: value, is_missing: bool, 'is_missing_<code_kriteria>': bool}[]}
                    (diambil dari query ke database scores; value bisa berupa float atau None)
        kriteria_aktif: list berisi dict {code, id, type} untuk kriteria dengan is_active=true
        bobot_ahp: dict {criteria_code: bobot} dari hasil AHP yang valid
        academic_period_id: UUID periode akademik
        created_by: UUID user yang melakukan perhitungan
    
    Returns:
        dict berisi:
            - ranking: [(student_code, rank, nilai_preferensi), ...]
            - snapshot: dict semua matriks untuk reproducibility
            - summary: informasi M, N, jumlah siswa excluded karena missing value
    """
    # 1. Identifikasi N kriteria aktif
    n = len(kriteria_aktif)
    kriteria_codes = [k['code'] for k in kriteria_aktif]
    kriteria_types = {k['code']: k['type'] for k in kriteria_aktif}
    
    if n == 0:
        raise ValueError("Tidak ada kriteria aktif untuk perhitungan TOPSIS")
    
    # 2. Validasi bobot AHP tersedia dan lengkap untuk seluruh kriteria aktif
    if not bobot_ahp or len(bobot_ahp) == 0:
        raise ValueError("Bobot AHP tidak tersedia. Mohon lakukan/konfigurasi perhitungan AHP terlebih dahulu.")
    for code in kriteria_codes:
        if code not in bobot_ahp:
            raise ValueError(f"Missing bobot AHP untuk kriteria '{code}'. Pastikan semua kriteria aktif memiliki bobot.")
    
    # 3. Identifikasi siswa dengan nilai lengkap (M)
    semua_siswa = list(siswa_nilai.keys())
    siswa_valid = []
    siswa_missing = []
    
    for student_code in semua_siswa:
        nilai_siswa = siswa_nilai[student_code]
        
        # Cek missing value untuk kriteria aktif
        missing_for_active = False
        for code in kriteria_codes:
            # Def: missing jika is_missing=true ATAU value=None (tidak pernah masukkan ke perhitungan)
            if code not in nilai_siswa:
                missing_for_active = True
                break
            entry = nilai_siswa[code]
            if isinstance(entry, dict):
                is_missing_flag = entry.get('is_missing', False)
                value = entry.get('value', None)
            else:
                # Format lain: entry langsung adalah value (float/None), is_missing flag terpisah
                value = entry
                is_missing_flag = False
            if is_missing_flag or value is None:
                missing_for_active = True
                break
        
        if missing_for_active:
            siswa_missing.append(student_code)
        else:
            siswa_valid.append(student_code)
    
    m = len(siswa_valid)
    
    if m == 0:
        raise ValueError("Tidak ada siswa dengan nilai lengkap untuk perhitungan TOPSIS")
    
    # 3. Build matriks keputusan X (M × N)
    # Urutan: siswa_valid[i] untuk baris ke-i
    # Kriteria: kriteria_codes[j] untuk kolom ke-j
    X = []
    for i, student_code in enumerate(siswa_valid):
        row = []
        for j, code in enumerate(kriteria_codes):
            value = siswa_nilai[student_code][code]
            row.append(value)
        X.append(row)
    
    # 5. Normalisasi vektor — norm setiap kolom dihitung sekali per kriteria
    # Hitung norm untuk seluruh kolom dulu (bukan di dalam loop i)
    norm_per_kolom = []
    for j in range(n):
        col_values = [X[i][j] for i in range(m)]
        norm_j = math.sqrt(sum(v**2 for v in col_values))
        norm_per_kolom.append(norm_j)
    
    R = []  # Matriks ternormalisasi (M × N)
    for i in range(m):
        row_r = []
        for j in range(n):
            norm_j = norm_per_kolom[j]
            
            if norm_j == 0:
                # Penanganan: kolom dengan semua nilai nol
                # Pilih: bernilai 0 untuk semua elemen di kolom ini
                r_ij = 0.0
            else:
                r_ij = X[i][j] / norm_j
            
            row_r.append(r_ij)
        R.append(row_r)
    
    # 5. Matriks terbobot V = R × W
    V = []
    for i in range(m):
        row_v = []
        for j in range(n):
            w_j = bobot_ahp[kriteria_codes[j]]
            v_ij = R[i][j] * w_j
            row_v.append(v_ij)
        V.append(row_v)
    
    # 6. Solusi ideal positif A+ dan negatif A-
    A_plus = []
    A_minus = []
    for j in range(n):
        col_v = [V[i][j] for i in range(m)]
        if kriteria_types[kriteria_codes[j]] == 'BENEFIT':
            A_plus.append(max(col_v))
            A_minus.append(min(col_v))
        else:  # COST
            A_plus.append(min(col_v))
            A_minus.append(max(col_v))
    
    # 7. Jarak Euclidean D+ dan D-
    D_plus = []
    D_minus = []
    for i in range(m):
        d_plus_sq = sum((V[i][j] - A_plus[j])**2 for j in range(n))
        d_minus_sq = sum((V[i][j] - A_minus[j])**2 for j in range(n))
        d_plus = math.sqrt(d_plus_sq)
        d_minus = math.sqrt(d_minus_sq)
        D_plus.append(d_plus)
        D_minus.append(d_minus)
    
    # 8. Nilai preferensi Vi
    V_values = []
    for i in range(m):
        denominator = D_plus[i] + D_minus[i]
        if denominator == 0:
            # Kasus khusus: tidak ada variasi
            v_i = 0.0  # atau bisa juga None
        else:
            v_i = D_minus[i] / denominator
        V_values.append(v_i)
    
    # 9. Ranking
    # Gabungkan: (student_code, vi)
    ranking_pairs = [(siswa_valid[i], V_values[i]) for i in range(m)]
    # Urutkan descending berdasarkan Vi
    ranking_pairs.sort(key=lambda x: x[1], reverse=True)
    
    # Berikan rank
    rank_dict = {}
    for rank_idx, (student_code, vi) in enumerate(ranking_pairs, start=1):
        rank_dict[student_code] = rank_idx
    
    # 10. Snapshot untuk reproducibility
    snapshot = {
        'decision_matrix': format_matrix(X, siswa_valid, kriteria_codes),
        'normalized_matrix': format_matrix(R, siswa_valid, kriteria_codes),
        'weighted_matrix': format_matrix(V, siswa_valid, kriteria_codes),
        'ideal_positive': {kriteria_codes[j]: A_plus[j] for j in range(n)},
        'ideal_negative': {kriteria_codes[j]: A_minus[j] for j in range(n)},
        'distance_positive': {siswa_valid[i]: D_plus[i] for i in range(m)},
        'distance_negative': {siswa_valid[i]: D_minus[i] for i in range(m)},
        'preference_value': {siswa_valid[i]: V_values[i] for i in range(m)},
        'rank': rank_dict,
    }
    
    # Format ranking result
    ranking_result = []
    for rank_idx, (student_code, vi) in enumerate(ranking_pairs, start=1):
        ranking_result.append({
            'student_code': student_code,
            'rank': rank_idx,
            'nilai_preferensi': vi,
        })
    
    summary = {
        'M': m,
        'N': n,
        'siswa_terlibat': m,
        'siswa_excluded_missing': len(siswa_missing),
        'list_siswa_excluded': siswa_missing,
        'ahp_calculation_id': ...,  # dari parameter (jika ada)
    }
    
    return {
        'ranking': ranking_result,
        'snapshot': snapshot,
        'summary': summary,
    }
```

### 7.14 Contoh Struktur Data untuk Query Database

```sql
-- Mendapatkan nilai siswa untuk periode tertentu
SELECT
    s.student_code,
    c.code AS criteria_code,
    sc.value,
    sc.is_missing,
    c.type AS criteria_type
FROM scores sc
JOIN students s ON sc.student_id = s.id
JOIN criteria c ON sc.criteria_id = c.id
JOIN classes cl ON s.class_id = cl.id
WHERE sc.academic_period_id = ?
  AND c.is_active = true
  AND cl.academic_period_id = ?
ORDER BY s.student_code, c.code;

-- Mendapatkan bobot AHP untuk periode tertentu
SELECT
    ws.key AS criteria_code,
    ws.value AS weight
FROM ahp_calculations ac
CROSS JOIN jsonb_each(ac.weight_vector) AS ws
WHERE ac.academic_period_id = ?
  AND ac.is_valid = true
ORDER BY ac.calculated_at DESC
LIMIT 1;
```

### 7.15 Catatan Penting

1. **TOPSIS dinamis:** Seluruh perhitungan TOPSIS bersifat dinamis berdasarkan M siswa dan N kriteria aktif. Tidak ada hard-code untuk 4 kriteria atau jumlah siswa tertentu.

2. **Tidak ada perubahan missing value menjadi 0:** Missing value diperlakukan sebagai "tidak ada data" dan siswa dengan missing value TIDAK dimasukkan ke dalam perhitungan. Sistem TIDAK mengubahnya menjadi 0.

3. **Konsistensi dengan AHP:** Bobot AHP harus sudah valid (CR ≤ 0.10) sebelum digunakan dalam TOPSIS. Jika tidak ada bobot AHP yang valid untuk periode tersebut, TOPSIS tidak dapat dijalankan.

4. **Reproducibility:** Setiap hasil TOPSIS disimpan lengkap dengan semua matriks dan hasil untuk verifikasi ulang.

5. **Penanganan edge case:** Kasus seperti denominator nol, norm vektor nol, M=0, N=0, dan M=1 ditangani secara eksplisit dengan notifikasi yang tepat.

6. **Isolasi data:** Siswa yang bisa dihitung harus berasal dari kelas-kelas yang relevan dengan periode akademik yang dipilih. GURU hanya bisa mengakses data kelasnya sendiri (lihat Bagian RBAC di rancangan sistem).

7. **Tipe kriteria:** Semua keputusan tentang mana yang BENEFIT dan mana yang COST berasal dari database, bukan hard-code.

8. **Penanganan nilai 0:** Nilai 0 yang diinput benar-benar oleh guru (is_missing = false, value = 0) dianggap sebagai nilai yang valid dan diikutkan dalam perhitungan TOPSIS. Ini berbeda dengan missing value.

---

*Dokumen ini merupakan Bagian 7 dari RANCANGAN_SISTEM.md yang dibuat secara bertahap. Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md.*
