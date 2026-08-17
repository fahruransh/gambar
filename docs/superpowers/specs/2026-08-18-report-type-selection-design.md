# Desain Pilihan Jenis Laporan

## Tujuan

Menambahkan pilihan jenis laporan yang diterapkan secara konsisten pada pratinjau, dokumen Word, workbook Excel, dan nama file unduhan.

## Jenis laporan

Aplikasi menyediakan tiga pilihan tetap:

| Nilai | Label | Slug nama file |
| --- | --- | --- |
| `waste` | Laporan Sampah | `laporan-sampah` |
| `incoming-goods` | Laporan Barang Datang | `laporan-barang-datang` |
| `cooked-food` | Laporan Masakan Jadi | `laporan-masakan-jadi` |

Pilihan default dan fallback untuk nilai yang tidak dikenal adalah `Laporan Sampah`.

## Antarmuka

- Tambahkan pilihan `Jenis laporan` di bagian penyusun laporan, berdekatan dengan tanggal dan jumlah kolom.
- Pilihan jenis laporan tetap dapat diubah sebelum atau sesudah foto dimasukkan.
- Saat pilihan berubah, judul pratinjau diperbarui tanpa menghapus foto, tanggal, atau pilihan jumlah kolom.
- Kontrol jenis laporan dinonaktifkan sementara selama proses ekspor, sama seperti tanggal dan jumlah kolom.

## Judul laporan

Pratinjau, Word, dan Excel memakai format yang sama:

```text
{Label jenis laporan} — {hari, tanggal bulan tahun}
```

Contoh:

```text
Laporan Barang Datang — Selasa, 18 Agustus 2026
```

Tanggal awal adalah tanggal lokal hari ini. Jika pengguna memilih tanggal lain, judul dan nama file mengikuti tanggal yang dipilih.

## Nama file

Nama file memakai slug jenis laporan, tanggal ISO pilihan, dan ekstensi output:

```text
{slug-jenis-laporan}-{YYYY-MM-DD}.{ext}
```

Contoh:

```text
laporan-barang-datang-2026-08-18.docx
laporan-barang-datang-2026-08-18.xlsx
```

Ekstensi dinormalisasi menjadi huruf kecil dan tanpa titik ganda.

## Arsitektur dan alur data

- Katalog jenis laporan dan fungsi normalisasi diletakkan di `src/report-utils.js` agar menjadi satu sumber kebenaran untuk UI dan kedua exporter.
- State aplikasi menambahkan `reportType` dengan nilai default `waste`.
- `src/main.js` meneruskan `reportType` bersama tanggal, gambar, dan jumlah kolom kepada exporter.
- `src/export-word.js` dan `src/export-excel.js` menggunakan utilitas bersama untuk membentuk judul dan filename.
- Tata letak portrait dan pilihan 2/3/4 kolom tidak berubah.
- Foto tetap hanya berada di memori browser dan dibersihkan saat halaman dimuat ulang.

## Penanganan kesalahan

- Nilai jenis laporan kosong atau tidak dikenal dinormalisasi ke `waste`.
- Exporter tidak bergantung pada label mentah dari DOM sehingga nama file tidak dapat menjadi format yang tidak terkendali.
- Persyaratan ekspor tetap sama: tanggal valid, minimal satu gambar, jumlah kolom valid, dan aplikasi tidak sedang sibuk.

## Pengujian

- Unit test katalog, normalisasi jenis laporan, format judul, dan filename untuk ketiga jenis.
- State test memastikan nilai jenis laporan valid diterima dan nilai mentah yang tidak valid memblokir ekspor; UI menormalisasi pilihan sebelum memperbarui state.
- Exporter test memastikan Word dan Excel memakai judul lengkap untuk setiap jenis laporan.
- Browser verification memastikan pilihan UI memperbarui pratinjau dan file Word/Excel yang diunduh memakai slug serta tanggal yang benar.

## Kriteria selesai

- Ketiga pilihan tersedia dan default-nya `Laporan Sampah`.
- Judul pratinjau, Word, dan Excel selalu sama.
- Nama file Word dan Excel mengikuti jenis laporan serta tanggal pilihan.
- Output tetap A4 portrait dengan 2, 3, atau 4 kolom.
- Seluruh tes, build produksi, dan pemeriksaan browser lulus.
