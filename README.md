---

## Arsitektur Teknis

Secara garis besar, sistem ini terdiri dari tiga lapisan utama:

1. **Lapisan Antarmuka Pengguna (Frontend)**
   Dibangun dengan Next.js, React, TypeScript, dan Tailwind CSS. Lapisan ini menyajikan halaman untuk input nilai, manajemen kriteria, papan ranking, dan laporan.

2. **Lapisan Backend (API)**
   Menangani logika bisnis AHP-TOPSIS, pengaturan kriteria, validasi hak akses peran, dan pencatatan jejak auditori. Backend berkomunikasi dengan basis data dan frontend melalui antarmuka HTTP.

3. **Lapisan Basis Data**
   Menggunakan PostgreSQL untuk menyimpan kriteria, matriks perbandingan, nilai siswa, hasil ranking, dan rekaman audit. Data tersimpan secara terstruktur dan dapat dikembalikan melalui proses migrasi jika diperlukan.

Pendekatan tiga lapisan ini dimaksudkan agar tiap bagian dapat dikembangkan, diuji, dan dikelola secara lebih terpisah sesuai kebutuhan sekolah.

### Kerangka Kerja Perangkat Lunak

Sistem ini menggabungkan beberapa komponen teknologi dalam satu paket kerja:

- **Framework Frontend:** Next.js dan React untuk antarmuka yang responsif.
- **Bahasa Pemrograman Standar:** TypeScript untuk konsistensi struktur kode.
- **Gaya Antarmuka:** Tailwind CSS untuk penataan tampilan.
- **Basis Data:** PostgreSQL untuk penyimpanan relasional.
- **ORM/Tool Skema:** Prisma atau pendekatan serupa dapat digunakan untuk pengelolaan skema basis data.

Penggabungan komponen ini dipilih agar sistem mudah dikembangkan lebih lanjut oleh tim teknis yang bertanggung jawab.

---

## Struktur Direktori Aplikasi

Berikut adalah perkiraan susunan direktori yang umum digunakan dalam proyek seperti ini.

```
spk-ahp-topsis-app/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
├── assets/
│   └── logo/
│       └── SMK Jaya Buana Logo.png
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                 # Halaman Next.js
│   ├── components/          # Komponen antarmuka
│   ├── lib/                 # Helper dan utilitas
│   ├── backend/             # API dan logika bisnis backend
│   │   ├── modules/
│   │   │   ├── kriteria/
│   │   │   ├── nilai/
│   │   │   ├── ranking/
│   │   │   └── audit/
│   │   └── main.ts
│   └── styles/              # Gaya tambahan jika diperlukan
└── public/                  # Aset statis yang dapat diakses langsung
```

Struktur ini bersifat moduler. Penambahan fitur atau perubahan peran dapat ditempatkan di dalam modul yang sesuai.

---

## Siklus Pengembangan Berbasis Airtaif

Proyek ini memakai model tahapan berurutan yang lazim disebut model airtaif. Alasannya adalah kebutuhan sistem relatif sudah terurai sejak awal, sehingga alur kerja dapat disusun secara berurutan dan terdokumentasi.

Tahapan umumnya:

1. **Analisis kebutuhan:** Mengumpulkan informasi dari observasi, wawancara, dan studi data yang ada.
2. **Perancangan:** Menyusun arsitektur sistem, skema basis data, alur perhitungan AHP-TOPSIS, serta rancangan antarmuka.
3. **Implementasi:** Membangun prototipe atau aplikasi sesuai rancangan.
4. **Pengujian:** Memastikan fungsi utama bekerja, hasil perhitungan sesuai, dan alur peran berjalan seperti yang diharapkan.
5. **Pemeliharaan:** Memperbaikimasalah, menyesuaikan sistem dengan perubahan kebutuhan, dan melakukan peningkatan berkelanjutan.

Model ini membantu dokumentasi dan pelacakan perubahan selama proses pengembangan berlangsung.

---

## Daftar Tabel dan Daftar Gambar

Daftar berikut memudahkan penelusuran elemen visual dalam dokumentasi proyek ini.

### Daftar Tabel

- Tabel struktur kepemilikan kriteria
- Tabel skala intensitas preferensi AHP
- Tabel matriks perbandingan berpasangan
- Tabel indeks acak RI
- Tabel perbandingan sistem manual dan sistem berbasis website

### Daftar Gambar

- Diagram struktur hierarki AHP
- Diagram alur perhitungan TOPSIS
- Diagram alur hak akses 3-role
- Diagram alur logika algoritma SPK

Gambar-gambar ini dapat dikembangkan lebih lanjut sesuai kebutuhan penyajian di dokumen teknis sekolah.

---

## Daftar Istilah

Berikut adalah kata-kata kunci yang digunakan dalam repositori dan dokumentasinya.

- **Sistem Penunjang Keputusan (SPK):** Sistem yang membantu pengambilan keputusan menggunakan data dan model.
- **Analytical Hierarchy Process (AHP):** Metode menentukan bobot kriteria melalui perbandingan berpasangan.
- **Technique for Order Preference by Similarity to Ideal Solution (TOPSIS):** Metode peringkingan berbasis kedekatan dengan solusi ideal.
- **Kriteria:** Aspek yang dinilai, seperti Pengetahuan, PRAKERIN, Ketidakhadiran, dan Ekstrakurikuler.
- **Alternatif:** Objek yang dinilai, dalam hal ini siswa.
- **Matriks Perbandingan Berpasangan:** Tabel yang diisi untuk menentukan kepentingan relatif antar kriteria.
- **Consistency Ratio (CR):** Besaran yang menunjukkan tingkat konsistensi penilaian AHP.
- **Solusi Ideal Positif / Negatif:** Rujukan batas terbaik dan terburuk dalam TOPSIS.
- **Jejak Audit / Audit Trail:** Catatan aktivitas sistem dalam bentuk terstruktur.
- **RBAC (Role-Based Access Control):** Pengendalian akses berbasis peran pengguna.
- **Basis Data PostgreSQL:** Penyimpanan utama data sistem.
- **Next.js / React / TypeScript / Tailwind:** Komponen teknologi antarmuka dan aplikasi web.
- **Docker Compose:** Alat untuk menjalankan layanan, termasuk basis data, secara terangkum.
- **KOP Surat:** Kepala surat resmi yang dicantumkan dalam laporan cetak.

---

## Lisensi, Penggunaan Data, dan Kontak

Repositori ini dibuat untuk keperluan operasional SMK Jaya Buana Kabupaten Tangerang. Data sekolah tidak dipublikasikan dalam repositori ini demi keamanan informasi.

**Ketentuan data:**

- Repositori ini tidak memuat data siswa nyata.
- Repositori ini tidak memuat dokumen skripsi Bab 1 sampai Bab 5.
- Semua contoh nilai dan nama siswa dalam repositori adalah data dummy.

Untuk informasi lebih lanjut mengenai penerapan sistem di sekolah, hubungi pihak yang bertanggung jawab atas pengembangan aplikasi ini.

### Catatan Pengembang

- Nama proyek: SPK AHP-TOPSIS SMK Jaya Buana
- Lokasi sekolah: SMK Jaya Buana Kabupaten Tangerang
- NPSN sekolah: 60729364
- Alamat sekolah: Jl. Bedeng - Tamiang, Ds. Kemuning, Kecamatan Kresek

---

> **Finalisasi:** Dokumentasi ini disusun dalam Bahasa Indonesia baku dan disesuaikan untuk lingkungan produksi sistem SPK berbasis website.
