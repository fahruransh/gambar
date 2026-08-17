import { describe, expect, it } from "vitest";
import {
  addBlock,
  canExport,
  canExportAll,
  canExportBlock,
  createBlock,
  moveItem,
  removeBlock,
  removeItemById,
  updateBlock,
} from "./report-state.js";


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
    expect(
      canExport({
        date: "2026-08-10",
        images: photos,
        columns: 4,
        reportType: "waste",
        busy: false,
      }),
    ).toBe(true);
    expect(
      canExport({
        date: "",
        images: photos,
        columns: 4,
        reportType: "waste",
        busy: false,
      }),
    ).toBe(false);
    expect(
      canExport({
        date: "2026-08-10",
        images: [],
        columns: 4,
        reportType: "waste",
        busy: false,
      }),
    ).toBe(false);
    expect(
      canExport({
        date: "2026-08-10",
        images: photos,
        columns: 4,
        reportType: "waste",
        busy: true,
      }),
    ).toBe(false);
  });

  it.each([2, 3, 4])("mengizinkan ekspor untuk %s kolom", (columns) => {
    expect(
      canExport({
        date: "2026-08-10",
        images: photos,
        columns,
        reportType: "waste",
        busy: false,
      }),
    ).toBe(true);
  });

  it.each([1, 5, undefined])("menolak ekspor untuk pilihan kolom %s", (columns) => {
    expect(
      canExport({
        date: "2026-08-10",
        images: photos,
        columns,
        reportType: "waste",
        busy: false,
      }),
    ).toBe(false);
  });

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

  it.each([undefined, "", "other"])(
    "menolak jenis laporan mentah %s",
    (reportType) => {
      expect(
        canExport({
          date: "2026-08-18",
          images: photos,
          columns: 4,
          reportType,
          busy: false,
        }),
      ).toBe(false);
    },
  );

describe("pengelolaan blok laporan", () => {
  it("membuat blok dengan nilai bawaan dan id unik", () => {
    const block = createBlock();
    expect(block.reportType).toBe("waste");
    expect(block.date).toBe("");
    expect(block.images).toEqual([]);
    expect(typeof block.id).toBe("string");
    expect(block.id.length).toBeGreaterThan(0);
    expect(createBlock().id).not.toBe(block.id);
  });

  it("menerima override saat membuat blok", () => {
    const block = createBlock({
      id: "blok-1",
      reportType: "cooked-food",
      date: "2026-08-18",
      images: photos,
    });
    expect(block.id).toBe("blok-1");
    expect(block.reportType).toBe("cooked-food");
    expect(block.date).toBe("2026-08-18");
    expect(block.images).toEqual(photos);
    expect(block.images).not.toBe(photos);
  });

  it("menambah, memperbarui, dan menghapus blok tanpa mengubah array asal", () => {
    const first = createBlock({ id: "a" });
    const blocks = [first];

    const added = addBlock(blocks, createBlock({ id: "b" }));
    expect(added.map((block) => block.id)).toEqual(["a", "b"]);
    expect(blocks).toHaveLength(1);

    const updated = updateBlock(added, "b", { date: "2026-08-18" });
    expect(updated.find((block) => block.id === "b").date).toBe("2026-08-18");
    expect(added.find((block) => block.id === "b").date).toBe("");

    const removed = removeBlock(updated, "a");
    expect(removed.map((block) => block.id)).toEqual(["b"]);
    expect(updated).toHaveLength(2);
  });

  it("hanya mengizinkan ekspor blok saat tanggal, foto, dan jenis valid", () => {
    expect(
      canExportBlock({ date: "2026-08-18", images: photos, reportType: "waste" }),
    ).toBe(true);
    expect(canExportBlock({ date: "", images: photos, reportType: "waste" })).toBe(
      false,
    );
    expect(
      canExportBlock({ date: "2026-08-18", images: [], reportType: "waste" }),
    ).toBe(false);
    expect(
      canExportBlock({ date: "2026-08-18", images: photos, reportType: "other" }),
    ).toBe(false);
  });

  it("mengizinkan ekspor semua saat setiap blok siap dan kolom valid", () => {
    const blocks = [
      createBlock({ id: "a", date: "2026-08-18", reportType: "waste", images: photos }),
      createBlock({
        id: "b",
        date: "2026-08-19",
        reportType: "incoming-goods",
        images: photos,
      }),
    ];
    expect(canExportAll({ blocks, columns: 4, busy: false })).toBe(true);
  });

  it("menolak ekspor semua saat ada blok belum siap, kolom salah, atau sibuk", () => {
    const ready = createBlock({
      id: "a",
      date: "2026-08-18",
      reportType: "waste",
      images: photos,
    });
    const notReady = createBlock({ id: "b", reportType: "waste", images: photos });

    expect(
      canExportAll({ blocks: [ready, notReady], columns: 4, busy: false }),
    ).toBe(false);
    expect(canExportAll({ blocks: [ready], columns: 5, busy: false })).toBe(false);
    expect(canExportAll({ blocks: [ready], columns: 4, busy: true })).toBe(false);
    expect(canExportAll({ blocks: [], columns: 4, busy: false })).toBe(false);
  });
});

});
