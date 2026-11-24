/**
 * In-process cache for the lookups that run on (almost) EVERY authenticated request:
 *   - requireModule      → which modules an institution has enabled
 *   - shadowPermission / requirePermissionStrict → a role's RolePermissionOverride row
 *
 * Without it each API call paid 2+ extra database round trips before its controller
 * even started. These rows change only when a Super Admin edits them, so they are
 * cached briefly and dropped the moment Prisma writes to the table they came from
 * (the $use hook below). In the combined server (server/server.js) every portal shares
 * one process, so a toggle is visible instantly everywhere; when the backends run as
 * separate processes the TTL bounds staleness to HOT_CACHE_TTL_MS (default 60s).
 */
const prisma = require('../database/client');

const TTL_MS = Number(process.env.HOT_CACHE_TTL_MS || 60 * 1000);
const MAX_ENTRIES = 5000;

const stores = new Map(); // name -> Map(key -> { value, expires })

const getStore = (name) => {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
};

/** Returns the cached value for name/key, or computes it with loader() and caches it.
 * Concurrent misses for the same key share one in-flight promise (no thundering herd). */
const cached = async (name, key, loader) => {
  const store = getStore(name);
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const pending = Promise.resolve().then(loader);
  store.set(key, { value: pending, expires: Date.now() + TTL_MS });
  if (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
  try {
    return await pending;
  } catch (err) {
    store.delete(key); // never cache a failure
    throw err;
  }
};

const invalidate = (name) => getStore(name).clear();

// Prisma model → cache stores that are derived from it
const DEPENDENCIES = {
  Institution: ['institutionModules'],
  InstitutionModuleAssignment: ['institutionModules'],
  ModuleDefinition: ['institutionModules'],
  InstitutionAppModuleSetting: ['appModuleSettings'],
  ParentStudent: ['parentLinks'],
  SubjectTeacherMapping: ['teacherSections'],
  RolePermissionOverride: ['rolePermissions'],
  FeePolicy: ['feePolicy'],
  PlatformSetting: ['platformSettings'],
};
const WRITE_ACTIONS = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']);

if (!prisma.__hotCacheInvalidation) {
  prisma.$use(async (params, next) => {
    const result = await next(params);
    if (WRITE_ACTIONS.has(params.action) && DEPENDENCIES[params.model]) {
      DEPENDENCIES[params.model].forEach(invalidate);
    }
    return result;
  });
  prisma.__hotCacheInvalidation = true;
}

/** Drop-in for the `prisma` argument of hasPermissionAsync() — same call shape, but the
 * per-role override row comes from the cache. (permissionMatrix.js itself stays free of
 * server imports because the Super Admin frontend bundles it.) */
const cachedPermissionClient = {
  rolePermissionOverride: {
    findUnique: (args) => cached('rolePermissions', args.where.role, () => prisma.rolePermissionOverride.findUnique(args)),
  },
};

module.exports = { cached, invalidate, cachedPermissionClient };
