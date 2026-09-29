/**
 * Module Registry — dual-path resolution (Phase 1).
 *
 * This is the ONLY new code requireModule() calls into. It never replaces
 * resolveEnabledModules() from shared/constants/institutionModules.js — that function
 * is untouched and still does exactly what it always did. This wraps it.
 *
 * Resolution order, checked fresh on every call (nothing cached):
 *   1. If MODULE_REGISTRY_ENABLED is not "true" → legacy path only. Full stop.
 *   2. If this exact institution has zero InstitutionModuleAssignment rows → legacy
 *      path only. An institution is never on the new system by accident — only real,
 *      explicitly-created assignment rows opt it in.
 *   3. Only if both of the above pass → the registry-derived set (ENABLED/TRIAL rows).
 *
 * Net effect: with the flag unset (the default) or for any institution that has never
 * been migrated, this function returns byte-identical output to calling
 * resolveEnabledModules(institution.modules) directly, always.
 */
const prisma = require('../database/client');
const { resolveEnabledModules } = require('../constants/institutionModules');

const isRegistryGloballyEnabled = () => process.env.MODULE_REGISTRY_ENABLED === 'true';

/** institution: the real row (must include at least { id, modules }) — never just an id,
 * so a caller can't accidentally skip the legacy fallback by passing a bare string. */
const resolveEnabledModulesForInstitution = async (institution) => {
  if (!institution) return [];
  if (!isRegistryGloballyEnabled()) {
    return resolveEnabledModules(institution.modules);
  }

  const assignments = await prisma.institutionModuleAssignment.findMany({
    where: { institutionId: institution.id, status: { in: ['ENABLED', 'TRIAL'] } },
    include: { module: { select: { key: true } } },
  });

  if (assignments.length === 0) {
    // Not migrated — legacy behavior, unchanged.
    return resolveEnabledModules(institution.modules);
  }

  return assignments.map((a) => a.module.key);
};

module.exports = { resolveEnabledModulesForInstitution, isRegistryGloballyEnabled };
