/**
 * Student / Parent app: Homework, Study Materials, Gallery, Transport.
 *   1. a PARENT passes the permission checks of every read route the parent app uses
 *      (homework, materials, exam schedule / hall ticket) under RBAC enforcement, and the
 *      routes parents must not write to stay blocked,
 *   2. Study Materials start visible for parents,
 *   3. gallery albums carry the cover as a signed LINK, never the base64 image,
 *   4. transport returns only what a family needs (no licence / insurance details) plus
 *      today's trips for the bus.
 *
 * No database: Prisma calls are stubbed.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED;

const prisma = require('../shared/database/client');
const { ROLES, PERMISSIONS } = require('../shared/constants/roles');
const { ROLE_PERMISSIONS } = require('../shared/permissions/permissionMatrix');
const { APPS, findModuleForPath, isDefaultVisible } = require('../shared/appModules/catalog');

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
const call = (fn, req) => new Promise((resolve, reject) => {
  fn({ query: {}, params: {}, institutionId: 'inst-1', protocol: 'https', get: () => 'api.example', ...req }, { status() { return this; }, json: (b) => resolve(b) }, reject);
});

(async () => {
  await test('parents hold every permission the parent app read routes check', () => {
    const src = fs.readFileSync(path.join(__dirname, '../Student_Backend/src/routes/apiRoutes.js'), 'utf8');
    const bad = [];
    for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\('([^']+)'([^\n]*)/g)) {
      if (/blockParentWrite/.test(m[3])) continue; // deliberately student-only actions
      const perms = [...m[3].matchAll(/(?:shadowPermission|requirePermissionStrict)\(PERMISSIONS\.(\w+)\)/g)].map((x) => x[1]);
      const mod = findModuleForPath('STUDENT_APP', m[2].replace(/:[^/]+/g, 'x'));
      if (!perms.length || !mod || !mod.roles.includes(ROLES.PARENT)) continue;
      if (m[1] !== 'get' && !/opened/.test(m[2])) continue; // parent app is read-only here
      perms.filter((p) => !ROLE_PERMISSIONS[ROLES.PARENT].includes(PERMISSIONS[p])).forEach((p) => bad.push(`${m[1].toUpperCase()} ${m[2]} needs ${p}`));
    }
    assert.deepStrictEqual(bad, []);
    assert.ok(!ROLE_PERMISSIONS[ROLES.PARENT].includes(PERMISSIONS.ASSIGNMENTS_SUBMIT), 'parents still cannot submit homework');
  });

  await test('Study Materials, Gallery, Transport and Homework start visible for parents', () => {
    for (const key of ['materials', 'gallery', 'transport', 'homework']) {
      const mod = APPS.STUDENT_APP.modules.find((m) => m.key === key);
      assert.ok(mod.roles.includes(ROLES.PARENT), `${key} is for parents`);
      assert.ok(isDefaultVisible(mod, ROLES.PARENT), `${key} visible by default`);
    }
  });

  await test('gallery albums: cover is a signed link, base64 never loaded', async () => {
    const ctrl = require('../Student_Backend/src/controllers/galleryController');
    let args = null;
    prisma.galleryAlbum.findMany = async (a) => {
      args = a;
      return [
        { id: 'a1', title: 'Sports Day', description: null, category: 'SPORTS', createdAt: new Date(), photos: [{ id: 'p9' }], _count: { photos: 12 } },
        { id: 'a2', title: 'Empty', description: null, category: 'GENERAL', createdAt: new Date(), photos: [], _count: { photos: 0 } },
      ];
    };
    prisma.$queryRawUnsafe = async () => [{ id: 'p9', head: 'data:image/jpeg;base64,AAAA', len: 50000, ver: new Date('2026-01-01') }];
    const { data } = await call(ctrl.getAlbums, {});
    assert.deepStrictEqual(args.select.photos.select, { id: true }, 'only the cover photo id is read');
    assert.ok(/^https:\/\/api\.example\/api\/v1\/media\/gallery\/p9\?/.test(data[0].coverImage), `signed link, got ${data[0].coverImage}`);
    assert.strictEqual(data[0].photoCount, 12);
    assert.strictEqual(data[1].coverImage, null);
  });

  await test("transport: family-facing fields only, plus today's trips", async () => {
    const ctrl = require('../Student_Backend/src/controllers/campusController');
    let args = null;
    prisma.studentTransportMapping.findUnique = async (a) => {
      args = a;
      return { id: 'm1', pickupPoint: 'Gate 2', route: { id: 'r1', routeName: 'R-4', startPoint: 'A', endPoint: 'B', monthlyFare: 900, vehicle: { id: 'v1', vehicleNumber: 'TN01', vehicleType: 'BUS', driverName: 'Ravi', driverPhone: '999', gpsEnabled: false } } };
    };
    let tripWhere = null;
    prisma.vehicleTrip.findMany = async ({ where }) => { tripWhere = where; return [{ session: 'MORNING', status: 'COMPLETED', completedAt: new Date() }]; };
    const { data } = await call(ctrl.getMyTransport, { user: { studentId: 's1', role: ROLES.PARENT } });
    const vehicleSelect = args.select.route.select.vehicle.select;
    assert.ok(!('driverLicenseNumber' in vehicleSelect) && !('insuranceExpiryDate' in vehicleSelect) && !('fcExpiryDate' in vehicleSelect), 'no licence / insurance / FC details');
    assert.strictEqual(tripWhere.vehicleId, 'v1');
    assert.strictEqual(data.todayTrips.morning.status, 'COMPLETED');
    assert.strictEqual(data.todayTrips.evening, null);

    prisma.studentTransportMapping.findUnique = async () => null;
    const none = await call(ctrl.getMyTransport, { user: { studentId: 's2', role: ROLES.STUDENT } });
    assert.strictEqual(none.data, null, 'no transport → null');
  });

  console.log('Parent app modules');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
