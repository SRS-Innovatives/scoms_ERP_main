/**
 * Report Generator Engine — Layer 3.
 *
 * Loads a report's definition (Layer 1 catalog + Layer 2 institution configuration),
 * checks it's enabled and the caller's role is permitted, validates the submitted filters
 * against that definition, dispatches to the registered handler for real data, and logs
 * the attempt to report history — all before ever touching an export format.
 */
const prisma = require('../database/client');
const { NotFoundError, ValidationError, AuthorizationError } = require('../errors/customErrors');
const { REPORT_REGISTRY } = require('./registry');

/** Loads a report's full definition, scoped by what this institution has enabled — never
 * exposes a report the institution doesn't actually have access to. */
const getReportDefinition = async (code, institutionId) => {
  const report = await prisma.report.findUnique({
    where: { code },
    include: { filters: { orderBy: { sortOrder: 'asc' } }, columns: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!report || report.status === 'ARCHIVED') throw new NotFoundError('Report not found');

  const institutionReport = await prisma.institutionReport.findUnique({
    where: { institutionId_reportId: { institutionId, reportId: report.id } },
  });

  // SYSTEM reports are available by default unless explicitly disabled for this institution;
  // INSTITUTION-visibility (custom) reports require an explicit enabled configuration row.
  const enabled = report.visibility === 'SYSTEM'
    ? (institutionReport ? institutionReport.enabled : true)
    : !!institutionReport?.enabled;
  if (!enabled) throw new AuthorizationError('This report is not enabled for your institution');

  return {
    code: report.code,
    name: institutionReport?.displayName || report.name,
    description: institutionReport?.description || report.description,
    category: report.category,
    icon: report.icon,
    allowedFormats: institutionReport?.allowedFormats || report.allowedFormats || ['PREVIEW', 'PDF', 'EXCEL', 'CSV', 'PRINT'],
    allowedRoles: institutionReport?.allowedRoles || report.allowedRoles || null,
    filters: report.filters.map((f) => ({
      fieldKey: f.fieldKey,
      label: f.label,
      inputType: f.inputType,
      dataType: f.dataType,
      required: f.required,
      defaultValue: f.defaultValue,
      placeholder: f.placeholder,
      options: f.options,
      source: f.source,
      dependsOn: f.dependsOn,
    })),
    columns: report.columns
      .filter((c) => c.visible)
      .map((c) => ({
        fieldKey: c.fieldKey,
        label: c.label,
        dataType: c.dataType,
        sortable: c.sortable,
        width: c.width,
        format: c.format,
        aggregation: c.aggregation,
      })),
    _internal: { reportId: report.id, handlerKey: report.handlerKey },
  };
};

const validateFilters = (definition, filters) => {
  const missing = definition.filters.filter((f) => f.required && !filters[f.fieldKey]);
  if (missing.length > 0) {
    throw new ValidationError(`${missing.map((f) => f.label).join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  }
};

/** Runs a report end-to-end: definition → permission → validate → execute → log. */
const runReport = async ({ code, institutionId, userId, role, filters = {}, format = 'PREVIEW' }) => {
  const definition = await getReportDefinition(code, institutionId);

  if (definition.allowedRoles && Array.isArray(definition.allowedRoles) && role && !definition.allowedRoles.includes(role)) {
    throw new AuthorizationError('You do not have permission to run this report');
  }

  validateFilters(definition, filters);

  const handler = REPORT_REGISTRY[definition._internal.handlerKey];
  if (!handler) throw new NotFoundError(`No handler registered for report ${code}`);

  const startedAt = new Date();
  let result;
  let runStatus = 'SUCCESS';
  let errorMessage = null;
  try {
    result = await handler(institutionId, filters);
  } catch (err) {
    runStatus = 'FAILED';
    errorMessage = err.message;
    throw err;
  } finally {
    await prisma.reportRun
      .create({
        data: {
          institutionId,
          reportId: definition._internal.reportId,
          generatedById: userId || null,
          filters,
          format,
          status: runStatus,
          rowCount: result?.rows?.length ?? null,
          errorMessage,
          startedAt,
          completedAt: new Date(),
        },
      })
      .catch(() => {}); // history logging must never break the actual report response
  }

  const columns = definition.columns.length > 0
    ? definition.columns
    : (result.rows[0] ? Object.keys(result.rows[0]).map((k) => ({ fieldKey: k, label: k })) : []);

  return {
    report: { code: definition.code, name: definition.name, category: definition.category },
    generatedAt: new Date().toISOString(),
    filters,
    columns,
    rows: result.rows,
    summary: result.summary,
  };
};

module.exports = { getReportDefinition, runReport };
