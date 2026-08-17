# Report Type Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan tiga pilihan jenis laporan yang mengendalikan judul pratinjau/dokumen dan nama file Word/Excel.

**Architecture:** `src/report-utils.js` menjadi satu sumber kebenaran untuk katalog jenis laporan, normalisasi, format judul, dan slug filename. UI menyimpan nilai `reportType` yang terkontrol lalu meneruskannya ke kedua exporter; exporter tidak mengambil label mentah dari DOM.

**Tech Stack:** Vite 7, JavaScript ES modules, Vitest 3, docx 9, ExcelJS 4, JSZip 3.

## Global Constraints

- Pilihan tepat tiga: `Laporan Sampah`, `Laporan Barang Datang`, dan `Laporan Masakan Jadi`.
- Default dan fallback adalah `Laporan Sampah` (`waste`).
- Judul memakai format `{Label jenis laporan} — {hari, tanggal bulan tahun}`.
- Filename memakai format `{slug-jenis-laporan}-{YYYY-MM-DD}.{ext}`.
- Tanggal filename mengikuti tanggal laporan yang dipilih; nilai awal tanggal adalah tanggal lokal hari ini.
- Output tetap A4 portrait dan pilihan grid tetap 2, 3, atau 4 kolom.
- Foto tetap hanya berada di memori browser dan hilang setelah refresh.

---

### Task 1: Katalog, Judul, dan Filename Jenis Laporan

**Files:**
- Modify: `src/report-utils.js`
- Test: `src/report-utils.test.js`

**Interfaces:**
- Produces: `REPORT_TYPES: Readonly<Record<string, {label: string, slug: string}>>`
- Produces: `normalizeReportType(value: unknown): "waste" | "incoming-goods" | "cooked-food"`
- Produces: `getReportType(value: unknown): {label: string, slug: string}`
- Produces: `formatReportTitle(reportType: unknown, isoDate: string): string`
- Changes: `createReportFilename(reportType: unknown, isoDate: string, extension: string): string`

- [ ] **Step 1: Tulis failing tests untuk katalog, normalisasi, judul, dan filename**

Tambahkan import dan assertions berikut ke `src/report-utils.test.js`:

```js
import {
  createReportFilename,
  formatReportTitle,
  getReportType,
  normalizeReportType,
} from "./report-utils.js";

it.each([
  ["waste", "Laporan Sampah", "laporan-sampah"],
  ["incoming-goods", "Laporan Barang Datang", "laporan-barang-datang"],
  ["cooked-food", "Laporan Masakan Jadi", "laporan-masakan-jadi"],
])("mengenali jenis laporan %s", (value, label, slug) => {
  expect(normalizeReportType(value)).toBe(value);
  expect(getReportType(value)).toEqual({ label, slug });
});

it.each([undefined, "", "other"])("mengembalikan %s ke laporan sampah", (value) => {
  expect(normalizeReportType(value)).toBe("waste");
});

it("membentuk judul lengkap sesuai jenis dan tanggal", () => {
  expect(formatReportTitle("incoming-goods", "2026-08-18")).toBe(
    "Laporan Barang Datang — Selasa, 18 Agustus 2026",
  );
});

it("membuat filename sesuai jenis laporan", () => {
  expect(createReportFilename("cooked-food", "2026-08-18", ".DOCX")).toBe(
    "laporan-masakan-jadi-2026-08-18.docx",
  );
});
```

Perbarui test filename lama agar memakai signature tiga argumen.

- [ ] **Step 2: Jalankan test dan pastikan RED**

Run: `npx vitest run src/report-utils.test.js`

Expected: FAIL karena export `formatReportTitle`, `getReportType`, dan `normalizeReportType` belum tersedia serta signature filename belum mendukung jenis laporan.

- [ ] **Step 3: Implementasikan katalog dan utilitas minimal**

Tambahkan ke `src/report-utils.js`:

```js
export const REPORT_TYPES = Object.freeze({
  waste: Object.freeze({ label: "Laporan Sampah", slug: "laporan-sampah" }),
  "incoming-goods": Object.freeze({
    label: "Laporan Barang Datang",
    slug: "laporan-barang-datang",
  }),
  "cooked-food": Object.freeze({
    label: "Laporan Masakan Jadi",
    slug: "laporan-masakan-jadi",
  }),
});

export function normalizeReportType(value) {
  return Object.hasOwn(REPORT_TYPES, value) ? value : "waste";
}

export function getReportType(value) {
  return REPORT_TYPES[normalizeReportType(value)];
}

export function formatReportTitle(reportType, isoDate) {
  return `${getReportType(reportType).label} — ${formatIndonesianDate(isoDate)}`;
}

export function createReportFilename(reportType, isoDate, extension) {
  const cleanExtension = String(extension).replace(/^\./, "").toLowerCase();
  return `${getReportType(reportType).slug}-${isoDate}.${cleanExtension}`;
}
```

Hapus implementasi dua-argumen `createReportFilename` yang lama.

- [ ] **Step 4: Jalankan unit test dan pastikan GREEN**

Run: `npx vitest run src/report-utils.test.js`

Expected: seluruh test `report-utils` PASS.

- [ ] **Step 5: Commit task utilitas**

```bash
git add src/report-utils.js src/report-utils.test.js
git commit -m "feat: add report type catalog and naming"
```

---

### Task 2: State dan Pilihan Jenis Laporan di UI

**Files:**
- Modify: `src/report-state.js`
- Modify: `src/report-state.test.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `normalizeReportType`, `formatReportTitle`, dan `REPORT_TYPES` dari Task 1.
- Changes: `canExport({date, images, columns, reportType, busy}): boolean` mewajibkan jenis laporan yang didukung.
- Produces: DOM select `#report-type` dan state `reportType`.

- [ ] **Step 1: Tulis failing state tests**

Perbarui seluruh pemanggilan `canExport` di `src/report-state.test.js` dengan `reportType: "waste"`, lalu tambahkan:

```js
it.each(["waste", "incoming-goods", "cooked-food"])(
  "mengizinkan ekspor untuk jenis %s",
  (reportType) => {
    expect(
      canExport({
        date: "2026-08-18",
        images: photos,
        columns: 4,
        reportType,
        busy: false,
      }),
    ).toBe(true);
  },
);

it.each([undefined, "", "other"])("menolak jenis laporan mentah %s", (reportType) => {
  expect(
    canExport({
      date: "2026-08-18",
      images: photos,
      columns: 4,
      reportType,
      busy: false,
    }),
  ).toBe(false);
});
```

- [ ] **Step 2: Jalankan state test dan pastikan RED**

Run: `npx vitest run src/report-state.test.js`

Expected: FAIL karena `canExport` belum memeriksa `reportType`.

- [ ] **Step 3: Validasi report type dalam state**

Ubah import dan fungsi di `src/report-state.js`:

```js
import { normalizeColumnCount, normalizeReportType } from "./report-utils.js";

export function canExport({ date, images, columns, reportType, busy }) {
  const hasSupportedColumns = normalizeColumnCount(columns) === Number(columns);
  const hasSupportedReportType = normalizeReportType(reportType) === reportType;
  return Boolean(
    date && images.length > 0 && hasSupportedColumns && hasSupportedReportType && !busy
  );
}
```

- [ ] **Step 4: Jalankan state test dan pastikan GREEN**

Run: `npx vitest run src/report-state.test.js`

Expected: seluruh test `report-state` PASS.

- [ ] **Step 5: Tambahkan select jenis laporan ke HTML**

Di `index.html`, sebelum input tanggal, tambahkan:

```html
<label class="report-type-field" for="report-type">
  <span>Jenis laporan</span>
  <select id="report-type" name="report-type">
    <option value="waste" selected>Laporan Sampah</option>
    <option value="incoming-goods">Laporan Barang Datang</option>
    <option value="cooked-food">Laporan Masakan Jadi</option>
  </select>
</label>
```

Ubah teks `Unggah foto sampah` menjadi `Unggah foto laporan` dan aria-label tabel menjadi `Pratinjau tabel laporan`.

- [ ] **Step 6: Hubungkan state, preview, dan exporter**

Di `src/main.js`:

```js
import {
  formatReportTitle,
  groupIntoRows,
  normalizeColumnCount,
  normalizeReportType,
} from "./report-utils.js";

// elements
reportType: document.querySelector("#report-type"),

// state
reportType: "waste",

// setBusy
elements.reportType.disabled = busy;

// renderPreview
elements.reportTitleCell.textContent = formatReportTitle(state.reportType, state.date);

// export payload
const report = {
  date: state.date,
  images: state.images,
  columns: state.columns,
  reportType: state.reportType,
};

// initialization and event
elements.reportType.value = state.reportType;
elements.reportType.addEventListener("change", (event) => {
  state.reportType = normalizeReportType(event.currentTarget.value);
  event.currentTarget.value = state.reportType;
  render();
  setStatus("Jenis laporan diperbarui.", "success");
});
```

Ubah alt preview dari `Foto sampah` menjadi `Foto laporan`.

- [ ] **Step 7: Selaraskan style select**

Di `src/styles.css`, masukkan `#report-type` ke selector yang saat ini mengatur `#report-date` dan `#column-count`, lalu beri `.report-type-field` spacing yang sama dengan `.column-field`.

- [ ] **Step 8: Jalankan semua unit test**

Run: `npm test`

Expected: seluruh test PASS.

- [ ] **Step 9: Commit task UI/state**

```bash
git add index.html src/main.js src/styles.css src/report-state.js src/report-state.test.js
git commit -m "feat: add report type selector"
```

---

### Task 3: Judul dan Filename Dinamis pada Word/Excel

**Files:**
- Modify: `src/export-word.js`
- Modify: `src/export-excel.js`
- Test: `src/exporters.test.js`

**Interfaces:**
- Consumes: `formatReportTitle(reportType, date)`, `getReportType(reportType)`, dan `createReportFilename(reportType, date, extension)` dari Task 1.
- Changes: `buildWordDocument({date, images, columns, reportType})` memakai judul dinamis.
- Changes: `buildExcelWorkbook({date, images, columns, reportType})` memakai judul dan nama worksheet dinamis.

- [ ] **Step 1: Tulis failing exporter tests untuk ketiga jenis**

Tambahkan `reportType: "waste"` pada fixture `report`, lalu tambahkan:

```js
it.each([
  ["waste", "Laporan Sampah"],
  ["incoming-goods", "Laporan Barang Datang"],
  ["cooked-food", "Laporan Masakan Jadi"],
])("menerapkan judul jenis %s ke Excel", (reportType, label) => {
  const workbook = buildExcelWorkbook({ ...report, reportType });
  const sheet = workbook.getWorksheet(label);
  expect(sheet.getCell("A1").value).toBe(`${label} — Senin, 10 Agustus 2026`);
});

it.each([
  ["incoming-goods", "Laporan Barang Datang"],
  ["cooked-food", "Laporan Masakan Jadi"],
])("menerapkan judul jenis %s ke Word", async (reportType, label) => {
  const buffer = await Packer.toBuffer(buildWordDocument({ ...report, reportType }));
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml").async("string");
  expect(xml).toContain(`${label} — Senin, 10 Agustus 2026`);
});
```

Ubah lookup worksheet test lama dari `"Laporan Sampah"` ke label fixture yang sesuai.

- [ ] **Step 2: Jalankan exporter test dan pastikan RED**

Run: `npx vitest run src/exporters.test.js`

Expected: FAIL karena judul masih hanya tanggal dan worksheet belum mengikuti jenis laporan.

- [ ] **Step 3: Implementasikan Word dinamis**

Di `src/export-word.js`, import `formatReportTitle` dan `getReportType`. Terima `reportType` pada builder, pakai `formatReportTitle(reportType, date)` pada title row dan metadata document, serta panggil:

```js
anchor.download = createReportFilename(report.reportType, report.date, "docx");
```

- [ ] **Step 4: Implementasikan Excel dinamis**

Di `src/export-excel.js`, import `formatReportTitle` dan `getReportType`. Buat worksheet dengan `getReportType(reportType).label`, isi `A1` dengan `formatReportTitle(reportType, date)`, lalu panggil:

```js
anchor.download = createReportFilename(report.reportType, report.date, "xlsx");
```

- [ ] **Step 5: Jalankan exporter test dan pastikan GREEN**

Run: `npx vitest run src/exporters.test.js`

Expected: seluruh test exporter PASS; portrait dan jumlah kolom tetap lulus.

- [ ] **Step 6: Commit task exporter**

```bash
git add src/export-word.js src/export-excel.js src/exporters.test.js
git commit -m "feat: export reports with dynamic titles and filenames"
```

---

### Task 4: Dokumentasi, Browser Verification, dan Paket Hosting

**Files:**
- Modify: `README.md`
- Runtime artifact: `dist/`
- Deliverable: `outputs/tabel-foto-sampah.zip`
- Deliverable: `outputs/preview-tabel-sampah.png`

**Interfaces:**
- Consumes: UI dan exporter dari Task 2-3.
- Produces: build hosting dan ZIP yang memuat source serta `dist/` terbaru.

- [ ] **Step 1: Perbarui README**

Dokumentasikan tiga pilihan, contoh judul, dan pola filename berikut:

```text
Laporan Barang Datang — Selasa, 18 Agustus 2026
laporan-barang-datang-2026-08-18.docx
laporan-barang-datang-2026-08-18.xlsx
```

Pertahankan instruksi bahwa foto tidak dikirim ke server dan hilang saat refresh.

- [ ] **Step 2: Jalankan verifikasi penuh**

Run: `npm test`

Expected: seluruh test PASS tanpa failure.

Run: `npm run build`

Expected: Vite selesai dengan exit code 0 dan menghasilkan `dist/index.html`.

- [ ] **Step 3: Verifikasi browser untuk ketiga pilihan**

Untuk masing-masing `waste`, `incoming-goods`, dan `cooked-food`:

1. Pilih jenis laporan di `#report-type`.
2. Pastikan `#report-title-cell` berisi label dan tanggal lengkap.
3. Upload satu gambar.
4. Unduh Word dan Excel.
5. Pastikan filename memakai slug jenis dan tanggal pilihan.
6. Buka XML Word serta workbook Excel dan pastikan judul lengkap, gambar tertanam, orientation `portrait`, dan jumlah kolom terpilih tetap benar.

- [ ] **Step 4: Perbarui screenshot dan ZIP**

Salin screenshot browser terbaru ke `outputs/preview-tabel-sampah.png`. Buat ulang ZIP:

```powershell
Compress-Archive -Path '.gitignore','README.md','index.html','package.json','package-lock.json','vite.config.js','src','dist','docs' -DestinationPath 'outputs\tabel-foto-sampah.zip' -CompressionLevel Optimal -Force
```

Pastikan ZIP memuat `dist/index.html`, `src/report-utils.js`, dan kedua exporter.

- [ ] **Step 5: Commit dokumentasi**

```bash
git add README.md
git commit -m "docs: document report type workflow"
```

- [ ] **Step 6: Final verification**

Run: `git status --short`

Expected: tidak ada perubahan tracked yang belum di-commit; artifacts di `outputs/` tetap tersedia untuk pengguna.
