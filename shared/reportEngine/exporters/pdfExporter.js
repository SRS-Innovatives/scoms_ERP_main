const PDFDocument = require('pdfkit');

/** Builds a real PDF buffer from a generic report result — a simple, reliable table
 * layout (landscape A4) that paginates automatically for long reports. The institution's
 * logo (a base64 data URI, PNG/JPEG only — pdfkit doesn't rasterize SVG) renders at the
 * top-left of every generated report; a bad/missing logo never blocks report generation. */
const toPdfBuffer = ({ reportName, institutionName, institutionLogo, generatedAt, columns, rows, filtersSummary }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const LOGO_SIZE = 44;
    const headerTop = doc.y;
    if (institutionLogo) {
      try {
        const base64 = institutionLogo.includes(',') ? institutionLogo.split(',')[1] : institutionLogo;
        const imgBuffer = Buffer.from(base64, 'base64');
        doc.image(imgBuffer, doc.page.margins.left, headerTop, { fit: [LOGO_SIZE, LOGO_SIZE] });
      } catch (err) {
        // corrupt/unsupported logo data — never let a bad image break report generation
      }
    }

    doc.fontSize(16).fillColor('#111').text(institutionName || 'SCOMS', { align: 'center' });
    doc.fontSize(13).text(reportName || 'Report', { align: 'center' });
    doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date(generatedAt).toLocaleString()}`, { align: 'center' });
    if (filtersSummary) doc.fontSize(9).text(filtersSummary, { align: 'center' });
    if (doc.y < headerTop + LOGO_SIZE) doc.y = headerTop + LOGO_SIZE;
    doc.moveDown(1);
    doc.fillColor('#000');

    const startX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = columns.length > 0 ? pageWidth / columns.length : pageWidth;
    let y = doc.y;

    const drawHeader = () => {
      doc.fontSize(9).font('Helvetica-Bold');
      columns.forEach((c, i) => {
        doc.text(String(c.label), startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
      });
      y += 16;
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#cccccc').stroke();
      y += 4;
      doc.font('Helvetica').fillColor('#000');
    };

    drawHeader();

    rows.forEach((row) => {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      columns.forEach((c, i) => {
        doc.fontSize(8).text(String(row[c.fieldKey] ?? '—'), startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true });
      });
      y += 14;
    });

    if (rows.length === 0) {
      doc.fontSize(10).fillColor('#888').text('No data found for the selected filters.', startX, y);
    }

    doc.end();
  });
};

module.exports = { toPdfBuffer };
