# RANCANGAN SISTEM
## Sistem Penunjang Keputusan Menentukan Siswa Berprestasi Metode AHP-TOPSIS
### SMK Jaya Buana Kabupaten Tangerang

**Proyek:** Tugas Akhir — Teknik Informatika, Universitas Pamulang
**Mahasiswa:** Irvan Fauzi (211011450005)
**Status Dokumen:** Rancangan Sistem — Sprint 1
**Versi:** 1.0 — Initial Architecture

---

## 1. GAMBARAN UMUM

### 1.1 Latar Belakang Singkat

Sistem Penunjang Keputusan (SPK) ini dirancang untuk membantu SMK Jaya Buana dalam menentukan siswa berprestasi secara objektif, terukur, dan dapat diaudit. Sistem mengintegrasikan dua metode multikriteria:

- **AHP (Analytical Hierarchy Process)** — menentukan bobot kriteria melalui perbandingan berpasangan (pairwise comparison) dengan uji konsistensi.
- **TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)** — menghasilkan ranking siswa berdasarkan kedekatan dengan solusi ideal positif.

Sistem dikembangkan sebagai website berbasis teknologi modern dengan memisahkan frontend dan backend secara jelas, serta menggunakan basis data relasional untuk menjamin integritas dan auditability.

### 1.2 Scope Sistem

Sistem mencakup:

- Manajemen pengguna dengan 3 role: SUPER_ADMIN, GURU, KEPALA SEKOLAH
- Manajemen periode akademik, kelas, dan siswa
- Manajemen kriteria dinamis (bukan hard-code untuk 4 kriteria tertentu; dapat menambah/kurangi kriteria)
- Input dan validasi nilai siswa oleh guru wali kelas sesuai isolasi data kelas
- Perhitungan AHP dinamis dengan N kriteria (matriks N×N beradaptasi otomatis)
- Perhitungan TOPSIS dinamis dengan M siswa dan N kriteria (tidak hard-code)
- Dashboard ranking untuk kepala sekolah
- Laporan PDF dengan placeholder KOP surat (logo resmi tidak masuk repository publik)

### 1.3 Prinsip Desain Utama

1. **Dinamis, bukan statis.** Sistem menangani N kriteria, bukan hanya 4. Jika kriteria berubah, Matriks AHP dan perhitungan TOPSIS beradaptasi otomatis.
2. **Data isolation.** GURU hanya melihat data kelas yang menjadi tanggung jawabnya; tidak bisa melihat kelas lain.
3. **Audit trail.** Setiap perubahan tercatat dalam log audit.
4. **Reproducibility.** Hasil perhitungan dapat diverifikasi ulang.
5. **Proteksi data sensitif.** Nama siswa asli, NIS/NISN, dan data pribadi tidak dimasukkan ke repository publik; file Excel asli tidak masuk repo.

### 1.4 Definisi Istilah Kunci

| Istilah | Definisi |
|---------|----------|
| **Alternatif** | Siswa yang dinilai/dirangking dalam TOPSIS |
| **Kriteria** | Aspek penilaian (misal: Pengetahuan, PRAKERIN, Ketidakhadiran, Ekstrakurikuler) |
| **Benefit** | Kriteria di mana nilai lebih tinggi = lebih baik |
| **Cost** | Kriteria di mana nilai lebih rendah = lebih baik |
| **Pairwise Comparison** | Perbandingan berpasangan antar kriteria untuk AHP (skala 1–9) |
| **Consistency Ratio (CR)** | Uji konsistensi hasil AHP; harus ≤ 0.10 |
| **Random Index (RI)** | Nilai referensi untuk menghitung CR; bergantung pada N (jumlah kriteria) |
| **Matriks Keputusan (X)** | Matriks berukuran M×N berisi nilai siswa terhadap kriteria |
| **Normalisasi Vektor** | Proses menyamakan skala nilai dalam TOPSIS |
| **Solusi Ideal Positif (A+)** | Kombinasi terbaik dari seluruh kriteria |
| **Solusi Ideal Negatif (A-)** | Kombinasi terburuk dari seluruh kriteria |
| **Nilai Preferensi (Vi)** | Skor preferensi TOPSIS; range 0–1 |
| **Kriteria Dinamis** | Kriteria yang jumlah dan jenisnya dapat berubah tanpa hard-code |

### 1.5 Status Pengembangan

Saat ini sistem masih dalam tahap rancangan (Sprint 1). Belum ada implementasi frontend/backend yang lengkap. Dokumen ini merupakan rancangan arsitektur, basis data, dan alur perhitungan yang akan menjadi acuan implementasi pada Sprint berikutnya.

---

* Dokumen ini merupakan bagian dari RANCANGAN_SISTEM.md yang dibuat secara bertahap.
* Sumber referensi utama: FINAL_DISCOVERY_AND_ARCHITECTURE_REVIEW.md
