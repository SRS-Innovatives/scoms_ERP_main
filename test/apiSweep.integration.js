/**
 * Live API sweep — every GET endpoint of all 4 backends, called as a real seeded user.
 *
 * Starts the Super Admin, Institute Admin, Staff and Student apps in-process against the
 * DATABASE_URL in .env, signs tokens for seeded users (Super Admin, Institute Admin,
 * Teacher, Student, Parent), then calls every GET route:
 *   - routes with :params get a random UUID → must answer 4xx, never crash (5xx)
 *   - a 5xx = BROKEN; a slow response (> 3s) is reported too
 * Read-only: only GET requests are sent.
 *
 * Run: node test/apiSweep.integration.js [--json]
 */
require('dotenv').config();
process.env.RBAC_ENFORCEMENT_ENABLED = process.env.RBAC_ENFORCEMENT_ENABLED || 'true';

const path = require('path');
const { prisma, generateAccessToken, ROLES } = require('../shared');

const ROOT = path.resolve(__dirname, '..');
const FAKE_ID = '00000000-0000-4000-8000-000000000000';
const SLOW_MS = 3000;

const collectRoutes = (stack, base = '', out = []) => {
  for (const layer of stack) {
    if (layer.route) {
      if (layer.route.methods.get) [].concat(layer.route.path).forEach((p) => out.push(base + p));
    } else if (layer.name === 'router' && layer.handle?.stack) collectRoutes(layer.handle.stack, base, out);
  }
  return out;
};

const listen = (app) => new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });

const tokenFor = async (where, extra = (u) => ({})) => {
  const u = await prisma.user.findFirst({
    where,
    include: { staff: { select: { id: true } }, student: { select: { id: true } }, parent: { select: { id: true } } },
  });
  if (!u) return null;
  return {
    email: u.email,
    token: generateAccessToken({
      id: u.id, email: u.email, role: u.role, institutionId: u.institutionId,
      ...(u.staff && { staffId: u.staff.id }), ...(u.student && { studentId: u.student.id }), ...(u.parent && { parentId: u.parent.id }),
      ...extra(u),
    }),
  };
};

(async () => {
  const json = process.argv.includes('--json');
  const log = (...a) => { if (!json) console.log(...a); };

  const users = {
    superAdmin: await tokenFor({ role: ROLES.SUPER_ADMIN }),
    instituteAdmin: await tokenFor({ role: ROLES.INSTITUTE_ADMIN, institution: { name: { not: { startsWith: 'Test ' } } } }),
    teacher: await tokenFor({ role: ROLES.TEACHER, staff: { isNot: null } }),
    student: await tokenFor({ role: ROLES.STUDENT, student: { isNot: null } }),
    parent: await tokenFor({ role: ROLES.PARENT, parent: { students: { some: {} } } }),
  };

  const targets = [
    { portal: 'Super Admin', backend: 'SuperAdmin_Backend', prefix: '/api/v1/super-admin', as: ['superAdmin'] },
    { portal: 'Institute Admin', backend: 'IntituteAdmin_Backend', prefix: '/api/v1/admin', as: ['instituteAdmin'] },
    { portal: 'Staff', backend: 'Staff_backend', prefix: '/api/v1/staff', as: ['teacher'] },
    { portal: 'Student', backend: 'Student_Backend', prefix: '/api/v1/student', as: ['student', 'parent'] },
  ];

  const results = [];
  for (const t of targets) {
    const app = require(path.join(ROOT, t.backend, 'src', 'app'));
    const router = require(path.join(ROOT, t.backend, 'src', 'routes', 'apiRoutes'));
    const server = await listen(app);
    const base = `http://127.0.0.1:${server.address().port}`;
    const routes = [...new Set(collectRoutes(router.stack))];
    log(`\n=== ${t.portal}: ${routes.length} GET routes`);

    for (const who of t.as) {
      const u = users[who];
      if (!u) { log(`  ⚠ no seeded ${who} user — skipped`); continue; }
      const counts = {};
      for (const r of routes) {
        const url = t.prefix + r.replace(/:[A-Za-z_]+\??/g, FAKE_ID);
        const started = Date.now();
        let status;
        let message = '';
        try {
          const res = await fetch(base + url, { headers: { Authorization: `Bearer ${u.token}` }, signal: AbortSignal.timeout(20000) });
          status = res.status;
          if (status >= 400) message = (await res.json().catch(() => ({}))).message || '';
        } catch (err) {
          status = 'TIMEOUT/ERROR';
          message = err.message;
        }
        const ms = Date.now() - started;
        const bucket = typeof status === 'number' ? `${String(status)[0]}xx` : status;
        counts[bucket] = (counts[bucket] || 0) + 1;
        const broken = status === 'TIMEOUT/ERROR' || status >= 500;
        results.push({ portal: t.portal, as: who, route: r, status, ms, broken, slow: ms > SLOW_MS, message });
        if (broken) log(`  ❌ [${who}] GET ${t.prefix}${r} → ${status} ${message}`);
        else if (ms > SLOW_MS) log(`  🐢 [${who}] GET ${t.prefix}${r} → ${status} in ${ms} ms`);
      }
      log(`  [${who}] ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
    }
    server.close();
  }

  await prisma.$disconnect();
  const broken = results.filter((r) => r.broken);
  if (json) console.log(JSON.stringify({ users: Object.fromEntries(Object.entries(users).map(([k, v]) => [k, v?.email || null])), results }, null, 2));
  else log(broken.length ? `\n❌ ${broken.length} endpoint call(s) crashed with a server error.` : '\n🎉 No GET endpoint crashed for any role.');
  process.exit(broken.length ? 1 : 0);
})();
