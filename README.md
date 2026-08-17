# Tabel Sampah

Website lokal untuk menyusun foto laporan ke dalam tabel 2, 3, atau 4 kolom, lalu mengunduhnya sebagai dokumen Word (`.docx`) atau Excel (`.xlsx`).

## Fitur

- Pilih tanggal laporan dengan judul hari, tanggal, bulan, dan tahun berbahasa Indonesia.
- Pilih jenis `Laporan Sampah`, `Laporan Barang Datang`, atau `Laporan Masakan Jadi`.
- Unggah banyak foto JPG, PNG, atau WebP sekaligus, termasuk melalui drag-and-drop.
- Atur ulang atau hapus foto sebelum membuat dokumen.
- Pilih jumlah kolom 2, 3, atau 4; pilihan langsung diterapkan ke pratinjau dan hasil unduhan.
- Ekspor Word A4 portrait dengan tabel fixed-width, gambar tertanam, dan baris yang tidak terpecah.
- Ekspor Excel A4 portrait dengan lebar kolom/tinggi baris yang rapi, gambar tertanam, border, dan area cetak dinamis.
- Pemrosesan berlangsung di browser; foto tidak dikirim ke server.

## Menjalankan website

Pastikan Node.js tersedia, lalu jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

## Penggunaan

1. Pilih jenis laporan.
2. Pilih tanggal pengambilan foto.
3. Pilih jumlah kolom laporan: 2, 3, atau 4.
4. Klik area unggah atau tarik beberapa gambar ke area tersebut.
5. Gunakan tombol panah pada kartu foto untuk mengubah urutannya.
6. Periksa pratinjau tabel.
7. Klik **Unduh Word** atau **Unduh Excel**.

Judul mengikuti jenis dan tanggal, misalnya `Laporan Barang Datang — Selasa, 18 Agustus 2026`. Nama file otomatis mengikuti pilihan, misalnya `laporan-barang-datang-2026-08-18.docx` atau `laporan-barang-datang-2026-08-18.xlsx`. Foto hanya disimpan sementara di memori browser dan akan hilang saat halaman dimuat ulang.

## Pengujian dan build

```bash
npm test
npm run build
```

Hasil build produksi tersedia di folder `dist/` dan dapat dipasang di layanan hosting statis.
