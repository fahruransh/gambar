import { describe, expect, it } from "vitest";
import {
  createMergedFilename,

  createReportFilename,
  fitInside,
  formatIndonesianDate,
  formatReportTitle,
  getReportType,
  groupIntoRows,
  normalizeColumnCount,
  normalizeReportType,
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

  it.each([
    ["waste", "Laporan Sampah", "laporan-sampah"],
    ["incoming-goods", "Laporan Barang Datang", "laporan-barang-datang"],
    ["cooked-food", "Laporan Masakan Jadi", "laporan-masakan-jadi"],
  ])("mengenali jenis laporan %s", (value, label, slug) => {
    expect(normalizeReportType(value)).toBe(value);
    expect(getReportType(value)).toEqual({ label, slug });
  });

  it.each([undefined, "", "other"])(
    "mengembalikan %s ke laporan sampah",
    (value) => {
      expect(normalizeReportType(value)).toBe("waste");
    },
  );

  it("membentuk judul lengkap sesuai jenis dan tanggal", () => {
    expect(formatReportTitle("incoming-goods", "2026-08-18")).toBe(
      "Laporan Barang Datang — Selasa, 18 Agustus 2026",
    );
  });

  it("membuat nama file sesuai jenis laporan", () => {
    expect(createReportFilename("cooked-food", "2026-08-18", ".DOCX")).toBe(
      "laporan-masakan-jadi-2026-08-18.docx",
    );
  });

  it("membentuk nama file gabungan untuk satu atau beberapa blok", () => {
    // Satu blok = perilaku sama dengan createReportFilename.
    expect(
      createMergedFilename([{ reportType: "waste", date: "2026-08-18" }], "xlsx"),
    ).toBe("laporan-sampah-2026-08-18.xlsx");

    // Beberapa blok = gabungkan slug jenis pertama, jumlah blok, dan tanggal pertama.
    expect(
      createMergedFilename(
        [
          { reportType: "waste", date: "2026-08-18" },
          { reportType: "incoming-goods", date: "2026-08-19" },
        ],
        ".DOCX",
      ),
    ).toBe("laporan-sampah-2-laporan-2026-08-18.docx");
  });

  it("mengecilkan gambar secara proporsional agar muat di sel", () => {
    expect(fitInside(1600, 900, 400, 300)).toEqual({ width: 400, height: 225 });
  });

  it("menolak tanggal kalender yang tidak valid", () => {
    expect(formatIndonesianDate("2026-02-31")).toBe("Pilih tanggal laporan");
  });
});
