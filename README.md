# Tabel Sampah

Website lokal untuk menyusun foto sampah harian ke dalam tabel 2, 3, atau 4 kolom, lalu mengunduh laporan sebagai dokumen Word (`.docx`) atau Excel (`.xlsx`).

## Fitur

- Pilih tanggal laporan dengan judul hari, tanggal, bulan, dan tahun berbahasa Indonesia.
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

1. Pilih tanggal pengambilan foto.
2. Pilih jumlah kolom laporan: 2, 3, atau 4.
3. Klik area unggah atau tarik beberapa gambar ke area tersebut.
4. Gunakan tombol panah pada kartu foto untuk mengubah urutannya.
5. Periksa pratinjau tabel.
6. Klik **Unduh Word** atau **Unduh Excel**.

File akan bernama `laporan-sampah-YYYY-MM-DD.docx` atau `laporan-sampah-YYYY-MM-DD.xlsx`. Foto hanya disimpan sementara di memori browser dan akan hilang saat halaman dimuat ulang.

## Pengujian dan build

```bash
npm test
npm run build
```

Hasil build produksi tersedia di folder `dist/` dan dapat dipasang di layanan hosting statis.
