const PDFDocument = require('pdfkit');

// A single, consistent visual language for every generated report — one accent color, one
// type scale, one table style — so a PDF from any module reads as the same institution's
// official document rather than a developer's debug dump.
const INK = '#111827'; // near-black body text
const MUTED = '#6b7280'; // secondary/meta text
const ACCENT = '#4338ca'; // indigo — matches the product's own brand accent
const RULE = '#d1d5db'; // hairlines
const HEADER_FILL = '#eef2ff'; // pale indigo table header band
const ZEBRA_FILL = '#f9fafb'; // faint alternating row tint

/** Builds a real PDF buffer from a generic report result — a proper letterhead (logo,
 * institution identity, generated-by/at, applied filters), a bordered/zebra-striped data
 * table that paginates automatically, and a page-numbered footer on every page. */
const toPdfBuffer = ({
  reportName,
  institutionName,
  institutionLogo,
  institutionAddress,
  generatedAt,
  generatedBy,
  columns,
  rows,
  filtersSummary,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const FOOTER_HEIGHT = 28;

    // ---------------------------------------------------------------- Letterhead
    const LOGO_SIZE = 46;
    const headerTop = doc.y;
    let textLeft = startX;
    if (institutionLogo) {
      try {
        const base64 = institutionLogo.includes(',') ? institutionLogo.split(',')[1] : institutionLogo;
        const imgBuffer = Buffer.from(base64, 'base64');
        doc.image(imgBuffer, startX, headerTop, { fit: [LOGO_SIZE, LOGO_SIZE] });
        textLeft = startX + LOGO_SIZE + 12;
      } catch (err) {
        // corrupt/unsupported logo data — never let a bad image block report generation
      }
    }

    doc.font('Helvetica-Bold').fontSize(15).fillColor(INK)
      .text(institutionName || 'SCOMS', textLeft, headerTop, { width: pageWidth - (textLeft - startX) });
    if (institutionAddress) {
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text(institutionAddress, textLeft, doc.y, { width: pageWidth - (textLeft - startX) });
    }

    const headerBottom = Math.max(doc.y, headerTop + LOGO_SIZE);
    doc.y = headerBottom + 10;
    doc.moveTo(startX, doc.y).lineTo(startX + pageWidth, doc.y).strokeColor(ACCENT).lineWidth(1.5).stroke();
    doc.moveDown(0.7);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(reportName || 'Report', startX);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(`Generated ${new Date(generatedAt).toLocaleString()}${generatedBy ? ` by ${generatedBy}` : ''}`, startX);
    if (filtersSummary) doc.fontSize(8).fillColor(MUTED).text(`Filters: ${filtersSummary}`, startX);
    doc.moveDown(0.8);
    doc.fillColor(INK);

    // ---------------------------------------------------------------- Table
    const colWidth = columns.length > 0 ? pageWidth / columns.length : pageWidth;
    const ROW_HEIGHT = 16;
    let y = doc.y;
    let rowIndex = 0;

    // `ellipsis: true` only truncates to a single line when paired with an explicit
    // `height` — without it pdfkit just wraps normally, which overlapped the row below.
    const CELL_TEXT_OPTS = { width: colWidth - 8, height: ROW_HEIGHT - 6, ellipsis: true };

    const drawHeaderRow = () => {
      doc.rect(startX, y, pageWidth, ROW_HEIGHT).fill(HEADER_FILL);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(ACCENT);
      columns.forEach((c, i) => {
        doc.text(String(c.label), startX + i * colWidth + 5, y + 4, CELL_TEXT_OPTS);
      });
      y += ROW_HEIGHT;
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor(RULE).lineWidth(0.75).stroke();
      doc.font('Helvetica').fillColor(INK);
    };

    const bottomLimit = () => doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;

    drawHeaderRow();

    rows.forEach((row) => {
      if (y + ROW_HEIGHT > bottomLimit()) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow();
      }
      if (rowIndex % 2 === 1) {
        doc.rect(startX, y, pageWidth, ROW_HEIGHT).fill(ZEBRA_FILL);
        doc.fillColor(INK);
      }
      doc.font('Helvetica').fontSize(8).fillColor(INK);
      columns.forEach((c, i) => {
        doc.text(String(row[c.fieldKey] ?? '—'), startX + i * colWidth + 5, y + 4, CELL_TEXT_OPTS);
      });
      y += ROW_HEIGHT;
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor(RULE).lineWidth(0.5).stroke();
      rowIndex++;
    });

    if (rows.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED)
        .text('No data found for the selected filters.', startX, y + 8, { width: pageWidth, align: 'center' });
    }

    // ---------------------------------------------------------------- Footer (every page)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT + 8;
      doc.moveTo(startX, footerY).lineTo(startX + pageWidth, footerY).strokeColor(RULE).lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
        .text(`${institutionName || 'SCOMS'} — Confidential`, startX, footerY + 4, { width: pageWidth / 2, align: 'left' })
        .text(`Page ${i - range.start + 1} of ${range.count}`, startX + pageWidth / 2, footerY + 4, { width: pageWidth / 2, align: 'right' });
    }

    doc.end();
  });
};

module.exports = { toPdfBuffer };
