import { describe, expect, it } from "vitest";
import { calculateNormalizedDimensions, isSupportedImage } from "./image-utils.js";

describe("penerimaan gambar", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("menerima %s", (type) => {
    expect(isSupportedImage({ type, size: 1024 })).toBe(true);
  });

  it("menolak file yang bukan gambar", () => {
    expect(isSupportedImage({ type: "application/pdf", size: 100 })).toBe(false);
  });

  it("menolak gambar yang lebih besar dari 25 MB", () => {
    expect(isSupportedImage({ type: "image/jpeg", size: 26 * 1024 * 1024 })).toBe(false);
  });

  it("mengecilkan sisi terpanjang ke 1800 piksel", () => {
    expect(calculateNormalizedDimensions(4000, 3000)).toEqual({
      width: 1800,
      height: 1350,
    });
  });

  it("tidak memperbesar gambar kecil", () => {
    expect(calculateNormalizedDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
