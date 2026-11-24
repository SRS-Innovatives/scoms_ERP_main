/**
 * Super Admin — Institutions → App Module Access.
 * Which modules each role sees in each mobile app, per institution. Settings are per
 * catalog column: one per role in the Student / Parent app, one "All staff" column in the
 * Staff app (the module's own role list then decides which staff roles get it). Catalog and
 * resolution: shared/appModules/. Enforced on the mobile gateway by requireAppModule().
 *
 * Only settings that differ from the catalog default are stored (a hidden row for a module
 * that starts visible, a visible row for one in `defaultHiddenFor`). Saving replaces the
 * institution's full set for that app in one transaction, so the stored rows always equal
 * what the page showed.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, appModules } = require('../../../shared');
const { APPS, getApp, getInstitutionEnabledModules, isDefaultVisible, isApplicableToColumn } = appModules;

const appOrThrow = (appKey) => {
  const app = getApp(appKey);
  if (!app) throw new ValidationError(`Unknown app "${appKey}". Expected one of: ${Object.keys(APPS).join(', ')}`);
  return app;
};

/** GET /app-modules/catalog — the apps, their roles and their module lists */
const getAppModuleCatalog = async (req, res, next) => {
  try {
    const data = Object.values(APPS).map((a) => ({
      key: a.key,
      label: a.label,
      roles: a.roles,
      columns: a.columns.map(({ key, label, roles }) => ({ key, label, roles })),
      modules: a.modules.map(({ key, label, group, requires, roles, defaultHidden, defaultHiddenFor }) => ({
        key, label, group, requires, roles, defaultHidden: !!defaultHidden, defaultHiddenFor: defaultHiddenFor || [],
      })),
    }));
    return sendSuccess(res, data, 'App module catalog retrieved');
  } catch (err) {
    next(err);
  }
};

const buildMatrix = async (institutionId, app) => {
  const [enabledModules, rows] = await Promise.all([
    getInstitutionEnabledModules(institutionId),
    prisma.institutionAppModuleSetting.findMany({
      where: { institutionId, app: app.key },
      select: { role: true, moduleKey: true, visible: true, updatedAt: true },
    }),
  ]);
  const overrides = new Map(rows.map((r) => [`${r.role}:${r.moduleKey}`, r.visible]));
  const shown = (m, col) => {
    const o = overrides.get(`${col}:${m.key}`);
    return o === undefined ? isDefaultVisible(m, col) : o;
  };
  const lastUpdatedAt = rows.reduce((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), null);

  return {
    app: app.key,
    label: app.label,
    // `roles` = the setting column keys (kept under this name for older page builds)
    roles: app.columns.map((c) => c.key),
    columns: app.columns.map(({ key, label, roles }) => ({ key, label, roles })),
    lastUpdatedAt,
    modules: app.modules.map((m) => ({
      key: m.key,
      label: m.label,
      group: m.group,
      requires: m.requires,
      forRoles: m.roles, // which roles inside the app actually get it
      institutionEnabled: !m.requires || enabledModules.includes(m.requires),
      roles: Object.fromEntries(
        app.columns.map((col) => {
          const applicable = isApplicableToColumn(m, col);
          return [col.key, {
            applicable,
            visible: applicable && shown(m, col.key),
            defaultVisible: applicable && isDefaultVisible(m, col.key),
          }];
        }),
      ),
    })),
  };
};

/** GET /institutions/:id/app-modules?app=STUDENT_APP */
const getInstitutionAppModules = async (req, res, next) => {
  try {
    const app = appOrThrow(req.query.app || 'STUDENT_APP');
    const institution = await prisma.institution.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!institution) throw new NotFoundError('Institution not found');
    return sendSuccess(res, await buildMatrix(institution.id, app), 'App module access retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /institutions/:id/app-modules
 * { app: 'STUDENT_APP', hidden: [{ role: 'PARENT', moduleKey: 'fees' }, ...] }
 * { app: 'STAFF_APP',   hidden: [{ role: 'ALL_STAFF', moduleKey: 'messages' }, ...] }
 * `role` is a setting column key. `hidden` is the complete list — anything not in it becomes visible.
 */
const updateInstitutionAppModules = async (req, res, next) => {
  try {
    const app = appOrThrow(req.body.app);
    const { hidden } = req.body;
    if (!Array.isArray(hidden)) throw new ValidationError('hidden must be an array of { role, moduleKey }');

    const errors = [];
    const unique = new Map();
    hidden.forEach((h, i) => {
      const mod = app.modules.find((m) => m.key === h?.moduleKey);
      if (!mod) return errors.push(`hidden[${i}]: unknown module "${h?.moduleKey}"`);
      const col = app.columns.find((c) => c.key === h.role);
      if (!col) return errors.push(`hidden[${i}]: "${h.role}" is not a ${app.label} column (${app.columns.map((c) => c.key).join(', ')})`);
      if (!isApplicableToColumn(mod, col)) return null; // not applicable to that column anyway — nothing to store
      unique.set(`${h.role}:${mod.key}`, { role: h.role, moduleKey: mod.key });
      return null;
    });
    if (errors.length) throw new ValidationError(errors.join('; '));

    const institutionId = req.params.id;
    const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { id: true } });
    if (!institution) throw new NotFoundError('Institution not found');

    const before = await prisma.institutionAppModuleSetting.findMany({
      where: { institutionId, app: app.key },
      select: { role: true, moduleKey: true, visible: true },
    });

    // Store only what differs from the catalog default: a hidden row for a module that
    // starts visible, a visible row for one that starts hidden (defaultHiddenFor).
    const next_ = [];
    app.modules.forEach((m) => {
      app.columns.filter((col) => isApplicableToColumn(m, col)).forEach((col) => {
        const visible = !unique.has(`${col.key}:${m.key}`);
        if (visible !== isDefaultVisible(m, col.key)) next_.push({ role: col.key, moduleKey: m.key, visible });
      });
    });

    await prisma.$transaction([
      prisma.institutionAppModuleSetting.deleteMany({ where: { institutionId, app: app.key } }),
      ...(next_.length
        ? [prisma.institutionAppModuleSetting.createMany({
            data: next_.map((h) => ({ institutionId, app: app.key, ...h, updatedById: req.user.id })),
          })]
        : []),
    ]);

    prisma.auditLog.create({
      data: {
        institutionId,
        userId: req.user.id,
        action: 'APP_MODULES_UPDATED',
        module: 'INSTITUTION',
        entity: 'InstitutionAppModuleSetting',
        entityId: `${institutionId}:${app.key}`,
        oldValues: JSON.stringify({ app: app.key, overrides: before }),
        newValues: JSON.stringify({ app: app.key, overrides: next_ }),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      },
    }).catch(() => {});

    return sendSuccess(res, await buildMatrix(institutionId, app), `${app.label} module access saved`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAppModuleCatalog, getInstitutionAppModules, updateInstitutionAppModules };
