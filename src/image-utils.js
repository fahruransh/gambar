const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1800;

export function isSupportedImage(file) {
  return Boolean(
    file &&
      ACCEPTED_TYPES.has(file.type) &&
      Number.isFinite(file.size) &&
      file.size > 0 &&
      file.size <= MAX_FILE_SIZE,
  );
}

export function calculateNormalizedDimensions(width, height) {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeWithImageElement(file) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close() {},
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function decodeImage(file) {
  if ("createImageBitmap" in globalThis) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  return decodeWithImageElement(file);
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gambar tidak dapat dikonversi."));
      },
      "image/jpeg",
      0.88,
    );
  });
}

export async function normalizeImageFile(file) {
  if (!isSupportedImage(file)) {
    throw new TypeError("Format atau ukuran gambar tidak didukung.");
  }

  const decoded = await decodeImage(file);
  try {
    const { width, height } = calculateNormalizedDimensions(decoded.width, decoded.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Browser tidak mendukung pemrosesan gambar.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, 0, 0, width, height);

    const blob = await canvasToJpeg(canvas);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    return {
      id: crypto.randomUUID(),
      name: file.name,
      dataUrl: URL.createObjectURL(blob),
      bytes,
      width,
      height,
    };
  } finally {
    decoded.close();
  }
}
