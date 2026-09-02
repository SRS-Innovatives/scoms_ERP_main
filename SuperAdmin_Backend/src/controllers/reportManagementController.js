/**
 * Super Admin — Report Catalog & Institution Assignment Management
 *
 * Layer 1 (Report catalog) and Layer 2 (per-institution configuration) are both database
 * rows a Super Admin manages here — the Report Generator Engine itself (shared/reportEngine)
 * is what actually runs them on the institute-admin side.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, ConflictError } = require('../../../shared');

// ---- Report Catalog CRUD ----

const getReports = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const reports = await prisma.report.findMany({
      where: {
        ...(category && { category }),
        ...(status && { status }),
        ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }),
      },
      include: {
        _count: { select: { institutionReports: true, runs: true, filters: true, columns: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return sendSuccess(res, reports, 'Reports retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        filters: { orderBy: { sortOrder: 'asc' } },
        columns: { orderBy: { sortOrder: 'asc' } },
        institutionReports: { include: { institution: { select: { name: true, code: true } } } },
      },
    });
    if (!report) throw new NotFoundError('Report not found');
    return sendSuccess(res, report, 'Report retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { code, name, description, category, module: moduleLabel, icon, handlerKey, allowedRoles, allowedFormats, visibility, filters, columns } = req.body;
    if (!code || !name || !category || !handlerKey) throw new ValidationError('code, name, category and handlerKey are required');

    const existing = await prisma.report.findUnique({ where: { code } });
    if (existing) throw new ConflictError(`A report with code "${code}" already exists`);

    const report = await prisma.report.create({
      data: {
        code,
        name,
        description,
        category,
        module: moduleLabel,
        icon,
        handlerKey,
        allowedRoles: allowedRoles || null,
        allowedFormats: allowedFormats || null,
        visibility: visibility || 'INSTITUTION',
        createdById: req.user.id,
        filters: {
          create: (filters || []).map((f, idx) => ({
            fieldKey: f.fieldKey,
            label: f.label,
            inputType: f.inputType,
            dataType: f.dataType || 'string',
            required: !!f.required,
            defaultValue: f.defaultValue || null,
            placeholder: f.placeholder || null,
            options: f.options || null,
            source: f.source || null,
            dependsOn: f.dependsOn || null,
            sortOrder: f.sortOrder ?? idx,
          })),
        },
        columns: {
          create: (columns || []).map((c, idx) => ({
            fieldKey: c.fieldKey,
            label: c.label,
            dataType: c.dataType || 'string',
            visible: c.visible ?? true,
            sortable: c.sortable ?? true,
            width: c.width || null,
            format: c.format || null,
            aggregation: c.aggregation || null,
            sortOrder: c.sortOrder ?? idx,
          })),
        },
      },
      include: { filters: true, columns: true },
    });

    return sendSuccess(res, report, 'Report created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new NotFoundError('Report not found');

    const { name, description, category, module: moduleLabel, icon, status, allowedRoles, allowedFormats, filters, columns } = req.body;

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(moduleLabel !== undefined && { module: moduleLabel }),
        ...(icon !== undefined && { icon }),
        ...(status !== undefined && { status }),
        ...(allowedRoles !== undefined && { allowedRoles }),
        ...(allowedFormats !== undefined && { allowedFormats }),
        updatedById: req.user.id,
        version: { increment: 1 },
      },
    });

    if (Array.isArray(filters)) {
      await prisma.reportFilter.deleteMany({ where: { reportId: report.id } });
      await prisma.reportFilter.createMany({
        data: filters.map((f, idx) => ({
          reportId: report.id,
          fieldKey: f.fieldKey,
          label: f.label,
          inputType: f.inputType,
          dataType: f.dataType || 'string',
          required: !!f.required,
          defaultValue: f.defaultValue || null,
          placeholder: f.placeholder || null,
          options: f.options || null,
          source: f.source || null,
          dependsOn: f.dependsOn || null,
          sortOrder: f.sortOrder ?? idx,
        })),
      });
    }

    if (Array.isArray(columns)) {
      await prisma.reportColumn.deleteMany({ where: { reportId: report.id } });
      await prisma.reportColumn.createMany({
        data: columns.map((c, idx) => ({
          reportId: report.id,
          fieldKey: c.fieldKey,
          label: c.label,
          dataType: c.dataType || 'string',
          visible: c.visible ?? true,
          sortable: c.sortable ?? true,
          width: c.width || null,
          format: c.format || null,
          aggregation: c.aggregation || null,
          sortOrder: c.sortOrder ?? idx,
        })),
      });
    }

    const full = await prisma.report.findUnique({ where: { id: report.id }, include: { filters: true, columns: true } });
    return sendSuccess(res, full, 'Report updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Archives a report (soft-delete) — preserves ReportRun history and never hard-deletes. */
const archiveReport = async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new NotFoundError('Report not found');

    const updated = await prisma.report.update({ where: { id: report.id }, data: { status: 'ARCHIVED' } });
    return sendSuccess(res, updated, 'Report archived successfully');
  } catch (err) {
    next(err);
  }
};

const cloneReport = async (req, res, next) => {
  try {
    const { code, name } = req.body;
    if (!code) throw new ValidationError('A new unique code is required to clone this report');

    const existing = await prisma.report.findUnique({ where: { code } });
    if (existing) throw new ConflictError(`A report with code "${code}" already exists`);

    const source = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { filters: true, columns: true },
    });
    if (!source) throw new NotFoundError('Report not found');

    const clone = await prisma.report.create({
      data: {
        code,
        name: name || `${source.name} (Copy)`,
        description: source.description,
        category: source.category,
        module: source.module,
        icon: source.icon,
        handlerKey: source.handlerKey,
        allowedRoles: source.allowedRoles,
        allowedFormats: source.allowedFormats,
        visibility: 'INSTITUTION',
        status: 'DRAFT',
        createdById: req.user.id,
        filters: {
          create: source.filters.map((f) => ({
            fieldKey: f.fieldKey, label: f.label, inputType: f.inputType, dataType: f.dataType,
            required: f.required, defaultValue: f.defaultValue, placeholder: f.placeholder,
            options: f.options, source: f.source, dependsOn: f.dependsOn, sortOrder: f.sortOrder,
          })),
        },
        columns: {
          create: source.columns.map((c) => ({
            fieldKey: c.fieldKey, label: c.label, dataType: c.dataType, visible: c.visible,
            sortable: c.sortable, width: c.width, format: c.format, aggregation: c.aggregation, sortOrder: c.sortOrder,
          })),
        },
      },
      include: { filters: true, columns: true },
    });

    return sendSuccess(res, clone, 'Report cloned successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ---- Institution Report Assignment ----

/** Every catalog report, merged with this institution's current configuration (or the
 * SYSTEM-report default of "enabled" when no row exists yet). */
const getInstitutionReports = async (req, res, next) => {
  try {
    const institutionId = req.params.id;
    const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { id: true } });
    if (!institution) throw new NotFoundError('Institution not found');

    const reports = await prisma.report.findMany({
      where: { status: { not: 'ARCHIVED' } },
      include: { institutionReports: { where: { institutionId } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const merged = reports.map((r) => {
      const config = r.institutionReports[0];
      return {
        reportId: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        visibility: r.visibility,
        enabled: config ? config.enabled : r.visibility === 'SYSTEM',
        displayName: config?.displayName || null,
        configId: config?.id || null,
      };
    });

    return sendSuccess(res, merged, 'Institution report configuration retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Bulk-assigns/creates InstitutionReport rows — e.g. after approving a new custom report. */
const assignReportsToInstitution = async (req, res, next) => {
  try {
    const institutionId = req.params.id;
    const { assignments } = req.body; // [{ reportId, enabled, displayName? }]
    if (!Array.isArray(assignments) || assignments.length === 0) throw new ValidationError('assignments array is required');

    const results = await Promise.all(
      assignments.map((a) =>
        prisma.institutionReport.upsert({
          where: { institutionId_reportId: { institutionId, reportId: a.reportId } },
          update: { enabled: a.enabled ?? true, displayName: a.displayName || null },
          create: { institutionId, reportId: a.reportId, enabled: a.enabled ?? true, displayName: a.displayName || null },
        })
      )
    );

    return sendSuccess(res, results, 'Reports assigned to institution successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateInstitutionReport = async (req, res, next) => {
  try {
    const { id: institutionId, reportId } = req.params;
    const { enabled, displayName, description, allowedRoles, allowedFormats, sortOrder } = req.body;

    const updated = await prisma.institutionReport.upsert({
      where: { institutionId_reportId: { institutionId, reportId } },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(displayName !== undefined && { displayName }),
        ...(description !== undefined && { description }),
        ...(allowedRoles !== undefined && { allowedRoles }),
        ...(allowedFormats !== undefined && { allowedFormats }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      create: {
        institutionId, reportId,
        enabled: enabled ?? true,
        displayName: displayName || null,
        description: description || null,
        allowedRoles: allowedRoles || null,
        allowedFormats: allowedFormats || null,
        sortOrder: sortOrder || 0,
      },
    });

    return sendSuccess(res, updated, 'Institution report configuration updated successfully');
  } catch (err) {
    next(err);
  }
};

// ---- Report Requests (review workflow) ----

const getReportRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await prisma.reportRequest.findMany({
      where: { ...(status && { status }) },
      include: {
        institution: { select: { name: true, code: true } },
        requestedBy: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, requests, 'Report requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateReportRequest = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const existing = await prisma.reportRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Report request not found');

    const updated = await prisma.reportRequest.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(adminRemarks !== undefined && { adminRemarks }),
        assignedToId: req.user.id,
      },
    });
    return sendSuccess(res, updated, 'Report request updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  archiveReport,
  cloneReport,
  getInstitutionReports,
  assignReportsToInstitution,
  updateInstitutionReport,
  getReportRequests,
  updateReportRequest,
};
