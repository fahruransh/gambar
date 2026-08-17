const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const SUPPORTED_COLUMN_COUNTS = new Set([2, 3, 4]);
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

export function normalizeColumnCount(value) {
  const count = Number(value);
  return SUPPORTED_COLUMN_COUNTS.has(count) ? count : 4;
}

export function parseIsoDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatIndonesianDate(isoDate) {
  const date = parseIsoDate(isoDate);
  if (!date) return "Pilih tanggal laporan";

  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatReportTitle(reportType, isoDate) {
  return `${getReportType(reportType).label} — ${formatIndonesianDate(isoDate)}`;
}

export function groupIntoRows(items, columnCount = 4) {
  if (!Number.isInteger(columnCount) || columnCount < 1) {
    throw new RangeError("Jumlah kolom harus berupa bilangan bulat positif.");
  }

  const rows = [];
  for (let index = 0; index < items.length; index += columnCount) {
    const row = items.slice(index, index + columnCount);
    while (row.length < columnCount) row.push(null);
    rows.push(row);
  }
  return rows;
}

export function createReportFilename(reportType, isoDate, extension) {
  const cleanExtension = String(extension).replace(/^\./, "").toLowerCase();
  return `${getReportType(reportType).slug}-${isoDate}.${cleanExtension}`;
}

export function fitInside(width, height, maxWidth, maxHeight) {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
