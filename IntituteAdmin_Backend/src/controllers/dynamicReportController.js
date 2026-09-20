/**
 * Institute Admin — Dynamic Report Builder (Phase 8)
 *
 * Extends the existing Report Engine (shared/reportEngine) rather than replacing it —
 * the 12 pre-built reports (reportController.js) keep working exactly as before. This
 * lets a user assemble an ad-hoc report from a small, safe, curated field allow-list
 * (shared/reportEngine/dynamicSources.js) instead of picking from the pre-built catalog.
 * Export reuses the exact same toCsv/toExcelBuffer/toPdfBuffer pipeline the pre-built
 * reports already use — never duplicated.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, reportEngine } = require('../../../shared');
const { listDataSources, runDynamicReport, toCsv, toExcelBuffer, toPdfBuffer } = reportEngine;

const getDataSources = async (req, res, next) => {
  try {
    return sendSuccess(res, listDataSources(), 'Data sources retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const runAdHocReport = async (dataSource, fields, filters, sortBy, sortDirection, institutionId) => {
  try {
    return await runDynamicReport({ dataSourceKey: dataSource, fields, filters, sortBy, sortDirection, institutionId });
  } catch (err) {
    throw new ValidationError(err.message);
  }
};

const previewReport = async (req, res, next) => {
  try {
    const { dataSource, fields, filters, sortBy, sortDirection } = req.body;
    if (!dataSource) throw new ValidationError('dataSource is required');
    const result = await runAdHocReport(dataSource, fields, filters, sortBy, sortDirection, req.institutionId);
    return sendSuccess(res, result, 'Report generated successfully');
  } catch (err) {
    next(err);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { dataSource, fields, filters, sortBy, sortDirection, format = 'CSV', reportName = 'Custom Report' } = req.body;
    if (!dataSource) throw new ValidationError('dataSource is required');
    const result = await runAdHocReport(dataSource, fields, filters, sortBy, sortDirection, req.institutionId);

    const institution = await prisma.institution.findUnique({
      where: { id: req.institutionId },
      select: { name: true, logo: true, address: true, city: true, state: true, pincode: true },
    });
    const institutionAddress = institution
      ? [institution.address, institution.city, institution.state, institution.pincode].filter(Boolean).join(', ')
      : undefined;
    const fileBase = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    const upperFormat = format.toUpperCase();

    if (upperFormat === 'CSV') {
      const csv = toCsv(result);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
      return res.send(csv);
    }
    if (upperFormat === 'EXCEL') {
      const buffer = await toExcelBuffer({
        reportName, institutionName: institution?.name, institutionLogo: institution?.logo, institutionAddress,
        generatedAt: new Date(), generatedBy: req.user.email, columns: result.columns, rows: result.rows,
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }
    if (upperFormat === 'PDF') {
      const buffer = await toPdfBuffer({
        reportName, institutionName: institution?.name, institutionLogo: institution?.logo, institutionAddress,
        generatedAt: new Date(), generatedBy: req.user.email, columns: result.columns, rows: result.rows,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
      return res.send(buffer);
    }
    throw new ValidationError(`Unsupported export format: ${format}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Saved report definitions — re-run without rebuilding
// ============================================================
const getSavedDefinitions = async (req, res, next) => {
  try {
    const definitions = await prisma.dynamicReportDefinition.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, definitions, 'Saved report definitions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const saveDefinition = async (req, res, next) => {
  try {
    const { name, dataSource, fields, filters, sortBy, sortDirection } = req.body;
    if (!name || !dataSource || !Array.isArray(fields) || fields.length === 0) {
      throw new ValidationError('name, dataSource and at least one field are required');
    }
    // Validate it actually runs before saving — catches a bad field/filter immediately
    // instead of saving something that will error every time it's re-run.
    await runAdHocReport(dataSource, fields, filters, sortBy, sortDirection, req.institutionId);

    const definition = await prisma.dynamicReportDefinition.create({
      data: { institutionId: req.institutionId, name, dataSource, fields, filters: filters || undefined, sortBy: sortBy || null, sortDirection: sortDirection || null, createdById: req.user.id },
    });
    return sendSuccess(res, definition, 'Report definition saved successfully', 201);
  } catch (err) {
    next(err);
  }
};

const runSavedDefinition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const definition = await prisma.dynamicReportDefinition.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!definition) throw new NotFoundError('Report definition not found');

    const result = await runAdHocReport(definition.dataSource, definition.fields, definition.filters, definition.sortBy, definition.sortDirection, req.institutionId);
    return sendSuccess(res, result, 'Report generated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteDefinition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.dynamicReportDefinition.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Report definition not found');
    await prisma.dynamicReportDefinition.delete({ where: { id } });
    return sendSuccess(res, null, 'Report definition deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDataSources, previewReport, exportReport, getSavedDefinitions, saveDefinition, runSavedDefinition, deleteDefinition };
