# Redesign Input Tanggal Laporan

## Tujuan

Mengganti tampilan input tanggal bawaan browser agar menyatu dengan kartu
laporan, tanpa mengubah cara pengguna memilih tanggal atau format data yang
dipakai ekspor Word dan Excel.

## Desain

- Tetap gunakan elemen `input type="date"` sebagai sumber data dan pemilih
  tanggal bawaan perangkat.
- Bungkus input dengan komponen visual `date-input` yang mempunyai garis
  lembut, sudut membulat, dan latar putih seperti pilihan jenis laporan.
- Tampilkan ikon kalender pada area tombol berwarna hijau muda di sisi kanan.
- Beri keadaan hover, fokus keyboard, dan nonaktif yang konsisten dengan
  kontrol lain.
- Terapkan kelas pada template blok laporan, sehingga setiap laporan tanggal
  memiliki tampilan yang sama.

## Batasan dan kompatibilitas

Perubahan hanya pada markup dan CSS. Atribut `data-report-date`, nilai ISO
tanggal, event `change`, serta kalender asli browser dipertahankan agar
pengelolaan blok laporan dan ekspor tetap berfungsi di desktop maupun ponsel.

## Verifikasi

- Tes regresi memastikan pengikat tanggal masih menemukan elemen
  `data-report-date`.
- Build produksi harus berhasil.
- Pratinjau browser memastikan input tidak lagi tampak seperti field default.
