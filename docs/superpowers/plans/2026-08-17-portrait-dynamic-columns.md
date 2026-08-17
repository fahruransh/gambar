# Portrait Dynamic Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared two-, three-, or four-column report setting and make both Word and Excel exports use A4 portrait orientation.

**Architecture:** A shared column normalizer protects the preview and both exporters from invalid values. The existing in-memory state carries the selected count through rendering and export, while Word and Excel calculate their table grids, merges, row heights, and print areas from the same value.

**Tech Stack:** Vite, plain HTML/CSS/JavaScript, Vitest, `docx`, `exceljs`, and `jszip` for structural document tests.

## Global Constraints

- The only supported column counts are 2, 3, and 4; the default and invalid-value fallback are 4.
- Preview, Word, and Excel must always use the same selected column count.
- Word and Excel output must both use A4 portrait orientation.
- Word table width is 10,400 twips with 720-twip page margins.
- Word image-row heights are 4,200 twips for two columns, 3,200 for three, and 2,600 for four.
- Excel active column width is 24 characters; image-row heights are 210 points for two columns, 170 for three, and 150 for four.
- Existing upload formats, limits, photo order, filenames, and local-only processing remain unchanged.

---

### Task 1: Shared column state and dynamic preview

**Files:**
- Modify: `src/report-utils.test.js`
- Modify: `src/report-utils.js`
- Modify: `src/report-state.test.js`
- Modify: `src/report-state.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `normalizeColumnCount(value: unknown): 2 | 3 | 4`
- Consumes: `groupIntoRows(items: unknown[], columnCount: number): unknown[][]`
- Extends report state to `{ date: string, images: ImageRecord[], columns: number, busy: boolean }`.

- [ ] **Step 1: Write failing column-rule tests**

```js
import { normalizeColumnCount } from "./report-utils.js";

it.each([[2, 2], ["3", 3], [4, 4], [1, 4], [5, 4], [undefined, 4]])(
  "normalizes %s to %s columns",
  (value, expected) => expect(normalizeColumnCount(value)).toBe(expected),
);

it("pads rows for the selected column count", () => {
  expect(groupIntoRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5, null]]);
  expect(groupIntoRows([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5, null]]);
  expect(groupIntoRows([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5, null, null, null]]);
});
```

Extend `report-state.test.js` so `canExport` returns false for unsupported `columns` and true for `columns: 2`, `3`, or `4`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/report-utils.test.js src/report-state.test.js`
Expected: FAIL because `normalizeColumnCount` is missing and `canExport` does not validate columns.

- [ ] **Step 3: Implement the minimal shared rules**

```js
const SUPPORTED_COLUMN_COUNTS = new Set([2, 3, 4]);

export function normalizeColumnCount(value) {
  const count = Number(value);
  return SUPPORTED_COLUMN_COUNTS.has(count) ? count : 4;
}
```

Update `canExport` to require `normalizeColumnCount(columns) === Number(columns)` in addition to its existing date, image, and busy checks.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/report-utils.test.js src/report-state.test.js`
Expected: all shared-rule and state tests PASS.

- [ ] **Step 5: Add the selector and dynamic preview**

Add this control below the date input in `index.html`:

```html
<label class="column-field" for="column-count">
  <span>Jumlah kolom</span>
  <select id="column-count" name="column-count">
    <option value="2">2 kolom</option>
    <option value="3">3 kolom</option>
    <option value="4" selected>4 kolom</option>
  </select>
</label>
```

Change the badge to `<span id="column-badge" class="column-badge">4 kolom</span>` and remove the four hard-coded `<col>` elements from the initial `colgroup`, leaving `<colgroup id="report-columns"></colgroup>`.

In `main.js`, initialize `state.columns = 4`, bind `#column-count`, `#column-badge`, and `#report-columns`, and call `groupIntoRows(state.images, state.columns)`. Rebuild the colgroup with exactly `state.columns` `<col>` elements; calculate image numbering with `rowIndex * state.columns`; set `reportTable.dataset.columns`; and pass `columns: state.columns` in the export report.

- [ ] **Step 6: Add adaptive preview styling**

Give `#column-count` the same height, border, background, and focus behavior as `#report-date`. Add `.column-field` spacing and label styles. Replace the single table-cell height with:

```css
#report-table[data-columns="2"] td { height: 360px; }
#report-table[data-columns="3"] td { height: 300px; }
#report-table[data-columns="4"] td { height: 255px; }
```

- [ ] **Step 7: Verify and commit**

Run: `npm test && npm run build`
Expected: all tests PASS and the production build succeeds.

```bash
git add index.html src/main.js src/styles.css src/report-utils.js src/report-utils.test.js src/report-state.js src/report-state.test.js
git commit -m "feat: add dynamic report column selector"
```

### Task 2: Portrait Word export with dynamic table grids

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/exporters.test.js`
- Modify: `src/export-word.js`

**Interfaces:**
- Consumes: `normalizeColumnCount(report.columns): 2 | 3 | 4`
- Produces: `buildWordDocument({ date, images, columns }): Document` with a portrait dynamic-width table.

- [ ] **Step 1: Add `jszip` as a direct test dependency**

Run: `npm install --save-dev jszip@^3.10.1`
Expected: package files list `jszip` under `devDependencies`.

- [ ] **Step 2: Write failing Word structure tests**

```js
import JSZip from "jszip";

it.each([2, 3, 4])("builds a portrait Word table with %s columns", async (columns) => {
  const buffer = await Packer.toBuffer(buildWordDocument({ ...report, columns }));
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml").async("string");
  expect((xml.match(/<w:gridCol/g) || [])).toHaveLength(columns);
  expect(xml).toContain(`<w:gridSpan w:val="${columns}"/>`);
  expect(xml).toContain('w:orient="portrait"');
  expect(xml).toContain('w:w="10400"');
});
```

- [ ] **Step 3: Run the Word test and verify RED**

Run: `npm test -- src/exporters.test.js`
Expected: FAIL because the document remains landscape and always uses four grid columns.

- [ ] **Step 4: Implement portrait dynamic Word layout**

Use `TABLE_WIDTH = 10400` and this configuration:

```js
const WORD_LAYOUTS = {
  2: { rowHeight: 4200, imageWidth: 330, imageHeight: 270 },
  3: { rowHeight: 3200, imageWidth: 220, imageHeight: 210 },
  4: { rowHeight: 2600, imageWidth: 160, imageHeight: 170 },
};
```

Add `createColumnWidths(columns)` that divides 10,400 twips evenly and puts any remainder in the final column. Pass the selected width into `imageCell`, set the heading `columnSpan` to the selected count, call `groupIntoRows(images, columns)`, use the calculated `columnWidths`, and select the matching row/image dimensions. Set the page to `{ width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }` with existing margins.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/exporters.test.js`
Expected: Word structure cases for 2, 3, and 4 columns PASS.

```bash
git add package.json package-lock.json src/exporters.test.js src/export-word.js
git commit -m "feat: export portrait Word reports"
```

### Task 3: Portrait Excel export with dynamic print ranges

**Files:**
- Modify: `src/exporters.test.js`
- Modify: `src/export-excel.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: `normalizeColumnCount(report.columns): 2 | 3 | 4`
- Produces: `buildExcelWorkbook({ date, images, columns }): ExcelJS.Workbook` with a portrait active-column range.

- [ ] **Step 1: Write failing Excel layout tests**

```js
it.each([
  [2, "A1:B1", "A1:B2", 210],
  [3, "A1:C1", "A1:C2", 170],
  [4, "A1:D1", "A1:D2", 150],
])("builds a portrait Excel sheet with %s columns", (columns, merge, printArea, rowHeight) => {
  const sheet = buildExcelWorkbook({ ...report, columns }).getWorksheet("Laporan Sampah");
  expect(sheet.model.merges).toContain(merge);
  expect(sheet.pageSetup.orientation).toBe("portrait");
  expect(sheet.pageSetup.printArea).toBe(printArea);
  expect(sheet.getRow(2).height).toBe(rowHeight);
  expect(sheet.getColumn(columns).width).toBe(24);
  expect(sheet.getCell(`${String.fromCharCode(64 + columns)}2`).border.left.style).toBe("thin");
});
```

- [ ] **Step 2: Run the Excel tests and verify RED**

Run: `npm test -- src/exporters.test.js`
Expected: two- and three-column cases FAIL and orientation is still landscape.

- [ ] **Step 3: Implement portrait dynamic Excel layout**

Replace the fixed count with:

```js
const EXCEL_ROW_HEIGHTS = { 2: 210, 3: 170, 4: 150 };
const columns = normalizeColumnCount(report.columns);
const lastColumn = String.fromCharCode(64 + columns);
```

Loop only through active columns, merge `A1:${lastColumn}1`, call `groupIntoRows(images, columns)`, set row height from `EXCEL_ROW_HEIGHTS`, calculate `CELL_PIXEL_HEIGHT` as `Math.round(rowHeight * 4 / 3)`, apply borders only through the active final column, set `printArea` to `A1:${lastColumn}${lastRow}`, and use `orientation: "portrait"`.

- [ ] **Step 4: Update usage documentation**

Document the 2/3/4 selector and state that both Word and Excel use A4 portrait with equal-width active columns.

- [ ] **Step 5: Run full verification and commit**

Run: `npm test && npm run build`
Expected: all tests PASS and Vite build succeeds.

Run browser verification with one uploaded image for each column choice. For each choice, confirm the preview has the selected number of cells and exported Word/Excel structures use the same count and portrait orientation.

```bash
git add README.md src/exporters.test.js src/export-excel.js
git commit -m "feat: export portrait Excel reports"
```

### Task 4: Refresh delivery package

**Files:**
- Modify: `outputs/tabel-foto-sampah.zip` (ignored delivery artifact)
- Modify: `outputs/preview-tabel-sampah.png` (ignored delivery artifact)

**Interfaces:**
- Consumes: verified source, tests, and `dist/` build.
- Produces: refreshed user-downloadable ZIP and preview image.

- [ ] **Step 1: Run final verification from a clean command**

Run: `npm test && npm run build`
Expected: all tests PASS and the production build succeeds with exit code zero.

- [ ] **Step 2: Refresh the ZIP**

Compress `.gitignore`, `README.md`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `src`, `dist`, and `docs` into `outputs/tabel-foto-sampah.zip`, replacing the previous archive.

- [ ] **Step 3: Inspect delivery contents**

List the ZIP and confirm it contains `src/main.js`, `src/export-word.js`, `src/export-excel.js`, `dist/index.html`, and `README.md`.
