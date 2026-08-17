import { describe, expect, it } from "vitest";
import { canExport, moveItem, removeItemById } from "./report-state.js";

const photos = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

describe("pengelolaan urutan foto", () => {
  it("memindahkan foto tanpa mengubah array asal", () => {
    expect(moveItem(photos, "b", -1).map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(photos.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("mengabaikan perpindahan yang melewati batas", () => {
    expect(moveItem(photos, "a", -1)).toEqual(photos);
    expect(moveItem(photos, "c", 1)).toEqual(photos);
  });

  it("menghapus foto berdasarkan id tanpa mengubah array asal", () => {
    expect(removeItemById(photos, "b").map((item) => item.id)).toEqual(["a", "c"]);
    expect(photos).toHaveLength(3);
  });

  it("hanya mengizinkan ekspor saat tanggal dan foto tersedia", () => {
    expect(canExport({ date: "2026-08-10", images: photos, columns: 4, busy: false })).toBe(
      true,
    );
    expect(canExport({ date: "", images: photos, columns: 4, busy: false })).toBe(false);
    expect(canExport({ date: "2026-08-10", images: [], columns: 4, busy: false })).toBe(
      false,
    );
    expect(canExport({ date: "2026-08-10", images: photos, columns: 4, busy: true })).toBe(
      false,
    );
  });

  it.each([2, 3, 4])("mengizinkan ekspor untuk %s kolom", (columns) => {
    expect(canExport({ date: "2026-08-10", images: photos, columns, busy: false })).toBe(
      true,
    );
  });

  it.each([1, 5, undefined])("menolak ekspor untuk pilihan kolom %s", (columns) => {
    expect(canExport({ date: "2026-08-10", images: photos, columns, busy: false })).toBe(
      false,
    );
  });
});
