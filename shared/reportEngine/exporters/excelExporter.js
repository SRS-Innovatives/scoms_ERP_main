const ExcelJS = require('exceljs');

// Matches the PDF exporter's palette so a report reads as the same document regardless of
// which format someone downloads.
const FONT_FAMILY = 'Calibri'; // the standard professional business-document font in Excel
const ACCENT_ARGB = 'FF4338CA';
const HEADER_FILL_ARGB = 'FFEEF2FF';
const ZEBRA_FILL_ARGB = 'FFF9FAFB';
const MUTED_ARGB = 'FF6B7280';
const BORDER_ARGB = 'FFD1D5DB';
const thinBorder = { style: 'thin', color: { argb: BORDER_ARGB } };

/** Builds a real .xlsx workbook buffer from a generic report result, with an institution
 * letterhead block (logo + name + address, when set) above a bordered, zebra-striped,
 * auto-filtered data table with a frozen header row. A bad/unsupported logo never blocks
 * the export — it's just skipped. */
const toExcelBuffer = async ({ reportName, institutionName, institutionLogo, institutionAddress, generatedAt, generatedBy, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = institutionName || 'SCOMS';
  workbook.created = new Date(generatedAt);
  const sheet = workbook.addWorksheet((reportName || 'Report').slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 5 }],
  });
  sheet.properties.defaultRowHeight = 16;

  const HEADER_ROWS = 4; // institution name, address, generated-at, blank spacer
  const textCol = institutionLogo ? 3 : 1; // shift header text right to make room for the logo

  if (institutionLogo) {
    try {
      const extension = institutionLogo.includes('image/png') ? 'png' : 'jpeg';
      const imageId = workbook.addImage({ base64: institutionLogo, extension });
      sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 56, height: 56 } });
      sheet.getRow(1).height = 18;
      sheet.getRow(2).height = 18;
      sheet.getRow(3).height = 18;
    } catch (err) {
      // corrupt/unsupported logo data (e.g. a format ExcelJS can't decode) — skip silently
    }
  }

  sheet.getCell(1, textCol).value = institutionName || '';
  sheet.getCell(1, textCol).font = { name: FONT_FAMILY, bold: true, size: 14, color: { argb: 'FF111827' } };
  sheet.getCell(2, textCol).value = institutionAddress || reportName || '';
  sheet.getCell(2, textCol).font = { name: FONT_FAMILY, size: 9, color: { argb: MUTED_ARGB } };
  sheet.getCell(3, textCol).value = `Generated ${new Date(generatedAt).toLocaleString()}${generatedBy ? ` by ${generatedBy}` : ''}`;
  sheet.getCell(3, textCol).font = { name: FONT_FAMILY, italic: true, size: 8, color: { argb: MUTED_ARGB } };
  if (institutionAddress) {
    // address took row 2's slot, so the report name gets its own bold line just above the table
    sheet.getCell(4, textCol).value = reportName || '';
    sheet.getCell(4, textCol).font = { name: FONT_FAMILY, bold: true, size: 11, color: { argb: 'FF111827' } };
  }

  const headerRow = sheet.getRow(HEADER_ROWS + 1);
  columns.forEach((c, idx) => { headerRow.getCell(idx + 1).value = c.label; });
  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, bold: true, size: 10, color: { argb: ACCENT_ARGB } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_ARGB } };
    cell.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
    cell.alignment = { vertical: 'middle' };
  });
  headerRow.height = 20;

  rows.forEach((row, i) => {
    const excelRow = sheet.getRow(HEADER_ROWS + 2 + i);
    columns.forEach((c, idx) => {
      const cell = excelRow.getCell(idx + 1);
      cell.value = row[c.fieldKey] ?? '';
      cell.font = { name: FONT_FAMILY, size: 10 };
      cell.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
      if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_FILL_ARGB } };
    });
  });

  columns.forEach((c, idx) => {
    sheet.getColumn(idx + 1).width = Math.max(String(c.label).length + 2, 14);
  });

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: HEADER_ROWS + 1, column: 1 },
      to: { row: HEADER_ROWS + 1, column: columns.length },
    };
  }

  return workbook.xlsx.writeBuffer();
};

module.exports = { toExcelBuffer };
