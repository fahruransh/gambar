import ExcelJS from "exceljs";
import {
  createMergedFilename,
  fitInside,
  formatReportTitle,
  getReportType,
  groupIntoRows,
  normalizeColumnCount,
} from "./report-utils.js";

const COLUMN_WIDTH = 24;
const CELL_PIXEL_WIDTH = 168;
const IMAGE_MAX_WIDTH = 154;
const EXCEL_ROW_HEIGHTS = { 2: 210, 3: 170, 4: 150 };
const THIN_BORDER = { style: "thin", color: { argb: "FF1F2925" } };
const BLOCK_GAP_ROWS = 1;

function normalizeToBlocks(report) {
  const columns = normalizeColumnCount(report.columns);
  if (Array.isArray(report.blocks)) {
    return { columns, blocks: report.blocks };
  }
  return {
    columns,
    blocks: [
      { date: report.date, images: report.images, reportType: report.reportType },
    ],
  };
}

/**
 * Writes one report block (title row + photo grid) starting at `startRow`.
 * Returns the row number of the block's last row so the caller can track a
 * running offset and insert spacing between blocks.
 */
function writeBlock(
  workbook,
  worksheet,
  block,
  { columns, startRow, rowHeight, cellPixelHeight, lastColumn },
) {
  const titleRow = startRow;
  worksheet.mergeCells(`A${titleRow}:${lastColumn}${titleRow}`);
  const titleCell = worksheet.getCell(`A${titleRow}`);
  titleCell.value = formatReportTitle(block.reportType, block.date);
  titleCell.font = { name: "Arial", size: 13, bold: false, color: { argb: "FF111111" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(titleRow).height = 28;

  const rows = groupIntoRows(block.images, columns);
  rows.forEach((row, rowIndex) => {
    const worksheetRow = titleRow + 1 + rowIndex;
    worksheet.getRow(worksheetRow).height = rowHeight;

    row.forEach((image, columnIndex) => {
      if (!image) return;

      const imageId = workbook.addImage({
        buffer: image.bytes,
        extension: "jpeg",
      });
      const dimensions = fitInside(
        image.width,
        image.height,
        IMAGE_MAX_WIDTH,
        cellPixelHeight - 14,
      );
      const horizontalOffset = Math.max(0.04, (1 - dimensions.width / CELL_PIXEL_WIDTH) / 2);
      const verticalOffset = Math.max(
        0.03,
        (1 - dimensions.height / cellPixelHeight) / 2,
      );

      worksheet.addImage(imageId, {
        tl: {
          col: columnIndex + horizontalOffset,
          row: worksheetRow - 1 + verticalOffset,
        },
        ext: dimensions,
        editAs: "oneCell",
      });
    });
  });

  const lastRow = titleRow + Math.max(1, rows.length);
  for (let row = titleRow; row <= lastRow; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const cell = worksheet.getRow(row).getCell(column);
      cell.border = {
        top: THIN_BORDER,
        bottom: THIN_BORDER,
        left: THIN_BORDER,
        right: THIN_BORDER,
      };
      if (row > titleRow) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
  }

  return lastRow;
}

/**
 * Writes each block sequentially into a single worksheet with spacing between
 * blocks, and returns the built workbook.
 */
export function buildExcelWorkbook(report) {
  const { columns, blocks } = normalizeToBlocks(report);
  const rowHeight = EXCEL_ROW_HEIGHTS[columns];
  const cellPixelHeight = Math.round((rowHeight * 4) / 3);
  const lastColumn = String.fromCharCode(64 + columns);
  const isMulti = blocks.length > 1;
  const primaryType = getReportType(blocks[0] ? blocks[0].reportType : "waste");
  const sheetName = isMulti ? "Laporan" : primaryType.label;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tabel Sampah";
  workbook.created = new Date();
  workbook.subject = primaryType.label;

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      verticalCentered: false,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.45,
        bottom: 0.45,
        header: 0.15,
        footer: 0.15,
      },
    },
  });

  for (let column = 1; column <= columns; column += 1) {
    worksheet.getColumn(column).width = COLUMN_WIDTH;
  }

  let cursor = 1;
  let lastRow = 1;
  blocks.forEach((block, index) => {
    if (index > 0) cursor += BLOCK_GAP_ROWS;
    lastRow = writeBlock(workbook, worksheet, block, {
      columns,
      startRow: cursor,
      rowHeight,
      cellPixelHeight,
      lastColumn,
    });
    cursor = lastRow + 1;
  });

  worksheet.pageSetup.printArea = `A1:${lastColumn}${lastRow}`;
  worksheet.pageSetup.printTitlesRow = "1:1";
  worksheet.properties.defaultColWidth = COLUMN_WIDTH;
  worksheet.properties.defaultRowHeight = rowHeight;

  return workbook;
}

export async function downloadExcelReport(report) {
  const workbook = buildExcelWorkbook(report);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const { blocks } = normalizeToBlocks(report);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = createMergedFilename(blocks, "xlsx");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

