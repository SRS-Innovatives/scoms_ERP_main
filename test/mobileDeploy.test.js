/**
 * Mobile go-live wiring:
 *   1. the combined production server (server/app.js) serves /api/v1/mobile/* — the same
 *      router as the standalone gateway — and the gateway uses the ONE shared Prisma client,
 *   2. with the mobile routes loaded, push is delivered in-process (no HTTP / secret),
 *   3. release builds of both apps point at an https production origin, debug at the gateway,
 *   4. Android builds don't require google-services.json,
 *   5. HOD / Principal / VP can apply for their own leave.
 *
 * No database: Prisma calls are stubbed; nothing listens on a port.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const prisma = require('../shared/database/client');
const { ROLES, PERMISSIONS } = require('../shared/constants/roles');
const { ROLE_PERMISSIONS } = require('../shared/permissions/permissionMatrix');

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
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

/** Every path prefix an Express app / router serves, walking nested routers. */
const mountedPaths = (stack, prefix = '') => {
  const out = [];
  for (const layer of stack) {
    if (layer.route) out.push(prefix + layer.route.path);
    else if (layer.handle && layer.handle.stack) {
      const src = layer.regexp && layer.regexp.source;
      const m = src && src.match(/^\^\\\/(.*?)\\\/\?\(\?=/);
      const sub = m ? `/${m[1].replace(/\\\//g, '/')}` : '';
      out.push(...mountedPaths(layer.handle.stack, prefix + sub));
    }
  }
  return out;
};

(async () => {
  await test('production server serves the mobile API and the internal push route', () => {
    const app = require('../server/app');
    const paths = mountedPaths(app._router.stack);
    assert.ok(paths.some((p) => p.startsWith('/api/v1/mobile/student')), 'student app routes mounted');
    assert.ok(paths.some((p) => p.startsWith('/api/v1/mobile/staff')), 'staff app routes mounted');
    assert.ok(paths.includes('/api/v1/mobile/student/app-modules'), '/app-modules for the student app');
    assert.ok(paths.includes('/internal/push/dispatch'), 'internal push route');
    assert.ok(paths.some((p) => p.startsWith('/api/v1/student/')), 'web student routes still there');
  });

  await test('split production: each portal service serves its own app, and only that one', () => {
    const student = mountedPaths(require('../Student_Backend/src/app')._router.stack);
    const staff = mountedPaths(require('../Staff_backend/src/app')._router.stack);
    assert.ok(student.includes('/api/v1/mobile/student/app-modules'), 'Student backend serves the student / parent app');
    assert.ok(!student.some((p) => p.startsWith('/api/v1/mobile/staff')), 'not the staff app');
    assert.ok(staff.includes('/api/v1/mobile/staff/app-modules'), 'Staff backend serves the staff app');
    assert.ok(!staff.some((p) => p.startsWith('/api/v1/mobile/student')), 'not the student app');
    for (const b of ['IntituteAdmin_Backend', 'SuperAdmin_Backend']) {
      assert.ok(/mobileRoutes'\)\.enableLocalPush\(\)/.test(read(`${b}/src/app.js`)), `${b} pushes in-process`);
    }
  });

  await test('each app points at its own production service', () => {
    assert.ok(read('scoms-app-student/src/constants/config.ts').includes("PRODUCTION_API_ORIGIN = 'https://scoms-erp-main-3.onrender.com'"), 'student app → Student backend');
    assert.ok(read('scoms-app-staff/src/constants/config.ts').includes("PRODUCTION_API_ORIGIN = 'https://scoms-erp-main.onrender.com'"), 'staff app → Staff backend');
  });

  await test('the gateway uses the shared Prisma client (no stale generated copy)', () => {
    assert.strictEqual(require('../scoms-app-backend/src/database/client'), prisma);
    assert.ok(!fs.existsSync(path.join(__dirname, '../scoms-app-backend/prisma/schema.prisma')), 'stale schema copy removed');
  });

  await test('with the mobile routes loaded, push is delivered in-process', async () => {
    const { pushNotification, pushNotificationToMany } = require('../shared/utils/notificationCenter');
    const sent = [];
    prisma.notification.create = async ({ data }) => ({ id: 'n1', ...data });
    prisma.notification.createMany = async ({ data }) => ({ count: data.length });
    prisma.deviceToken.findMany = async ({ where }) => { sent.push(where.userId.in); return []; };
    const before = global.fetch;
    let httpCalls = 0;
    global.fetch = async () => { httpCalls += 1; return { ok: true }; };
    delete process.env.INTERNAL_PUSH_SECRET; // not needed in-process
    await pushNotification({ userId: 'u1', title: 'Hi', message: 'There' });
    await pushNotificationToMany({ userIds: ['u2', 'u3'], title: 'Hi', message: 'All' });
    await new Promise((r) => setTimeout(r, 20));
    global.fetch = before;
    assert.strictEqual(httpCalls, 0, 'no HTTP round trip');
    assert.deepStrictEqual(sent, [['u1'], ['u2', 'u3']], 'device tokens looked up for the recipients');
  });

  await test('release builds use an https production origin; debug builds the local gateway', () => {
    for (const [app, prefix] of [['scoms-app-student', 'student'], ['scoms-app-staff', 'staff']]) {
      const src = read(`${app}/src/constants/config.ts`);
      const origin = (src.match(/PRODUCTION_API_ORIGIN = '([^']+)'/) || [])[1];
      assert.ok(origin && origin.startsWith('https://'), `${app}: https production origin`);
      assert.ok(src.includes('__DEV__ ? DEV_API_ORIGIN : PRODUCTION_API_ORIGIN'), `${app}: release → production`);
      assert.ok(src.includes(`/api/v1/mobile/${prefix}\``), `${app}: mobile prefix`);
    }
  });

  await test('Android builds work without google-services.json', () => {
    for (const app of ['scoms-app-student', 'scoms-app-staff']) {
      const gradle = read(`${app}/android/app/build.gradle`);
      assert.ok(/if \(file\("google-services\.json"\)\.exists\(\)\) \{\s*apply plugin: "com\.google\.gms\.google-services"/.test(gradle), app);
    }
  });

  await test('HOD, Principal and Vice Principal can apply for their own leave', () => {
    for (const role of [ROLES.HOD, ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL]) {
      assert.ok(ROLE_PERMISSIONS[role].includes(PERMISSIONS.LEAVE_APPLY), role);
    }
  });

  console.log('Mobile go-live wiring');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
