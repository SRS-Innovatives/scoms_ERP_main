/**
 * App Module Access (Super Admin → Institutions → App Module Access)
 *
 * Locks in:
 *   1. the catalog only references real institution modules and real Student API routes,
 *   2. every Student API route gated by requireModule('x') belongs to an app module that
 *      requires the same 'x' — so the app hides a feature exactly when the server would
 *      refuse it anyway, and Super Admin can't leave a gated route uncovered,
 *   3. path → module matching (longest prefix, core paths, open routes),
 *   4. the visibility rule: role applicability AND institution module AND not hidden,
 *   5. requireAppModule() answers 403 APP_MODULE_HIDDEN only for hidden modules.
 *
 * No database: the two Prisma reads the resolver makes are stubbed.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED; // legacy Institution.modules path

const prisma = require('../shared/database/client');
const { OPTIONAL_MODULE_KEYS } = require('../shared/constants/institutionModules');
const { ROLES } = require('../shared/constants/roles');
const { APPS, findModuleForPath } = require('../shared/appModules/catalog');
const { resolveAppModules, isAppModuleVisible } = require('../shared/appModules/resolveAppModules');
const { invalidate } = require('../shared/utils/hotCache');

let failures = 0;
const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push(`  ok   ${name}`);
  } catch (err) {
    failures += 1;
    results.push(`  FAIL ${name}\n       ${err.message}`);
  }
};

const app = APPS.STUDENT_APP;
const routesSrc = fs.readFileSync(path.join(__dirname, '../Student_Backend/src/routes/apiRoutes.js'), 'utf8');
// Prefix-wide gates: router.use('/fees', requireModule('fee'))
const PREFIX_GATES = [...routesSrc.matchAll(/router\.use\('([^']+)',\s*requireModule\('([^']+)'\)\)/g)].map((m) => ({ prefix: m[1], requires: m[2] }));
const ROUTES = [...routesSrc.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'([^\n]*)/g)].map((m) => {
  const own = (m[3].match(/requireModule\('([^']+)'\)/) || [])[1] || null;
  const gate = PREFIX_GATES.find((g) => m[2] === g.prefix || m[2].startsWith(`${g.prefix}/`));
  return { method: m[1], path: m[2], requires: own || gate?.requires || null };
});

// --- Stubbed DB state -------------------------------------------------------------
let institutionModules = null; // null = legacy "all enabled"
let hiddenRows = [];
prisma.institution.findUnique = async () => ({ modules: institutionModules });
prisma.institutionAppModuleSetting.findMany = async ({ where }) =>
  hiddenRows.filter((r) => r.institutionId === where.institutionId && r.app === where.app && (where.visible === undefined || r.visible === where.visible));
const setState = (mods, hidden) => {
  institutionModules = mods;
  hiddenRows = hidden.map(([role, moduleKey]) => ({ institutionId: 'inst-1', app: 'STUDENT_APP', role, moduleKey, visible: false }));
  invalidate('institutionModules');
  invalidate('appModuleSettings');
};

(async () => {
  await test('catalog keys are unique', () => {
    const keys = app.modules.map((m) => m.key);
    assert.strictEqual(new Set(keys).size, keys.length);
  });

  await test('every `requires` is a real institution module key', () => {
    const bad = app.modules.filter((m) => m.requires && !OPTIONAL_MODULE_KEYS.includes(m.requires)).map((m) => `${m.key} → ${m.requires}`);
    assert.deepStrictEqual(bad, []);
  });

  await test('every catalog route prefix matches at least one real Student API route', () => {
    const bad = [];
    app.modules.forEach((m) => m.routes.forEach((prefix) => {
      if (!ROUTES.some((r) => r.path === prefix || r.path.startsWith(`${prefix}/`))) bad.push(`${m.key}: ${prefix}`);
    }));
    assert.deepStrictEqual(bad, []);
  });

  await test("every requireModule('x') route belongs to an app module that requires 'x'", () => {
    assert.ok(ROUTES.length > 50 && ROUTES.filter((r) => r.requires).length > 10, 'route parser found the gated routes');
    const openRoutes = new Set(app.modules.flatMap((m) => m.openRoutes || [])); // deliberately never app-gated
    const bad = ROUTES.filter((r) => r.requires && !openRoutes.has(r.path)).filter((r) => {
      const mod = findModuleForPath('STUDENT_APP', r.path.replace(/:[^/]+/g, 'x'));
      return !mod || mod.requires !== r.requires;
    }).map((r) => `${r.method.toUpperCase()} ${r.path} requires ${r.requires}`);
    assert.deepStrictEqual(bad, []);
  });

  await test('every module key the student app has a screen for exists in the STUDENT_APP catalog', () => {
    const src = fs.readFileSync(path.join(__dirname, '../scoms-app-student/src/navigation/moduleKeys.ts'), 'utf8');
    const block = src.match(/MODULE_KEYS = \{([\s\S]*?)\} as const/);
    assert.ok(block, 'MODULE_KEYS found in moduleKeys.ts');
    const appKeys = [...block[1].matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);
    assert.ok(appKeys.length > 0);
    const catalogKeys = app.modules.map((m) => m.key);
    assert.deepStrictEqual(appKeys.filter((k) => !catalogKeys.includes(k)), []);
    // and the app's legacy fallback must point at the same institution module as the catalog
    const legacy = src.match(/LEGACY_REQUIRES[^=]*= \{([\s\S]*?)\};/);
    [...legacy[1].matchAll(/(\w+):\s*(?:'([^']+)'|null)/g)].forEach(([, key, req]) => {
      assert.strictEqual(req || null, app.modules.find((m) => m.key === key)?.requires ?? null, `LEGACY_REQUIRES.${key}`);
    });
  });

  await test('path matching: longest prefix, core paths, open routes', () => {
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/profile/id-card')?.key, 'id_card');
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/profile'), null);
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/auth/me'), null);
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/notifications'), null);
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/parent/children'), null);
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/fees/pay/initiate')?.key, 'fees');
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/fees/pay/verify'), null, 'in-flight payments must still verify');
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/feesx'), null);
    assert.strictEqual(findModuleForPath('STUDENT_APP', '/circulars/abc')?.key, 'announcements');
  });

  await test('nothing configured + legacy institution → every role-applicable module visible', async () => {
    setState(null, []);
    const student = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.STUDENT });
    const forStudent = (k) => app.modules.find((m) => m.key === k).roles.includes(ROLES.STUDENT);
    assert.ok(student.filter((m) => forStudent(m.key)).every((m) => m.visible), 'all student modules visible');
    assert.ok(student.filter((m) => !forStudent(m.key)).every((m) => m.reason === 'NOT_FOR_ROLE'), 'parent-only modules are NOT_FOR_ROLE');
    const parent = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.PARENT });
    assert.strictEqual(parent.find((m) => m.key === 'ai_tutor').reason, 'NOT_FOR_ROLE');
    assert.strictEqual(parent.find((m) => m.key === 'fees').visible, true);
  });

  await test('institution module off → app module off with reason', async () => {
    setState(['attendance', 'timetable'], []);
    const mods = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.STUDENT });
    assert.strictEqual(mods.find((m) => m.key === 'attendance').visible, true);
    assert.strictEqual(mods.find((m) => m.key === 'fees').reason, 'INSTITUTION_MODULE_DISABLED');
    assert.strictEqual(mods.find((m) => m.key === 'leave').visible, true, 'core-dependency modules stay on');
  });

  await test('study materials are visible to parents by default; defaultHiddenFor still works', async () => {
    setState(null, []);
    const ctx = { institutionId: 'inst-1', appKey: 'STUDENT_APP', moduleKey: 'materials' };
    assert.strictEqual(await isAppModuleVisible({ ...ctx, role: ROLES.PARENT }), true, 'parent default on');
    assert.strictEqual(await isAppModuleVisible({ ...ctx, role: ROLES.STUDENT }), true, 'student default on');
    // the mechanism itself: a module marked defaultHiddenFor PARENT starts hidden, an override shows it
    const mod = app.modules.find((m) => m.key === 'gallery');
    mod.defaultHiddenFor = [ROLES.PARENT];
    const g = { ...ctx, moduleKey: 'gallery' };
    assert.strictEqual(await isAppModuleVisible({ ...g, role: ROLES.PARENT }), false, 'default off');
    assert.strictEqual(await isAppModuleVisible({ ...g, role: ROLES.STUDENT }), true);
    hiddenRows = [{ institutionId: 'inst-1', app: 'STUDENT_APP', role: ROLES.PARENT, moduleKey: 'gallery', visible: true }];
    invalidate('appModuleSettings');
    assert.strictEqual(await isAppModuleVisible({ ...g, role: ROLES.PARENT }), true, 'override turns it on');
    delete mod.defaultHiddenFor;
  });

  await test('hidden for PARENT only does not affect STUDENT', async () => {
    setState(null, [[ROLES.PARENT, 'fees']]);
    assert.strictEqual(await isAppModuleVisible({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.PARENT, moduleKey: 'fees' }), false);
    assert.strictEqual(await isAppModuleVisible({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.STUDENT, moduleKey: 'fees' }), true);
  });

  await test('requireAppModule: 403 APP_MODULE_HIDDEN for hidden, pass-through for core / visible / no token', async () => {
    setState(null, [[ROLES.STUDENT, 'library']]);
    const jwt = require('../shared/auth/jwt');
    const sign = jwt.generateAccessToken || jwt.signAccessToken;
    assert.ok(sign, 'shared/auth/jwt exposes an access-token signer');
    const token = sign({ id: 'u1', role: ROLES.STUDENT, institutionId: 'inst-1' });
    const requireAppModule = require('../shared/appModules/requireAppModule');
    const mw = requireAppModule('STUDENT_APP');
    const run = (p, auth = true) => new Promise((resolve) => {
      const req = { method: 'GET', path: p, headers: auth ? { authorization: `Bearer ${token}` } : {} };
      mw(req, {}, (err) => resolve(err || null));
    });
    const hiddenErr = await run('/library');
    assert.ok(hiddenErr && hiddenErr.code === 'APP_MODULE_HIDDEN' && hiddenErr.statusCode === 403, 'library blocked');
    assert.strictEqual(await run('/attendance'), null, 'visible module passes');
    assert.strictEqual(await run('/auth/me'), null, 'core passes');
    assert.strictEqual(await run('/library', false), null, 'no token → left to the router 401');
  });

  console.log('App module visibility');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
