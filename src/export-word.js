import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  PageOrientation,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  createMergedFilename,
  fitInside,
  formatReportTitle,
  getReportType,
  groupIntoRows,
  normalizeColumnCount,
} from "./report-utils.js";


const TABLE_WIDTH = 10400;
const BLOCK_GAP = 260;
const WORD_LAYOUTS = {
  2: { rowHeight: 4200, imageWidth: 330, imageHeight: 270 },
  3: { rowHeight: 3200, imageWidth: 220, imageHeight: 210 },
  4: { rowHeight: 2600, imageWidth: 160, imageHeight: 170 },
};
const CELL_MARGINS = { top: 100, bottom: 100, left: 100, right: 100 };
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "1F2925" };
const CELL_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
};

function createColumnWidths(columns) {
  const width = Math.floor(TABLE_WIDTH / columns);
  const widths = Array.from({ length: columns }, () => width);
  widths[widths.length - 1] += TABLE_WIDTH - width * columns;
  return widths;
}

function imageParagraph(image, layout) {
  if (!image) {
    return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
  }

  const dimensions = fitInside(
    image.width,
    image.height,
    layout.imageWidth,
    layout.imageHeight,
  );
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
    children: [
      new ImageRun({
        type: "jpg",
        data: image.bytes,
        transformation: dimensions,
        altText: {
          title: image.name,
          description: `Foto laporan ${image.name}`,
          name: image.name,
        },
      }),
    ],
  });
}

function imageCell(image, width, layout) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGINS,
    borders: CELL_BORDERS,
    children: [imageParagraph(image, layout)],
  });
}

function buildReportTable({ date, images, columns, reportType }) {
  const columnWidths = createColumnWidths(columns);
  const layout = WORD_LAYOUTS[columns];
  const reportTitle = formatReportTitle(reportType, date);
  const titleRow = new TableRow({
    tableHeader: true,
    height: { value: 560, rule: HeightRule.EXACT },
    children: [
      new TableCell({
        columnSpan: columns,
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 70, bottom: 70, left: 100, right: 100 },
        borders: CELL_BORDERS,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: reportTitle,
                font: "Arial",
                size: 24,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const imageRows = groupIntoRows(images, columns).map(
    (row) =>
      new TableRow({
        cantSplit: true,
        height: { value: layout.rowHeight, rule: HeightRule.EXACT },
        children: row.map((image, index) =>
          imageCell(image, columnWidths[index], layout),
        ),
      }),
  );

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    alignment: AlignmentType.CENTER,
    borders: CELL_BORDERS,
    rows: [titleRow, ...imageRows],
  });
}

function spacerParagraph() {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: BLOCK_GAP, lineRule: "exact" },
    children: [],
  });
}

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

export function buildWordDocument(report) {
  const { columns, blocks } = normalizeToBlocks(report);
  const primaryType = getReportType(blocks[0] ? blocks[0].reportType : "waste");

  const children = [];
  blocks.forEach((block, index) => {
    if (index > 0) children.push(spacerParagraph());
    children.push(
      buildReportTable({
        date: block.date,
        images: block.images,
        columns,
        reportType: block.reportType,
      }),
    );
  });

  return new Document({
    creator: "Tabel Sampah",
    title: primaryType.label,
    description: `Laporan foto dalam tabel ${columns} kolom.`,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });
}
export async function downloadWordReport(report) {
  const blob = await Packer.toBlob(buildWordDocument(report));
  const { blocks } = normalizeToBlocks(report);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = createMergedFilename(blocks, "docx");
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
