const ExcelJS = require('exceljs');

/** Builds a real .xlsx workbook buffer from a generic report result, with an institution
 * header block (including the institution's logo, top-left, when one is set) above the
 * data table. A bad/unsupported logo never blocks the export — it's just skipped. */
const toExcelBuffer = async ({ reportName, institutionName, institutionLogo, generatedAt, columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet((reportName || 'Report').slice(0, 31));

  const HEADER_ROWS = 4; // institution name, report name, generated-at, blank spacer
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
  sheet.getCell(1, textCol).font = { bold: true, size: 13 };
  sheet.getCell(2, textCol).value = reportName || '';
  sheet.getCell(3, textCol).value = `Generated: ${new Date(generatedAt).toLocaleString()}`;

  const headerRow = sheet.getRow(HEADER_ROWS + 1);
  columns.forEach((c, idx) => { headerRow.getCell(idx + 1).value = c.label; });
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  });

  rows.forEach((row, i) => {
    const excelRow = sheet.getRow(HEADER_ROWS + 2 + i);
    columns.forEach((c, idx) => { excelRow.getCell(idx + 1).value = row[c.fieldKey] ?? ''; });
  });

  columns.forEach((c, idx) => {
    sheet.getColumn(idx + 1).width = Math.max(String(c.label).length + 2, 14);
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { toExcelBuffer };
