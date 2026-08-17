import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import JSZip from "jszip";
import { buildExcelWorkbook } from "./export-excel.js";
import { buildWordDocument } from "./export-word.js";

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const report = {
  date: "2026-08-10",
  reportType: "waste",
  images: [
    {
      id: "foto-1",
      name: "sampah.jpg",
      bytes: JPEG_BYTES,
      width: 800,
      height: 600,
    },
  ],
};

describe("ekspor dokumen", () => {
  it.each([
    [2, "A1:B1", "A1:B2", 210],
    [3, "A1:C1", "A1:C2", 170],
    [4, "A1:D1", "A1:D2", 150],
  ])(
    "membuat Excel portrait dengan grid %s kolom",
    (columns, titleRange, printArea, rowHeight) => {
      const workbook = buildExcelWorkbook({ ...report, columns });
      const sheet = workbook.getWorksheet("Laporan Sampah");

      expect(sheet.getRow(1).getCell(1).value).toBe(
        "Laporan Sampah — Senin, 10 Agustus 2026",
      );
      expect(sheet.model.merges).toContain(titleRange);
      expect(sheet.getColumn(1).width).toBe(24);
      expect(sheet.getColumn(columns).width).toBe(24);
      expect(sheet.getRow(2).height).toBe(rowHeight);
      expect(sheet.getRow(2).getCell(columns).border.left.style).toBe("thin");
      expect(sheet.getImages()).toHaveLength(1);
      expect(sheet.pageSetup.orientation).toBe("portrait");
      expect(sheet.pageSetup.paperSize).toBe(9);
      expect(sheet.pageSetup.fitToWidth).toBe(1);
      expect(sheet.pageSetup.printArea).toBe(printArea);
    },
  );

  it("mengemas workbook Excel dengan gambar tertanam", async () => {
    const buffer = await buildExcelWorkbook(report).xlsx.writeBuffer();

    expect(buffer.byteLength).toBeGreaterThan(1500);
  });

  it("mengemas Word dengan tabel dan media gambar tertanam", async () => {
    const buffer = await Packer.toBuffer(buildWordDocument(report));

    expect(buffer.byteLength).toBeGreaterThan(1500);
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });

  it.each([
    ["waste", "Laporan Sampah"],
    ["incoming-goods", "Laporan Barang Datang"],
    ["cooked-food", "Laporan Masakan Jadi"],
  ])("menerapkan judul jenis %s ke Excel", (reportType, label) => {
    const workbook = buildExcelWorkbook({ ...report, reportType });
    const sheet = workbook.getWorksheet(label);

    expect(sheet).toBeDefined();
    expect(sheet.getCell("A1").value).toBe(`${label} — Senin, 10 Agustus 2026`);
  });

  it.each([2, 3, 4])(
    "membuat Word portrait dengan grid %s kolom",
    async (columns) => {
      const buffer = await Packer.toBuffer(buildWordDocument({ ...report, columns }));
      const zip = await JSZip.loadAsync(buffer);
      const xml = await zip.file("word/document.xml").async("string");

      expect((xml.match(/<w:gridCol/g) || [])).toHaveLength(columns);
      expect(xml).toContain(`<w:gridSpan w:val="${columns}"/>`);
      expect(xml).toContain('w:orient="portrait"');
      expect(xml).toContain('w:w="10400"');
    },
  );

  it.each([
    ["incoming-goods", "Laporan Barang Datang"],
    ["cooked-food", "Laporan Masakan Jadi"],
  ])("menerapkan judul jenis %s ke Word", async (reportType, label) => {
    const buffer = await Packer.toBuffer(buildWordDocument({ ...report, reportType }));
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml").async("string");

    expect(xml).toContain(`${label} — Senin, 10 Agustus 2026`);
  });
});
