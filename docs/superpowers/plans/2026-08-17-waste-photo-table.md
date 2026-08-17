# Waste Photo Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first website that turns a selected date and multiple waste photos into a fixed four-column report downloadable as real Word and Excel files.

**Architecture:** A Vite single-page app keeps the report in browser memory and separates pure layout/date calculations, image normalization, DOM rendering, and the two document exporters. The preview and both exporters consume the same ordered image records so their row grouping and date title remain consistent.

**Tech Stack:** Vite, plain HTML/CSS/JavaScript, Vitest, `docx`, and `exceljs`.

## Global Constraints

- The report grid always has exactly four equal-width columns.
- The date header uses Indonesian day and month names and spans all four columns.
- File selection and drag-and-drop accept multiple JPG/JPEG, PNG, and WebP images.
- Word and Excel downloads contain embedded image data and complete the final row with bordered blank cells.
- No account, server, database, or external photo upload is introduced.
- Editing controls remain accessible by keyboard and are excluded from downloaded reports.

## File Map

- `package.json`: dependencies and build/test commands.
- `index.html`: application shell and semantic controls.
- `src/styles.css`: responsive app and fixed report-grid styling.
- `src/report-utils.js`: date formatting, row grouping, file naming, and image containment calculations.
- `src/report-utils.test.js`: unit coverage for shared deterministic rules.
- `src/image-utils.js`: file validation, browser decoding, orientation handling, and JPEG normalization.
- `src/image-utils.test.js`: supported-file and size validation coverage.
- `src/export-word.js`: fixed-layout `.docx` generation.
- `src/export-excel.js`: fixed-layout `.xlsx` generation.
- `src/exporters.test.js`: structural checks for generated Word/Excel files.
- `src/main.js`: state, DOM rendering, upload flow, ordering, deletion, clearing, and export actions.

---

### Task 1: Scaffold and shared report rules

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/report-utils.js`
- Create: `src/report-utils.test.js`

**Interfaces:**
- Produces: `formatIndonesianDate(isoDate: string): string`
- Produces: `groupIntoRows(items: unknown[], columnCount?: number): unknown[][]`
- Produces: `createReportFilename(isoDate: string, extension: string): string`
- Produces: `fitInside(width: number, height: number, maxWidth: number, maxHeight: number): { width: number, height: number }`

- [ ] **Step 1: Create the package manifest and install dependencies**

```json
{
  "name": "tabel-foto-sampah",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "docx": "^9.5.1",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "vite": "^7.1.2",
    "vitest": "^3.2.4"
  }
}
```

Run: `npm install`
Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 2: Write failing shared-rule tests**

```js
import { describe, expect, it } from "vitest";
import {
  createReportFilename,
  fitInside,
  formatIndonesianDate,
  groupIntoRows,
} from "./report-utils.js";

describe("report rules", () => {
  it("formats an ISO date in Indonesian without a timezone shift", () => {
    expect(formatIndonesianDate("2026-08-10")).toBe("Senin, 10 Agustus 2026");
  });

  it("always pads report rows to four cells", () => {
    expect(groupIntoRows([1, 2, 3, 4, 5])).toEqual([
      [1, 2, 3, 4],
      [5, null, null, null],
    ]);
  });

  it("creates a filesystem-safe dated filename", () => {
    expect(createReportFilename("2026-08-10", "docx")).toBe("laporan-sampah-2026-08-10.docx");
  });

  it("fits an image proportionally inside a cell", () => {
    expect(fitInside(1600, 900, 400, 300)).toEqual({ width: 400, height: 225 });
  });
});
```

- [ ] **Step 3: Run the tests and confirm the module is missing**

Run: `npm test -- src/report-utils.test.js`
Expected: FAIL because `src/report-utils.js` does not exist.

- [ ] **Step 4: Implement the shared rules and minimal HTML shell**

```js
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function parseIsoDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatIndonesianDate(isoDate) {
  const date = parseIsoDate(isoDate);
  return date ? `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "Pilih tanggal laporan";
}

export function groupIntoRows(items, columnCount = 4) {
  const rows = [];
  for (let index = 0; index < items.length; index += columnCount) {
    const row = items.slice(index, index + columnCount);
    while (row.length < columnCount) row.push(null);
    rows.push(row);
  }
  return rows;
}

export function createReportFilename(isoDate, extension) {
  return `laporan-sampah-${isoDate}.${extension.replace(/^\./, "")}`;
}

export function fitInside(width, height, maxWidth, maxHeight) {
  if (width <= 0 || height <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
```

`index.html` must contain labeled `#report-date` and `#photo-input` inputs, a `#drop-zone`, `#photo-list`, `#report-table`, `#download-word`, `#download-excel`, `#clear-report`, and a live `#status-message` region.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/report-utils.test.js`
Expected: all four tests PASS.

```bash
git add package.json package-lock.json index.html src/report-utils.js src/report-utils.test.js
git commit -m "feat: scaffold waste report rules"
```

### Task 2: Image intake and normalization

**Files:**
- Create: `src/image-utils.js`
- Create: `src/image-utils.test.js`

**Interfaces:**
- Produces: `isSupportedImage(file: { type?: string, size?: number }): boolean`
- Produces: `normalizeImageFile(file: File): Promise<{ id: string, name: string, dataUrl: string, bytes: Uint8Array, width: number, height: number }>`
- Consumes: browser `createImageBitmap`, canvas, `crypto.randomUUID`, and `FileReader` APIs.

- [ ] **Step 1: Write failing validation tests**

```js
import { describe, expect, it } from "vitest";
import { isSupportedImage } from "./image-utils.js";

describe("image intake", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(isSupportedImage({ type, size: 1024 })).toBe(true);
  });

  it("rejects non-images and files larger than 25 MB", () => {
    expect(isSupportedImage({ type: "application/pdf", size: 100 })).toBe(false);
    expect(isSupportedImage({ type: "image/jpeg", size: 26 * 1024 * 1024 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- src/image-utils.test.js`
Expected: FAIL because `src/image-utils.js` does not exist.

- [ ] **Step 3: Implement validation and normalization**

```js
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function isSupportedImage(file) {
  return Boolean(file && ACCEPTED_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE);
}

export async function normalizeImageFile(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gambar tidak dapat diproses.")), "image/jpeg", 0.88));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { id: crypto.randomUUID(), name: file.name, dataUrl: URL.createObjectURL(blob), bytes, width, height };
}
```

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/image-utils.test.js`
Expected: all validation cases PASS.

```bash
git add src/image-utils.js src/image-utils.test.js
git commit -m "feat: validate and normalize report photos"
```

### Task 3: Responsive editor and fixed preview

**Files:**
- Create: `src/main.js`
- Create: `src/styles.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: `formatIndonesianDate`, `groupIntoRows`, `isSupportedImage`, and `normalizeImageFile`.
- Produces: ordered in-memory records passed to `downloadWordReport` and `downloadExcelReport`.

- [ ] **Step 1: Implement the report state and rendering contract**

```js
const state = { date: new Date().toLocaleDateString("en-CA"), images: [], busy: false };

function moveImage(id, offset) {
  const from = state.images.findIndex((image) => image.id === id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= state.images.length) return;
  [state.images[from], state.images[to]] = [state.images[to], state.images[from]];
  render();
}

function removeImage(id) {
  const image = state.images.find((item) => item.id === id);
  if (image) URL.revokeObjectURL(image.dataUrl);
  state.images = state.images.filter((item) => item.id !== id);
  render();
}
```

`render()` must update the Indonesian title, photo count, empty state, disabled states, thumbnail list, and preview rows. It must render exactly four `<td>` elements per image row and add `.empty-cell` for padded `null` values.

- [ ] **Step 2: Connect multi-file input and drag-and-drop**

```js
async function addFiles(fileList) {
  const files = [...fileList];
  const valid = files.filter(isSupportedImage);
  const invalidCount = files.length - valid.length;
  setBusy(true, `Memproses ${valid.length} foto…`);
  const results = await Promise.allSettled(valid.map(normalizeImageFile));
  state.images.push(...results.filter((item) => item.status === "fulfilled").map((item) => item.value));
  const failedCount = invalidCount + results.filter((item) => item.status === "rejected").length;
  setBusy(false, failedCount ? `${failedCount} file dilewati.` : `${state.images.length} foto siap.`);
}
```

The drop zone must prevent default drag behavior, display a highlighted state during drag-over, and pass `event.dataTransfer.files` to `addFiles` on drop.

- [ ] **Step 3: Style the application and fixed report table**

Use CSS variables for a dark green/cream palette, a maximum app width of `1180px`, rounded control cards, visible `:focus-visible` outlines, and a paper-like preview. The table uses `table-layout: fixed`, `border-collapse: collapse`, `min-width: 820px`, exactly four `25%` columns, `aspect-ratio: 4 / 5` image cells, and `object-fit: cover`. At widths below `760px`, controls stack while `.table-scroll` scrolls horizontally.

- [ ] **Step 4: Verify editor behavior and commit**

Run: `npm test && npm run build`
Expected: all unit tests PASS and Vite writes a successful production build to `dist/`.

Manual checks:

1. Select five supported photos in one action and confirm rows contain `4 + 1` photos with three bordered blank cells.
2. Move the fifth photo left and confirm the preview order changes.
3. Delete one photo and confirm its object URL is revoked and the count changes.
4. Drop a PDF together with a JPG and confirm the JPG is added while the status reports one skipped file.

```bash
git add index.html src/main.js src/styles.css
git commit -m "feat: add multi-photo report editor"
```

### Task 4: Word and Excel export

**Files:**
- Create: `src/export-word.js`
- Create: `src/export-excel.js`
- Create: `src/exporters.test.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `buildWordDocument({ date: string, images: ImageRecord[] }): Document`
- Produces: `downloadWordReport(report): Promise<void>`
- Produces: `buildExcelWorkbook({ date: string, images: ImageRecord[] }): ExcelJS.Workbook`
- Produces: `downloadExcelReport(report): Promise<void>`
- Consumes: `formatIndonesianDate`, `groupIntoRows`, `fitInside`, and `createReportFilename`.

- [ ] **Step 1: Write failing exporter structure tests**

```js
import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { buildExcelWorkbook } from "./export-excel.js";
import { buildWordDocument } from "./export-word.js";

const JPEG_1PX = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAEf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EB//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EB//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EB//2Q=="), (character) => character.charCodeAt(0));
const report = { date: "2026-08-10", images: [{ id: "1", name: "a.jpg", bytes: JPEG_1PX, width: 1, height: 1 }] };

describe("document exporters", () => {
  it("builds an Excel sheet with four fixed columns and a merged title", () => {
    const workbook = buildExcelWorkbook(report);
    const sheet = workbook.getWorksheet("Laporan Sampah");
    expect(sheet.getColumn(1).width).toBe(sheet.getColumn(4).width);
    expect(sheet.getRow(1).getCell(1).value).toBe("Senin, 10 Agustus 2026");
    expect(sheet.model.merges).toContain("A1:D1");
  });

  it("packs the Word document with embedded media", async () => {
    const buffer = await Packer.toBuffer(buildWordDocument(report));
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Run exporter tests and confirm failure**

Run: `npm test -- src/exporters.test.js`
Expected: FAIL because both exporter modules are missing.

- [ ] **Step 3: Implement the fixed-layout Word document**

Create a landscape A4 `Document` with 720-twip margins. Use a `Table` whose width is 10,240 twips, `layout: TableLayoutType.FIXED`, and four 2,560-twip cells. Create one merged title cell, then one `TableRow` per `groupIntoRows(images)`. Each image cell receives a centered `ImageRun` using `fitInside(image.width, image.height, 210, 250)`, and each missing image receives an empty paragraph. Set row height to 3,900 twips with `HeightRule.EXACT`. Apply single black borders to every side.

- [ ] **Step 4: Implement the fixed-layout Excel workbook**

Create worksheet `Laporan Sampah`, merge `A1:D1`, set all four column widths to `24`, title row height to `28`, and image row heights to `150`. Add every JPEG through `workbook.addImage({ buffer: image.bytes, extension: "jpeg" })`, then anchor it inside its target cell using fractional offsets and `fitInside` dimensions. Apply centered alignment and thin black borders to all cells from row 1 through the final report row. Configure A4 landscape printing, `fitToPage: true`, `fitToWidth: 1`, `fitToHeight: 0`, horizontal centering, and print area `A1:D<lastRow>`.

- [ ] **Step 5: Connect safe browser downloads**

```js
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

`downloadWordReport` packs the document with `Packer.toBlob`. `downloadExcelReport` serializes with `workbook.xlsx.writeBuffer()` and wraps it in the official Excel MIME type. Both use `createReportFilename` and are called by guarded click handlers in `main.js` that disable export controls while work is in progress and preserve state after errors.

- [ ] **Step 6: Run exporter tests, full verification, and commit**

Run: `npm test`
Expected: all shared, validation, and exporter tests PASS.

Run: `npm run build`
Expected: production build succeeds without unresolved imports.

```bash
git add src/export-word.js src/export-excel.js src/exporters.test.js src/main.js
git commit -m "feat: export fixed Word and Excel reports"
```

### Task 5: Final accessibility and artifact verification

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: the completed browser application and its npm commands.
- Produces: documented setup/usage steps and verified distributable output.

- [ ] **Step 1: Add usage documentation**

Document `npm install`, `npm run dev`, `npm test`, and `npm run build`. Explain that photos remain local, report state resets on refresh, and exported files are named `laporan-sampah-YYYY-MM-DD.docx` and `.xlsx`.

- [ ] **Step 2: Verify accessibility and responsive behavior**

Confirm every input has a matching `<label>`, icon buttons have `aria-label`, the live region announces processing/errors, keyboard focus is visible, and the editor works at both 375px and 1280px viewport widths while the report preview retains four columns.

- [ ] **Step 3: Run final automated verification**

Run: `npm test && npm run build`
Expected: all tests PASS and production build succeeds.

Run: `git status --short`
Expected: only intentionally changed final documentation or source files are listed.

- [ ] **Step 4: Commit final polish**

```bash
git add README.md index.html src/styles.css
git commit -m "docs: add waste report usage guide"
```
