/**
 * Institute Admin — Module Configuration (Phase 4)
 *
 * Tenant-facing half of the Module Registry (SuperAdmin owns module definitions/
 * assignment; this lets an institution configure the module IT was assigned — e.g.
 * Transport's "Enable GPS" toggle). Reads/writes InstitutionModuleAssignment.config,
 * scoped strictly to req.institutionId (never a request param), same tenant-isolation
 * guarantee as every other route in this backend.
 *
 * Deliberately does NOT touch any existing module's business logic — Transport's own
 * controllers don't read this config yet. This is the generic config storage/validation
 * layer only; wiring real consumption into each module is a separate, later, per-module
 * step so a mistake here can never break a module that's already working.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_FIELD_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT'];

/** Lightweight validation against ModuleVersion.configSchema, if one was defined by
 * SuperAdmin. Schema shape: { fields: [{ key, label, type, options? }] }. Unknown keys
 * in the submitted config are rejected; missing keys are left unset (no forced defaults). */
const validateConfig = (config, configSchema) => {
  if (!configSchema?.fields) return;
  const knownKeys = new Set(configSchema.fields.map((f) => f.key));
  for (const key of Object.keys(config)) {
    if (!knownKeys.has(key)) throw new ValidationError(`Unknown config field "${key}" for this module`);
  }
  for (const field of configSchema.fields) {
    if (!(field.key in config)) continue;
    const value = config[field.key];
    if (field.type === 'BOOLEAN' && typeof value !== 'boolean') {
      throw new ValidationError(`"${field.label || field.key}" must be true/false`);
    }
    if (field.type === 'NUMBER' && typeof value !== 'number') {
      throw new ValidationError(`"${field.label || field.key}" must be a number`);
    }
    if (field.type === 'SELECT' && field.options && !field.options.includes(value)) {
      throw new ValidationError(`"${field.label || field.key}" must be one of: ${field.options.join(', ')}`);
    }
  }
};

/** Lists every module assigned to this institution alongside its latest configSchema,
 * so the frontend can build a "Module Settings" list without the caller needing to
 * already know each module's key. Only modules whose latest version actually declares
 * configSchema.fields are worth surfacing as "configurable" — the rest just show as
 * assigned with nothing to configure. */
const getAssignedModules = async (req, res, next) => {
  try {
    const assignments = await prisma.institutionModuleAssignment.findMany({
      where: { institutionId: req.institutionId },
      include: {
        module: {
          include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
      orderBy: { assignedAt: 'asc' },
    });

    const modules = assignments.map((a) => {
      const configSchema = a.module.versions[0]?.configSchema || null;
      return {
        moduleKey: a.module.key,
        name: a.module.name,
        description: a.module.description,
        category: a.module.category,
        status: a.status,
        configSchema,
        configurable: Boolean(configSchema?.fields?.length),
        config: a.config || {},
      };
    });

    return sendSuccess(res, modules, 'Assigned modules retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getModuleConfig = async (req, res, next) => {
  try {
    const { moduleKey } = req.params;
    const moduleDef = await prisma.moduleDefinition.findUnique({
      where: { key: moduleKey },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!moduleDef) throw new NotFoundError('Module not found');

    const assignment = await prisma.institutionModuleAssignment.findUnique({
      where: { institutionId_moduleId: { institutionId: req.institutionId, moduleId: moduleDef.id } },
    });

    const configSchema = moduleDef.versions[0]?.configSchema || null;

    if (!assignment) {
      // Legacy institution / not yet migrated to the registry — nothing to configure
      // yet, but this is not an error. Matches the Phase 1 "unassigned = legacy
      // fallback" philosophy rather than treating it as a failure.
      return sendSuccess(res, { assigned: false, config: {}, configSchema }, 'Module is not yet assigned via the registry for this institution');
    }

    return sendSuccess(res, { assigned: true, config: assignment.config || {}, configSchema }, 'Module configuration retrieved');
  } catch (err) {
    next(err);
  }
};

const updateModuleConfig = async (req, res, next) => {
  try {
    const { moduleKey } = req.params;
    const { config } = req.body;
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new ValidationError('config must be an object');
    }

    const moduleDef = await prisma.moduleDefinition.findUnique({
      where: { key: moduleKey },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!moduleDef) throw new NotFoundError('Module not found');

    const assignment = await prisma.institutionModuleAssignment.findUnique({
      where: { institutionId_moduleId: { institutionId: req.institutionId, moduleId: moduleDef.id } },
    });
    if (!assignment) {
      throw new ValidationError('This module has not been assigned to your institution via the registry yet — contact your platform administrator');
    }

    const configSchema = moduleDef.versions[0]?.configSchema || null;
    validateConfig(config, configSchema);

    const merged = { ...(assignment.config || {}), ...config };

    const updated = await prisma.institutionModuleAssignment.update({
      where: { id: assignment.id },
      data: { config: merged },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: 'CONFIG_UPDATE',
        module: 'MODULE_REGISTRY',
        entity: 'InstitutionModuleAssignment',
        entityId: assignment.id,
        oldValues: JSON.stringify(assignment.config || {}),
        newValues: JSON.stringify(merged),
      },
    }).catch(() => {});

    return sendSuccess(res, { assigned: true, config: updated.config, configSchema }, `${moduleDef.name} configuration updated`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssignedModules, getModuleConfig, updateModuleConfig };
