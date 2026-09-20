/**
 * Super Admin — Module Registry (Phase 2)
 *
 * Manages ModuleDefinition/ModuleVersion/ModuleDependency/InstitutionModuleAssignment —
 * the Phase 1 tables. Purely additive: nothing here touches Institution.modules (the
 * legacy array) or institutionController.js's existing module-toggle endpoint. An
 * institution only ever runs through this registry once it has real assignment rows
 * AND the platform-wide MODULE_REGISTRY_ENABLED flag is on — see
 * shared/moduleRegistry/resolveModules.js. Until then this is a management surface with
 * no live effect, exactly as scoped for Phase 1/2.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError, resolveEnabledModules, PERMISSIONS } = require('../../../shared');

const MODULE_STATUSES = ['DRAFT', 'TESTING', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'DEPRECATED'];
const MODULE_TYPES = ['CORE', 'STANDARD', 'PLUGIN', 'CUSTOM'];
const ASSIGNMENT_STATUSES = ['AVAILABLE', 'INSTALLED', 'ENABLED', 'DISABLED', 'SUSPENDED', 'TRIAL', 'EXPIRED'];
const VALID_PERMISSIONS = Object.values(PERMISSIONS);

// ============================================================
// Module Definitions
// ============================================================

const getModules = async (req, res, next) => {
  try {
    const modules = await prisma.moduleDefinition.findMany({
      include: {
        _count: { select: { assignments: true, versions: true, dependencies: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, modules, 'Modules retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await prisma.moduleDefinition.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        dependencies: { include: { dependsOnModule: { select: { id: true, key: true, name: true } } } },
        dependents: { include: { module: { select: { id: true, key: true, name: true } } } },
        assignments: {
          include: { institution: { select: { id: true, name: true, code: true } } },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!module) throw new NotFoundError('Module not found');
    return sendSuccess(res, module, 'Module retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createModule = async (req, res, next) => {
  try {
    const { key, name, description, category, moduleType, icon, frontendRoute, backendRoutePrefix } = req.body;
    if (!key || !name) throw new ValidationError('key and name are required');
    if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new ValidationError('key must be lowercase letters, numbers and underscores only, starting with a letter (matches the existing MODULE_CATALOG key convention)');
    if (moduleType && !MODULE_TYPES.includes(moduleType)) throw new ValidationError(`moduleType must be one of ${MODULE_TYPES.join(', ')}`);

    const existing = await prisma.moduleDefinition.findUnique({ where: { key } });
    if (existing) throw new ValidationError(`A module with key "${key}" already exists`);

    const module = await prisma.$transaction(async (tx) => {
      const created = await tx.moduleDefinition.create({
        data: {
          key, name, description: description || null, category: category || null,
          moduleType: moduleType || 'STANDARD', icon: icon || null,
          frontendRoute: frontendRoute || null, backendRoutePrefix: backendRoutePrefix || null,
          currentVersion: '1.0.0', status: 'DRAFT',
        },
      });
      await tx.moduleVersion.create({ data: { moduleId: created.id, version: '1.0.0', changelog: 'Initial version' } });
      await tx.auditLog.create({
        data: { userId: req.user.id, action: 'CREATE', module: 'MODULE_REGISTRY', entity: 'ModuleDefinition', entityId: created.id, newValues: JSON.stringify({ key, name }) },
      }).catch(() => {});
      return created;
    });

    return sendSuccess(res, module, `Module "${name}" created as a draft`, 201);
  } catch (err) {
    next(err);
  }
};

const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    // key is deliberately immutable once created — it's the stable identifier every
    // requireModule() call and the legacy MODULE_CATALOG both key off of.
    const { name, description, category, icon, frontendRoute, backendRoutePrefix } = req.body;

    const existing = await prisma.moduleDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Module not found');

    const module = await prisma.moduleDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(icon !== undefined && { icon }),
        ...(frontendRoute !== undefined && { frontendRoute }),
        ...(backendRoutePrefix !== undefined && { backendRoutePrefix }),
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'UPDATE', module: 'MODULE_REGISTRY', entity: 'ModuleDefinition', entityId: id, oldValues: JSON.stringify(existing), newValues: JSON.stringify(module) },
    }).catch(() => {});

    return sendSuccess(res, module, 'Module updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Publish / Suspend / Deprecate — one generic status-transition endpoint rather than
 * three separate ones, since the valid transitions aren't enforced as a strict state
 * machine in Phase 2 (a SuperAdmin can move a module back from SUSPENDED to ACTIVE, etc). */
const updateModuleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!MODULE_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${MODULE_STATUSES.join(', ')}`);

    const existing = await prisma.moduleDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Module not found');

    const module = await prisma.moduleDefinition.update({ where: { id }, data: { status } });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'STATUS_CHANGE', module: 'MODULE_REGISTRY', entity: 'ModuleDefinition', entityId: id, oldValues: JSON.stringify({ status: existing.status }), newValues: JSON.stringify({ status }) },
    }).catch(() => {});

    return sendSuccess(res, module, `"${module.name}" is now ${status}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Module Versions
// ============================================================

const createModuleVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version, changelog, configSchema, requiredPermissions } = req.body;
    if (!version) throw new ValidationError('version is required, e.g. "1.1.0"');
    if (requiredPermissions !== undefined) {
      if (!Array.isArray(requiredPermissions)) throw new ValidationError('requiredPermissions must be an array of permission strings');
      const invalid = requiredPermissions.filter((p) => !VALID_PERMISSIONS.includes(p));
      if (invalid.length > 0) throw new ValidationError(`Unknown permission(s): ${invalid.join(', ')}`);
    }

    const module = await prisma.moduleDefinition.findUnique({ where: { id } });
    if (!module) throw new NotFoundError('Module not found');

    const existingVersion = await prisma.moduleVersion.findUnique({ where: { moduleId_version: { moduleId: id, version } } });
    if (existingVersion) throw new ValidationError(`Version "${version}" already exists for this module`);

    const [newVersion] = await prisma.$transaction([
      prisma.moduleVersion.create({ data: { moduleId: id, version, changelog: changelog || null, configSchema: configSchema || undefined, requiredPermissions: requiredPermissions || undefined } }),
      prisma.moduleDefinition.update({ where: { id }, data: { currentVersion: version } }),
    ]);

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'VERSION_CREATE', module: 'MODULE_REGISTRY', entity: 'ModuleVersion', entityId: newVersion.id, newValues: JSON.stringify({ moduleId: id, version }) },
    }).catch(() => {});

    return sendSuccess(res, newVersion, `Version ${version} created — an institution's own assignment keeps its own installedVersion until explicitly upgraded`, 201);
  } catch (err) {
    next(err);
  }
};

/** Assembles the "conceptual manifest" the architecture spec describes — key, name,
 * version, type, dependencies, required permissions, config schema — entirely from
 * ModuleDefinition/ModuleVersion/ModuleDependency data that already exists (Phase 1/2).
 * No new storage: a plugin's manifest IS its registry entry, viewed as one document.
 * Deliberately read-only and descriptive — per the spec's own explicit rule, this is
 * NOT a mechanism for executing any code the manifest describes. */
const getManifest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await prisma.moduleDefinition.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
        dependencies: { include: { dependsOnModule: { select: { key: true, name: true } } } },
      },
    });
    if (!module) throw new NotFoundError('Module not found');

    const latestVersion = module.versions[0];
    const manifest = {
      key: module.key,
      name: module.name,
      version: module.currentVersion,
      type: module.moduleType,
      status: module.status,
      description: module.description,
      dependencies: module.dependencies.map((d) => d.dependsOnModule.key),
      requiredPermissions: latestVersion?.requiredPermissions || [],
      configSchema: latestVersion?.configSchema || null,
      frontendRoute: module.frontendRoute,
      backendRoutePrefix: module.backendRoutePrefix,
    };
    return sendSuccess(res, manifest, 'Module manifest retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Module Dependencies
// ============================================================

const addModuleDependency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dependsOnModuleId } = req.body;
    if (!dependsOnModuleId) throw new ValidationError('dependsOnModuleId is required');
    if (dependsOnModuleId === id) throw new ValidationError('A module cannot depend on itself');

    const [module, dependsOn] = await Promise.all([
      prisma.moduleDefinition.findUnique({ where: { id } }),
      prisma.moduleDefinition.findUnique({ where: { id: dependsOnModuleId } }),
    ]);
    if (!module) throw new NotFoundError('Module not found');
    if (!dependsOn) throw new NotFoundError('Dependency target module not found');

    const existing = await prisma.moduleDependency.findUnique({ where: { moduleId_dependsOnModuleId: { moduleId: id, dependsOnModuleId } } });
    if (existing) throw new ValidationError('This dependency already exists');

    const dependency = await prisma.moduleDependency.create({
      data: { moduleId: id, dependsOnModuleId },
      include: { dependsOnModule: { select: { key: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'DEPENDENCY_ADD', module: 'MODULE_REGISTRY', entity: 'ModuleDependency', entityId: dependency.id, newValues: JSON.stringify({ moduleId: id, dependsOnModuleId }) },
    }).catch(() => {});

    return sendSuccess(res, dependency, `"${module.name}" now requires "${dependsOn.name}"`, 201);
  } catch (err) {
    next(err);
  }
};

const removeModuleDependency = async (req, res, next) => {
  try {
    const { dependencyId } = req.params;
    const existing = await prisma.moduleDependency.findUnique({ where: { id: dependencyId } });
    if (!existing) throw new NotFoundError('Dependency not found');

    await prisma.moduleDependency.delete({ where: { id: dependencyId } });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'DEPENDENCY_REMOVE', module: 'MODULE_REGISTRY', entity: 'ModuleDependency', entityId: dependencyId, oldValues: JSON.stringify(existing) },
    }).catch(() => {});

    return sendSuccess(res, null, 'Dependency removed');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Institution Assignments
// ============================================================

/** Assigns (or re-assigns) a module to one institution. Validates every declared
 * dependency is actually satisfied for that institution first — checked against BOTH
 * the new registry assignments and the institution's legacy modules array, since most
 * institutions haven't been migrated yet and a dependency shouldn't be un-satisfiable
 * just because the dependency itself hasn't been formally registered as assigned. */
const assignModuleToInstitution = async (req, res, next) => {
  try {
    const { id } = req.params; // moduleId
    const { institutionId, status, installedVersion } = req.body;
    if (!institutionId) throw new ValidationError('institutionId is required');
    const assignStatus = status || 'ENABLED';
    if (!ASSIGNMENT_STATUSES.includes(assignStatus)) throw new ValidationError(`status must be one of ${ASSIGNMENT_STATUSES.join(', ')}`);

    const [module, institution] = await Promise.all([
      prisma.moduleDefinition.findUnique({ where: { id }, include: { dependencies: { include: { dependsOnModule: { select: { key: true, name: true } } } } } }),
      prisma.institution.findUnique({ where: { id: institutionId }, select: { id: true, name: true, modules: true } }),
    ]);
    if (!module) throw new NotFoundError('Module not found');
    if (!institution) throw new NotFoundError('Institution not found');

    if (assignStatus === 'ENABLED' && module.dependencies.length > 0) {
      const existingAssignments = await prisma.institutionModuleAssignment.findMany({
        where: { institutionId, status: { in: ['ENABLED', 'TRIAL'] } },
        include: { module: { select: { key: true } } },
      });
      const assignedKeys = new Set(existingAssignments.map((a) => a.module.key));
      // resolveEnabledModules handles the legacy fallback correctly: an institution with
      // modules unset/null/empty has EVERYTHING enabled, not nothing — mirrors requireModule().
      const legacyKeys = new Set(resolveEnabledModules(institution.modules));
      const unmet = module.dependencies.filter((d) => !assignedKeys.has(d.dependsOnModule.key) && !legacyKeys.has(d.dependsOnModule.key));
      if (unmet.length > 0) {
        throw new BusinessRuleError(`"${institution.name}" is missing required module(s): ${unmet.map((d) => d.dependsOnModule.name).join(', ')} — enable those first.`);
      }
    }

    const assignment = await prisma.institutionModuleAssignment.upsert({
      where: { institutionId_moduleId: { institutionId, moduleId: id } },
      update: { status: assignStatus, installedVersion: installedVersion || module.currentVersion, assignedById: req.user.id, assignedAt: new Date() },
      create: { institutionId, moduleId: id, status: assignStatus, installedVersion: installedVersion || module.currentVersion, assignedById: req.user.id },
      include: { institution: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: { institutionId, userId: req.user.id, action: 'ASSIGN', module: 'MODULE_REGISTRY', entity: 'InstitutionModuleAssignment', entityId: assignment.id, newValues: JSON.stringify({ moduleKey: module.key, status: assignStatus }) },
    }).catch(() => {});

    return sendSuccess(res, assignment, `"${module.name}" ${assignStatus.toLowerCase()} for ${institution.name}`, 201);
  } catch (err) {
    next(err);
  }
};

const updateModuleAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;
    if (!ASSIGNMENT_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${ASSIGNMENT_STATUSES.join(', ')}`);

    const existing = await prisma.institutionModuleAssignment.findUnique({ where: { id: assignmentId } });
    if (!existing) throw new NotFoundError('Assignment not found');

    const assignment = await prisma.institutionModuleAssignment.update({ where: { id: assignmentId }, data: { status } });

    await prisma.auditLog.create({
      data: { institutionId: existing.institutionId, userId: req.user.id, action: 'STATUS_CHANGE', module: 'MODULE_REGISTRY', entity: 'InstitutionModuleAssignment', entityId: assignmentId, oldValues: JSON.stringify({ status: existing.status }), newValues: JSON.stringify({ status }) },
    }).catch(() => {});

    return sendSuccess(res, assignment, 'Assignment updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Safe removal — deleting the assignment row simply reverts that institution to legacy
 * (Institution.modules) resolution for this module, by design of the Phase 1 resolver.
 * It never deletes or touches the legacy array itself. */
const removeModuleAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const existing = await prisma.institutionModuleAssignment.findUnique({ where: { id: assignmentId } });
    if (!existing) throw new NotFoundError('Assignment not found');

    await prisma.institutionModuleAssignment.delete({ where: { id: assignmentId } });

    await prisma.auditLog.create({
      data: { institutionId: existing.institutionId, userId: req.user.id, action: 'UNASSIGN', module: 'MODULE_REGISTRY', entity: 'InstitutionModuleAssignment', entityId: assignmentId, oldValues: JSON.stringify(existing) },
    }).catch(() => {});

    return sendSuccess(res, null, 'Assignment removed — this institution now falls back to its standard module access');
  } catch (err) {
    next(err);
  }
};

/** Every institution, annotated with whether this module is already assigned — feeds
 * the "Assign to Institution" picker so it never offers an institution twice. */
const getAssignableInstitutions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [institutions, assignments] = await Promise.all([
      prisma.institution.findMany({ select: { id: true, name: true, code: true, type: true }, orderBy: { name: 'asc' } }),
      prisma.institutionModuleAssignment.findMany({ where: { moduleId: id }, select: { institutionId: true, status: true } }),
    ]);
    const assignedMap = new Map(assignments.map((a) => [a.institutionId, a.status]));
    const result = institutions.map((i) => ({ ...i, assignmentStatus: assignedMap.get(i.id) || null }));
    return sendSuccess(res, result, 'Institutions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getModules, getModuleById, createModule, updateModule, updateModuleStatus,
  createModuleVersion, addModuleDependency, removeModuleDependency,
  assignModuleToInstitution, updateModuleAssignment, removeModuleAssignment,
  getAssignableInstitutions, getManifest,
};
