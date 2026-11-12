/**
 * WRITE sweep — finds "Internal server error" on save, across every module.
 *
 * Creates a THROWAWAY institution (admin, teacher, student), then calls every
 * POST / PUT / PATCH route of the Institute Admin, Staff and Student APIs twice:
 *   1. with an empty body {}
 *   2. as a "blank form": every field the handler reads from req.body, sent as '' —
 *      exactly what a screen sends for inputs the user left untouched
 * A 5xx means that screen's Save/Submit crashes instead of telling the user what's wrong.
 * Everything the throwaway institution created is deleted at the end.
 * (Super Admin writes are skipped: they would create platform-wide records.)
 *
 * Run: node test/writeSweep.integration.js
 */
require('dotenv').config();
process.env.NODE_ENV = 'development'; // real error messages in responses
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const path = require('path');
const { prisma, generateAccessToken, ROLES, hashPassword } = require('../shared');
const { Prisma } = require('@prisma/client');

const ROOT = path.resolve(__dirname, '..');
const RUN = `WS${Date.now().toString(36).toUpperCase()}`;
const FAKE_ID = '00000000-0000-4000-8000-000000000000';

const routesOf = (stack, out = []) => {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).filter((m) => ['post', 'put', 'patch'].includes(m));
      const handler = layer.route.stack.at(-1)?.handle;
      for (const p of [].concat(layer.route.path)) for (const m of methods) out.push({ method: m.toUpperCase(), path: p, handler });
    } else if (layer.name === 'router' && layer.handle?.stack) routesOf(layer.handle.stack, out);
  }
  return out;
};

// Field names a handler destructures from req.body (`const { a, b: c, d = 1 } = req.body`)
const bodyFieldsOf = (fn) => {
  const src = fn ? fn.toString() : '';
  const fields = new Set();
  for (const m of src.matchAll(/(?:const|let)\s*\{([^}]*)\}\s*=\s*req\.body/g)) {
    m[1].split(',').map((s) => s.trim().split(/[:=\s]/)[0]).filter((s) => /^[A-Za-z_]\w*$/.test(s)).forEach((s) => fields.add(s));
  }
  for (const m of src.matchAll(/req\.body\.([A-Za-z_]\w*)/g)) fields.add(m[1]);
  return [...fields].filter((f) => f !== '...');
};

const listen = (app) => new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });

(async () => {
  // ---------- throwaway tenant ----------
  const inst = await prisma.institution.create({ data: { code: RUN, name: `${RUN} Sweep School`, type: 'COLLEGE' } });
  const pw = await hashPassword('Sweep@12345');
  const mkUser = (role, tag) => prisma.user.create({ data: { institutionId: inst.id, email: `${RUN.toLowerCase()}-${tag}@test.invalid`, password: pw, role, status: 'ACTIVE' } });
  const adminU = await mkUser(ROLES.INSTITUTE_ADMIN, 'admin');
  const teacherU = await mkUser(ROLES.TEACHER, 'teacher');
  const studentU = await mkUser(ROLES.STUDENT, 'student');
  const dept = await prisma.department.create({ data: { institutionId: inst.id, code: 'D1', name: 'Dept' } });
  const staff = await prisma.staff.create({ data: { userId: teacherU.id, institutionId: inst.id, employeeCode: `${RUN}-T`, firstName: 'Sweep', lastName: 'Teacher', departmentId: dept.id, staffType: 'TEACHING', designation: 'Teacher', joiningDate: new Date() } }).catch((e) => { console.error('staff seed failed:', e.message); return null; });
  const student = await prisma.student.create({ data: { userId: studentU.id, institutionId: inst.id, admissionNumber: `${RUN}-S`, firstName: 'Sweep', lastName: 'Student', email: studentU.email, dob: new Date('2010-01-01'), gender: 'OTHER' } });

  const tok = (u, extra) => generateAccessToken({ id: u.id, email: u.email, role: u.role, institutionId: inst.id, ...extra });
  const targets = [
    { portal: 'Institute Admin', backend: 'IntituteAdmin_Backend', prefix: '/api/v1/admin', token: tok(adminU) },
    { portal: 'Staff', backend: 'Staff_backend', prefix: '/api/v1/staff', token: tok(teacherU, staff ? { staffId: staff.id } : {}) },
    { portal: 'Student', backend: 'Student_Backend', prefix: '/api/v1/student', token: tok(studentU, { studentId: student.id }) },
  ];

  const crashes = [];
  let total = 0;
  try {
    for (const t of targets) {
      const server = await listen(require(path.join(ROOT, t.backend, 'src', 'app')));
      const base = `http://127.0.0.1:${server.address().port}`;
      const routes = routesOf(require(path.join(ROOT, t.backend, 'src', 'routes', 'apiRoutes')).stack)
        .filter((r) => !/\/auth\/(login|forgot-password|verify-otp|reset-password|refresh|logout|change-password)/.test(r.path));
      console.log(`\n=== ${t.portal}: ${routes.length} write routes`);
      for (const r of routes) {
        const url = base + t.prefix + r.path.replace(/:[A-Za-z_]+\??/g, FAKE_ID);
        const fields = bodyFieldsOf(r.handler);
        const bodies = [['empty body', {}]];
        if (fields.length) bodies.push(['blank form', Object.fromEntries(fields.map((f) => [f, '']))]);
        for (const [kind, body] of bodies) {
          total++;
          let status;
          let message = '';
          try {
            const res = await fetch(url, { method: r.method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.token}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
            status = res.status;
            if (status >= 500) message = ((await res.json().catch(() => ({}))).message || '').replace(/\s+/g, ' ');
          } catch (err) { status = 'ERR'; message = err.message; }
          if (status === 'ERR' || status >= 500) {
            crashes.push({ portal: t.portal, method: r.method, path: t.prefix + r.path, kind, status, message: message.slice(0, 220) });
            console.log(`  ❌ ${r.method} ${t.prefix}${r.path} [${kind}] → ${status}: ${message.slice(0, 220)}`);
          }
        }
      }
      server.close();
    }
  } finally {
    // ---------- remove everything the throwaway tenant produced ----------
    const userIds = (await prisma.user.findMany({ where: { institutionId: inst.id }, select: { id: true } })).map((u) => u.id);
    const studentIds = (await prisma.student.findMany({ where: { institutionId: inst.id }, select: { id: true } })).map((s) => s.id);
    const staffIds = (await prisma.staff.findMany({ where: { institutionId: inst.id }, select: { id: true } })).map((s) => s.id);
    const models = Prisma.dmmf.datamodel.models;
    const scopeOf = (m) => {
      const has = (n) => m.fields.some((f) => f.name === n && f.kind === 'scalar');
      const or = [];
      if (has('institutionId')) or.push({ institutionId: inst.id });
      if (has('userId')) or.push({ userId: { in: userIds } });
      if (has('studentId')) or.push({ studentId: { in: studentIds } });
      if (has('staffId')) or.push({ staffId: { in: staffIds } });
      return or.length ? { OR: or } : null;
    };
    const skip = new Set(['Institution', 'User', 'Student', 'Staff', 'Department']);
    for (let pass = 0; pass < 8; pass++) {
      let leftovers = 0;
      for (const m of models) {
        if (skip.has(m.name)) continue;
        const where = scopeOf(m);
        if (!where) continue;
        const delegate = prisma[m.name.charAt(0).toLowerCase() + m.name.slice(1)];
        try { await delegate.deleteMany({ where }); } catch { leftovers++; }
      }
      if (!leftovers) break;
    }
    await prisma.parent.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.student.deleteMany({ where: { institutionId: inst.id } }).catch((e) => console.error('cleanup student:', e.message));
    await prisma.staff.deleteMany({ where: { institutionId: inst.id } }).catch((e) => console.error('cleanup staff:', e.message));
    await prisma.department.deleteMany({ where: { institutionId: inst.id } }).catch((e) => console.error('cleanup dept:', e.message));
    await prisma.user.deleteMany({ where: { institutionId: inst.id } }).catch((e) => console.error('cleanup users:', e.message));
    await prisma.institution.delete({ where: { id: inst.id } }).catch((e) => console.error('cleanup institution:', e.message));
    const left = await prisma.institution.count({ where: { code: RUN } });
    console.log(`\ncleanup: throwaway institution ${left ? 'NOT fully removed' : 'removed'}`);
    console.log(`${total} write calls · ${crashes.length} crashed`);
    if (process.argv.includes('--json')) console.log(JSON.stringify(crashes, null, 2));
    await prisma.$disconnect();
    process.exit(crashes.length ? 1 : 0);
  }
})();
