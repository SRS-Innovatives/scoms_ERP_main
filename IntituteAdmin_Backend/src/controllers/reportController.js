/**
 * Institute Admin — Dynamic Report Engine Controller
 *
 * Thin HTTP layer over shared/reportEngine. All catalog/definition/query logic lives in
 * the engine (shared across every backend that needs reports) — this file only ever:
 *   1. Confirms the institution/role context from the authenticated request.
 *   2. Verifies any id submitted in filters actually belongs to this institution.
 *   3. Calls the engine and formats the HTTP response (including binary exports).
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, reportEngine } = require('../../../shared');
const { getReportDefinition, runReport, resolveFilterOptions, toCsv, toExcelBuffer, toPdfBuffer } = reportEngine;

/** Every report visible to this institution (catalog ∩ institution configuration), for the
 * Reports Dashboard / Report Catalog screen. Never a hardcoded list. */
const getCatalog = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { status: 'ACTIVE' },
      include: {
        institutionReports: { where: { institutionId: req.institutionId } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const visible = reports
      .filter((r) => {
        const config = r.institutionReports[0];
        // SYSTEM reports are visible by default unless explicitly disabled; INSTITUTION
        // (custom) reports need an explicit enabled configuration row.
        return r.visibility === 'SYSTEM' ? (config ? config.enabled : true) : !!config?.enabled;
      })
      .map((r) => {
        const config = r.institutionReports[0];
        return {
          code: r.code,
          name: config?.displayName || r.name,
          description: config?.description || r.description,
          category: r.category,
          module: r.module,
          icon: r.icon,
          visibility: r.visibility,
        };
      });

    return sendSuccess(res, visible, 'Report catalog retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Full dynamic definition (filters + columns) for one report, with dynamic filter option
 * lists pre-resolved for any filter that isn't dependent on another (dependent ones are
 * resolved lazily via /filter-options as the user fills the form). */
const getDefinition = async (req, res, next) => {
  try {
    const definition = await getReportDefinition(req.params.code, req.institutionId);

    const filtersWithOptions = await Promise.all(
      definition.filters.map(async (f) => {
        if (!f.source || f.dependsOn) return f;
        const options = await resolveFilterOptions(f.source, req.institutionId);
        return { ...f, options };
      })
    );

    return sendSuccess(res, { ...definition, filters: filtersWithOptions, _internal: undefined }, 'Report definition retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Resolves one dependent filter's option list once its parent value is known — powers
 * cascading dropdowns (Department → Course → Semester → Section → Subject/Student). */
const getFilterOptions = async (req, res, next) => {
  try {
    const { source } = req.query;
    if (!source) throw new ValidationError('source is required');
    const options = await resolveFilterOptions(source, req.institutionId, req.query);
    return sendSuccess(res, options, 'Filter options retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const runForRequest = (req) =>
  runReport({
    code: req.params.code,
    institutionId: req.institutionId,
    userId: req.user.id,
    role: req.user.role,
    filters: req.body.filters || {},
    format: req.body.format || 'PREVIEW',
  });

/** Generates the report and returns it as structured preview data — never immediately a
 * file download. */
const previewReport = async (req, res, next) => {
  try {
    const result = await runForRequest(req);
    return sendSuccess(res, result, 'Report generated successfully');
  } catch (err) {
    next(err);
  }
};

/** Same engine call as preview — kept as a separate endpoint to match the documented
 * generate → preview flow (a client may call either; both return the same shape). */
const generateReport = previewReport;

/** Runs the report, then converts it to the requested binary format and streams it back. */
const exportReport = async (req, res, next) => {
  try {
    const format = (req.body.format || 'CSV').toUpperCase();
    const result = await runForRequest(req);

    const institution = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { name: true, logo: true } });
    const fileBase = `${result.report.code}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'CSV') {
      const csv = toCsv(result);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.csv"`);
      return res.send(csv);
    }

    if (format === 'EXCEL') {
      const buffer = await toExcelBuffer({
        reportName: result.report.name,
        institutionName: institution?.name,
        institutionLogo: institution?.logo,
        generatedAt: result.generatedAt,
        columns: result.columns,
        rows: result.rows,
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }

    if (format === 'PDF') {
      const buffer = await toPdfBuffer({
        reportName: result.report.name,
        institutionName: institution?.name,
        institutionLogo: institution?.logo,
        generatedAt: result.generatedAt,
        columns: result.columns,
        rows: result.rows,
        filtersSummary: result.summary,
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

/** This institution's report generation history, most recent first. */
const getHistory = async (req, res, next) => {
  try {
    const runs = await prisma.reportRun.findMany({
      where: { institutionId: req.institutionId },
      include: { report: { select: { code: true, name: true } } },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    return sendSuccess(res, runs, 'Report history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getSavedReports = async (req, res, next) => {
  try {
    const saved = await prisma.savedReport.findMany({
      where: { institutionId: req.institutionId, userId: req.user.id },
      include: { report: { select: { code: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, saved, 'Saved reports retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createSavedReport = async (req, res, next) => {
  try {
    const { reportCode, name, filters } = req.body;
    if (!reportCode || !name) throw new ValidationError('reportCode and name are required');

    const report = await prisma.report.findUnique({ where: { code: reportCode } });
    if (!report) throw new NotFoundError('Report not found');

    const saved = await prisma.savedReport.create({
      data: { institutionId: req.institutionId, reportId: report.id, userId: req.user.id, name, filters: filters || {} },
    });
    return sendSuccess(res, saved, 'Report saved successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteSavedReport = async (req, res, next) => {
  try {
    const existing = await prisma.savedReport.findFirst({ where: { id: req.params.id, institutionId: req.institutionId, userId: req.user.id } });
    if (!existing) throw new NotFoundError('Saved report not found');
    await prisma.savedReport.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Saved report deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ---- Institution-specific report requests ----

const createReportRequest = async (req, res, next) => {
  try {
    const { title, category, description, requirements, priority } = req.body;
    if (!title || !category || !description) throw new ValidationError('title, category and description are required');

    const request = await prisma.reportRequest.create({
      data: {
        institutionId: req.institutionId,
        requestedById: req.user.id,
        title,
        category,
        description,
        requirements: requirements || null,
        priority: priority || 'MEDIUM',
      },
    });
    return sendSuccess(res, request, 'Report request submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getReportRequests = async (req, res, next) => {
  try {
    const requests = await prisma.reportRequest.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, requests, 'Report requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCatalog,
  getDefinition,
  getFilterOptions,
  previewReport,
  generateReport,
  exportReport,
  getHistory,
  getSavedReports,
  createSavedReport,
  deleteSavedReport,
  createReportRequest,
  getReportRequests,
};
