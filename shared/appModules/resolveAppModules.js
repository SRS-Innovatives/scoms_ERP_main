/**
 * Resolves which mobile-app modules a given role sees for a given institution.
 *
 * A module is visible only when ALL of these hold:
 *   1. the role is one the module is meant for (catalog `roles`),
 *   2. the institution has the module it depends on (catalog `requires`; null = always),
 *   3. Super Admin's setting for this institution/app/column says visible — an
 *      InstitutionAppModuleSetting row if one exists, otherwise the catalog default
 *      (visible, unless `defaultHidden` or the column is in `defaultHiddenFor`). The column
 *      is the role itself in the student app and ALL_STAFF in the staff app.
 *
 * Both lookups go through shared/utils/hotCache.js and are dropped the moment their
 * tables are written, so a Super Admin toggle takes effect on the next request.
 */
const prisma = require('../database/client');
const { cached } = require('../utils/hotCache');
const { resolveEnabledModulesForInstitution } = require('../moduleRegistry/resolveModules');
const { getApp, isDefaultVisible, columnForRole } = require('./catalog');

/** The institution's enabled optional-module keys — same cache entry requireModule() uses. */
const getInstitutionEnabledModules = (institutionId) =>
  cached('institutionModules', institutionId, async () => {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: { modules: true },
    });
    return resolveEnabledModulesForInstitution({ id: institutionId, modules: institution?.modules });
  });

/** Map `${role}:${moduleKey}` → visible, for every override Super Admin saved for this
 * institution + app. A key that's absent means "use the catalog default". */
const getOverrides = (institutionId, appKey) =>
  cached('appModuleSettings', `${institutionId}:${appKey}`, async () => {
    const rows = await prisma.institutionAppModuleSetting.findMany({
      where: { institutionId, app: appKey },
      select: { role: true, moduleKey: true, visible: true },
    });
    return new Map(rows.map((r) => [`${r.role}:${r.moduleKey}`, r.visible]));
  });

/** Whether Super Admin's setting (or the default) shows this module to a setting column
 * (a role in the student app; ALL_STAFF in the staff app — see catalog `columns`). */
const isShownBySetting = (mod, columnKey, overrides) => {
  const override = overrides.get(`${columnKey}:${mod.key}`);
  return override === undefined ? isDefaultVisible(mod, columnKey) : override;
};

/** Why a module is not visible, or null when it is. */
const visibilityReason = (app, mod, role, enabledModules, overrides) => {
  const column = columnForRole(app, role);
  if (!column || !mod.roles.includes(role)) return 'NOT_FOR_ROLE';
  if (mod.requires && !enabledModules.includes(mod.requires)) return 'INSTITUTION_MODULE_DISABLED';
  if (!isShownBySetting(mod, column.key, overrides)) return 'HIDDEN_BY_SUPER_ADMIN';
  return null;
};

/**
 * Every module in the app's catalog with its visibility for this role:
 *   [{ key, label, group, visible, reason }]
 */
const resolveAppModules = async ({ institutionId, appKey, role }) => {
  const app = getApp(appKey);
  if (!app) return [];
  if (!institutionId) {
    return app.modules.map((m) => ({ key: m.key, label: m.label, group: m.group, visible: false, reason: 'NO_INSTITUTION' }));
  }
  const [enabledModules, overrides] = await Promise.all([
    getInstitutionEnabledModules(institutionId),
    getOverrides(institutionId, appKey),
  ]);
  return app.modules.map((m) => {
    const reason = visibilityReason(app, m, role, enabledModules, overrides);
    return { key: m.key, label: m.label, group: m.group, visible: reason === null, reason };
  });
};

/** Whether one module is visible — used per request by requireAppModule(). */
const isAppModuleVisible = async ({ institutionId, appKey, role, moduleKey }) => {
  const app = getApp(appKey);
  const mod = app?.modules.find((m) => m.key === moduleKey);
  if (!mod || !institutionId) return false;
  const [enabledModules, overrides] = await Promise.all([
    getInstitutionEnabledModules(institutionId),
    getOverrides(institutionId, appKey),
  ]);
  return visibilityReason(app, mod, role, enabledModules, overrides) === null;
};

module.exports = {
  resolveAppModules,
  isAppModuleVisible,
  getInstitutionEnabledModules,
  getOverrides,
  isShownBySetting,
};
