import { normalizeColumnCount, normalizeReportType } from "./report-utils.js";

export function moveItem(items, id, offset) {
  const from = items.findIndex((item) => item.id === id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= items.length) return [...items];

  const nextItems = [...items];
  [nextItems[from], nextItems[to]] = [nextItems[to], nextItems[from]];
  return nextItems;
}

export function removeItemById(items, id) {
  return items.filter((item) => item.id !== id);
}

export function canExport({ date, images, columns, reportType, busy }) {
  const hasSupportedColumns = normalizeColumnCount(columns) === Number(columns);
  const hasSupportedReportType = normalizeReportType(reportType) === reportType;
  return Boolean(
    date && images.length > 0 && hasSupportedColumns && hasSupportedReportType && !busy,
  );
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `block-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function createBlock(overrides = {}) {
  return {
    id: overrides.id || createId(),
    reportType: overrides.reportType || "waste",
    date: overrides.date || "",
    images: overrides.images ? [...overrides.images] : [],
  };
}

export function addBlock(blocks, block) {
  return [...blocks, block];
}

export function removeBlock(blocks, id) {
  return blocks.filter((block) => block.id !== id);
}

export function updateBlock(blocks, id, patch) {
  return blocks.map((block) => (block.id === id ? { ...block, ...patch } : block));
}

export function canExportBlock(block) {
  return Boolean(
    block &&
      block.date &&
      Array.isArray(block.images) &&
      block.images.length > 0 &&
      normalizeReportType(block.reportType) === block.reportType,
  );
}

export function canExportAll({ blocks, columns, busy }) {
  const hasSupportedColumns = normalizeColumnCount(columns) === Number(columns);
  return Boolean(
    !busy &&
      hasSupportedColumns &&
      Array.isArray(blocks) &&
      blocks.length > 0 &&
      blocks.every(canExportBlock),
  );
}

