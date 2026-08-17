import { describe, expect, it } from "vitest";
import {
  createReportFilename,
  fitInside,
  formatIndonesianDate,
  groupIntoRows,
  normalizeColumnCount,
} from "./report-utils.js";

describe("aturan laporan", () => {
  it("memformat tanggal ISO dalam bahasa Indonesia tanpa pergeseran zona waktu", () => {
    expect(formatIndonesianDate("2026-08-10")).toBe("Senin, 10 Agustus 2026");
  });

  it("melengkapi setiap baris menjadi empat sel", () => {
    expect(groupIntoRows([1, 2, 3, 4, 5])).toEqual([
      [1, 2, 3, 4],
      [5, null, null, null],
    ]);
  });

  it("melengkapi baris sesuai pilihan dua, tiga, atau empat kolom", () => {
    expect(groupIntoRows([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, null],
    ]);
    expect(groupIntoRows([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 2, 3],
      [4, 5, null],
    ]);
    expect(groupIntoRows([1, 2, 3, 4, 5], 4)).toEqual([
      [1, 2, 3, 4],
      [5, null, null, null],
    ]);
  });

  it.each([
    [2, 2],
    ["3", 3],
    [4, 4],
    [1, 4],
    [5, 4],
    [undefined, 4],
  ])("menormalkan nilai %s menjadi %s kolom", (value, expected) => {
    expect(normalizeColumnCount(value)).toBe(expected);
  });

  it("membuat nama file laporan yang aman", () => {
    expect(createReportFilename("2026-08-10", "docx")).toBe(
      "laporan-sampah-2026-08-10.docx",
    );
  });

  it("mengecilkan gambar secara proporsional agar muat di sel", () => {
    expect(fitInside(1600, 900, 400, 300)).toEqual({ width: 400, height: 225 });
  });

  it("menolak tanggal kalender yang tidak valid", () => {
    expect(formatIndonesianDate("2026-02-31")).toBe("Pilih tanggal laporan");
  });
});
