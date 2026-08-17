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
