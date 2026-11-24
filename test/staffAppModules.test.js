/**
 * Staff App module access (Super Admin → Institutions → App Module Access → Staff App)
 *
 * Locks in:
 *   1. the STAFF_APP catalog only references real institution modules and real Staff API routes,
 *   2. every Staff route gated by requireModule('x') belongs to an app module requiring 'x'
 *      (except /fee-desk, which is closed for every staff role),
 *   3. each module's roles actually hold the permission its routes check (no toggle that
 *      would only ever produce 403s),
 *   4. one ALL_STAFF setting hides a module for every staff role; role applicability still
 *      applies; Messages / SMS start hidden; Timetable is there for every staff role,
 *   5. the gateway gate, the Super Admin matrix + save, and the staff dashboard summary
 *      all honour it,
 *   6. the staff app's module keys (navigation/moduleKeys.ts) are real catalog keys.
 *
 * No database: Prisma reads/writes are stubbed.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED;
delete process.env.RBAC_ENFORCEMENT_ENABLED;

const prisma = require('../shared/database/client');
const { OPTIONAL_MODULE_KEYS } = require('../shared/constants/institutionModules');
const { ROLES } = require('../shared/constants/roles');
const { ROLE_PERMISSIONS } = require('../shared/permissions/permissionMatrix');
const { APPS, STAFF_ROLES, ALL_STAFF, findModuleForPath } = require('../shared/appModules/catalog');
const { resolveAppModules, isAppModuleVisible } = require('../shared/appModules/resolveAppModules');
const { invalidate } = require('../shared/utils/hotCache');
// The staff summary's approvals section asks who decides which section — no DB here
require('../shared/academic/teachingScope').getLeaveApprovalSectionIds = async () => [];

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

const app = APPS.STAFF_APP;
const routesSrc = fs.readFileSync(path.join(__dirname, '../Staff_backend/src/routes/apiRoutes.js'), 'utf8');
const PREFIX_GATES = [...routesSrc.matchAll(/router\.use\('([^']+)',\s*requireModule\('([^']+)'\)\)/g)].map((m) => ({ prefix: m[1], requires: m[2] }));
const ROUTES = [...routesSrc.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'([^\n]*)/g)].map((m) => {
  const own = (m[3].match(/requireModule\('([^']+)'\)/) || [])[1] || null;
  const gate = PREFIX_GATES.find((g) => m[2] === g.prefix || m[2].startsWith(`${g.prefix}/`));
  const perm = (m[3].match(/(?:shadowPermission|requirePermissionStrict)\(PERMISSIONS\.(\w+)\)/) || [])[1] || null;
  return { method: m[1], path: m[2], requires: own || gate?.requires || null, perm };
});
const NOT_IN_APP = ['/fee-desk']; // closed for every staff role on the server

// --- Stubbed DB state -------------------------------------------------------------
let institutionModules = null; // null = legacy "all enabled"
let rows = [];
prisma.institution.findUnique = async () => ({ id: 'inst-1', modules: institutionModules });
prisma.institutionAppModuleSetting.findMany = async ({ where }) =>
  rows.filter((r) => r.institutionId === where.institutionId && r.app === where.app).map((r) => ({ ...r, updatedAt: new Date() }));
const setState = (mods, hidden = []) => {
  institutionModules = mods;
  rows = hidden.map((moduleKey) => ({ institutionId: 'inst-1', app: 'STAFF_APP', role: ALL_STAFF, moduleKey, visible: false }));
  invalidate('institutionModules');
  invalidate('appModuleSettings');
};
const ctx = (role, moduleKey) => ({ institutionId: 'inst-1', appKey: 'STAFF_APP', role, moduleKey });

(async () => {
  await test('catalog keys unique, `requires` real, roles are staff roles', () => {
    const keys = app.modules.map((m) => m.key);
    assert.strictEqual(new Set(keys).size, keys.length, 'unique keys');
    assert.deepStrictEqual(app.modules.filter((m) => m.requires && !OPTIONAL_MODULE_KEYS.includes(m.requires)).map((m) => m.key), []);
    assert.deepStrictEqual(app.modules.filter((m) => !m.roles.length || m.roles.some((r) => !STAFF_ROLES.includes(r))).map((m) => m.key), []);
  });

  await test('every catalog route prefix matches a real Staff API route', () => {
    const bad = [];
    app.modules.forEach((m) => m.routes.forEach((prefix) => {
      if (!ROUTES.some((r) => r.path === prefix || r.path.startsWith(`${prefix}/`))) bad.push(`${m.key}: ${prefix}`);
    }));
    assert.deepStrictEqual(bad, []);
  });

  await test("every requireModule('x') Staff route belongs to an app module that requires 'x'", () => {
    assert.ok(ROUTES.length > 100 && ROUTES.filter((r) => r.requires).length > 50, 'route parser found the gated routes');
    const bad = ROUTES
      .filter((r) => r.requires && !NOT_IN_APP.some((p) => r.path.startsWith(p)))
      .filter((r) => {
        const mod = findModuleForPath('STAFF_APP', r.path.replace(/:[^/]+/g, 'x'));
        return !mod || mod.requires !== r.requires;
      })
      .map((r) => `${r.method.toUpperCase()} ${r.path} requires ${r.requires}`);
    assert.deepStrictEqual(bad, []);
  });

  await test('each module role holds the permission of at least one of its routes', () => {
    const { PERMISSIONS } = require('../shared/constants/roles');
    const bad = [];
    app.modules.forEach((m) => {
      const perms = ROUTES.filter((r) => findModuleForPath('STAFF_APP', r.path.replace(/:[^/]+/g, 'x'))?.key === m.key).map((r) => r.perm);
      if (perms.some((p) => p === null)) return; // an ungated route — any staff role can use it
      m.roles.forEach((role) => {
        const has = perms.some((p) => (ROLE_PERMISSIONS[role] || []).includes(PERMISSIONS[p]));
        if (!has) bad.push(`${m.key}: ${role}`);
      });
    });
    assert.deepStrictEqual(bad, []);
  });

  await test('path matching: longest prefix, core, own attendance vs student attendance', () => {
    assert.strictEqual(findModuleForPath('STAFF_APP', '/attendance/self')?.key, 'my_attendance');
    assert.strictEqual(findModuleForPath('STAFF_APP', '/attendance/mark')?.key, 'attendance');
    assert.strictEqual(findModuleForPath('STAFF_APP', '/attendance-corrections/x/review')?.key, 'attendance');
    assert.strictEqual(findModuleForPath('STAFF_APP', '/timetable/substitutes/mine')?.key, 'timetable');
    assert.strictEqual(findModuleForPath('STAFF_APP', '/circulars/abc')?.key, 'announcements');
    assert.strictEqual(findModuleForPath('STAFF_APP', '/dashboard/summary'), null);
    assert.strictEqual(findModuleForPath('STAFF_APP', '/profile/me'), null);
    assert.strictEqual(findModuleForPath('STAFF_APP', '/notifications'), null);
    assert.strictEqual(findModuleForPath('STAFF_APP', '/auth/me'), null);
  });

  await test('defaults: Timetable for every staff role; Messages / SMS start hidden; role applicability', async () => {
    setState(null);
    for (const role of STAFF_ROLES) {
      assert.strictEqual(await isAppModuleVisible(ctx(role, 'timetable')), true, `timetable for ${role}`);
      assert.strictEqual(await isAppModuleVisible(ctx(role, 'leave')), true, `leave for ${role}`);
    }
    assert.strictEqual(await isAppModuleVisible(ctx(ROLES.TEACHER, 'messages')), false, 'messages default off');
    assert.strictEqual(await isAppModuleVisible(ctx(ROLES.TEACHER, 'sms')), false, 'sms default off');
    const lib = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STAFF_APP', role: ROLES.LIBRARIAN });
    assert.strictEqual(lib.find((m) => m.key === 'library').visible, true);
    assert.strictEqual(lib.find((m) => m.key === 'homework').reason, 'NOT_FOR_ROLE');
    const teacher = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STAFF_APP', role: ROLES.TEACHER });
    assert.strictEqual(teacher.find((m) => m.key === 'ptm').visible, true, 'teachers log PTM notes');
    assert.strictEqual(teacher.find((m) => m.key === 'exam_setup').reason, 'NOT_FOR_ROLE', 'exam setup is Exam Admin only');
    const student = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STAFF_APP', role: ROLES.STUDENT });
    assert.ok(student.every((m) => !m.visible), 'a non-staff role sees nothing');
  });

  await test('one ALL_STAFF row hides the module for every staff role; institution module off wins', async () => {
    setState(null, ['timetable']);
    for (const role of STAFF_ROLES) assert.strictEqual(await isAppModuleVisible(ctx(role, 'timetable')), false, role);
    assert.strictEqual(await isAppModuleVisible(ctx(ROLES.TEACHER, 'attendance')), true);
    setState(['attendance']);
    const mods = await resolveAppModules({ institutionId: 'inst-1', appKey: 'STAFF_APP', role: ROLES.TEACHER });
    assert.strictEqual(mods.find((m) => m.key === 'timetable').reason, 'INSTITUTION_MODULE_DISABLED');
    assert.strictEqual(mods.find((m) => m.key === 'attendance').visible, true);
  });

  await test('student app settings are untouched by staff rows (per-role columns still work)', async () => {
    setState(null, ['attendance']);
    assert.strictEqual(await isAppModuleVisible({ institutionId: 'inst-1', appKey: 'STUDENT_APP', role: ROLES.STUDENT, moduleKey: 'attendance' }), true);
  });

  await test('gateway gate: 403 APP_MODULE_HIDDEN for a hidden staff module, core passes', async () => {
    setState(null, ['library']);
    const jwt = require('../shared/auth/jwt');
    const sign = jwt.generateAccessToken || jwt.signAccessToken;
    const token = sign({ id: 'u1', role: ROLES.LIBRARIAN, institutionId: 'inst-1' });
    const mw = require('../shared/appModules/requireAppModule')('STAFF_APP');
    const run = (p) => new Promise((resolve) => {
      mw({ method: 'GET', path: p, headers: { authorization: `Bearer ${token}` } }, {}, (err) => resolve(err || null));
    });
    const err = await run('/library/books');
    assert.ok(err && err.code === 'APP_MODULE_HIDDEN' && err.statusCode === 403, 'library blocked');
    assert.strictEqual(await run('/timetable/my'), null, 'timetable passes');
    assert.strictEqual(await run('/dashboard/summary'), null, 'core passes');
  });

  await test('Super Admin matrix: one All-staff column, forRoles, default-off; save stores only differences', async () => {
    setState(null);
    const ctrl = require('../SuperAdmin_Backend/src/controllers/appModuleController');
    const call = (fn, req) => new Promise((resolve, reject) => {
      const res = { status() { return this; }, json: (body) => resolve(body) };
      fn(req, res, reject);
    });
    const got = await call(ctrl.getInstitutionAppModules, { params: { id: 'inst-1' }, query: { app: 'STAFF_APP' } });
    const m = got.data;
    assert.deepStrictEqual(m.roles, [ALL_STAFF]);
    assert.strictEqual(m.columns[0].label, 'All staff');
    const tt = m.modules.find((x) => x.key === 'timetable');
    assert.deepStrictEqual(tt.forRoles, STAFF_ROLES);
    assert.strictEqual(tt.roles[ALL_STAFF].visible, true);
    assert.strictEqual(m.modules.find((x) => x.key === 'messages').roles[ALL_STAFF].defaultVisible, false);

    let written = null;
    prisma.institutionAppModuleSetting.deleteMany = (a) => ({ op: 'delete', a });
    prisma.institutionAppModuleSetting.createMany = ({ data }) => { written = data; return { op: 'create' }; };
    prisma.$transaction = async (ops) => ops;
    prisma.auditLog.create = () => Promise.resolve();
    // hide timetable; leave messages hidden (= its default) → only the timetable row is stored
    await call(ctrl.updateInstitutionAppModules, {
      params: { id: 'inst-1' },
      body: { app: 'STAFF_APP', hidden: [{ role: ALL_STAFF, moduleKey: 'timetable' }, { role: ALL_STAFF, moduleKey: 'messages' }, { role: ALL_STAFF, moduleKey: 'sms' }] },
      user: { id: 'sa-1' }, ip: '', get: () => '',
    });
    assert.deepStrictEqual(written.map((w) => `${w.role}:${w.moduleKey}:${w.visible}`), [`${ALL_STAFF}:timetable:false`]);

    const bad = await call(ctrl.updateInstitutionAppModules, {
      params: { id: 'inst-1' }, body: { app: 'STAFF_APP', hidden: [{ role: ROLES.TEACHER, moduleKey: 'timetable' }] }, user: { id: 'sa-1' }, ip: '', get: () => '',
    }).then(() => null, (e) => e);
    assert.ok(bad && /column/.test(bad.message), 'a per-role row is rejected for the staff app');
  });

  await test('staff dashboard summary drops sections whose app module is hidden (mobile only)', async () => {
    setState(null, ['timetable']);
    const { getDashboardSummary } = require('../Staff_backend/src/controllers/dashboardSummaryController');
    prisma.timetableEntry.findMany = async () => [];
    prisma.assignment.count = async () => 0;
    prisma.assignmentSubmission.count = async () => 0;
    prisma.leaveRequest.groupBy = async () => [];
    prisma.notification.count = async () => 0;
    prisma.notification.findMany = async () => [];
    const call = (baseUrl) => new Promise((resolve, reject) => {
      getDashboardSummary(
        { baseUrl, query: {}, user: { id: 'u1', staffId: 's1', role: ROLES.TEACHER, institutionId: 'inst-1' } },
        { status() { return this; }, json: (b) => resolve(b.data) },
        reject,
      );
    });
    const mobile = await call('/api/v1/mobile/staff');
    assert.strictEqual(mobile.today, null, 'timetable hidden → no today section');
    assert.ok(mobile.homework && mobile.leave, 'others still there');
    const web = await call('/api/v1');
    assert.ok(web.today, 'web portal ignores app settings');
  });

  await test("every module key the staff app has a screen for exists in STAFF_APP", () => {
    const keys = app.modules.map((m) => m.key);
    const src = fs.readFileSync(path.join(__dirname, '../scoms-app-staff/src/navigation/moduleKeys.ts'), 'utf8');
    const block = src.match(/MODULE_KEYS = \{([\s\S]*?)\} as const/);
    assert.ok(block, 'MODULE_KEYS found in moduleKeys.ts');
    const used = [...block[1].matchAll(/:\s*'([^']+)'/g)].map((x) => x[1]);
    assert.ok(used.length >= 8);
    assert.deepStrictEqual(used.filter((k) => !keys.includes(k)), []);
  });

  console.log('Staff app modules');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
