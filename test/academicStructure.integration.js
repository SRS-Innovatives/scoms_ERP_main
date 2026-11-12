/**
 * Institution-type academic structure — end-to-end against a REAL database.
 *
 * Starts the Super Admin and Institute Admin Express apps in-process, onboards throwaway
 * institutions of every type through the real API, then checks persistence, /auth/me,
 * backend level enforcement, the update allow-list and cross-tenant isolation. Everything
 * it creates is deleted at the end (even on failure).
 *
 * Needs DATABASE_URL (root .env) with migrations applied and the seeded Super Admin.
 * Not part of `npm test` (which stays DB-free): run `node test/academicStructure.integration.js`.
 */
require('dotenv').config();
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const assert = require('assert');
const { prisma, generateAccessToken, ROLES } = require('../shared');
const superAdminApp = require('../SuperAdmin_Backend/src/app');
const instituteApp = require('../IntituteAdmin_Backend/src/app');
const staffApp = require('../Staff_backend/src/app');
const studentApp = require('../Student_Backend/src/app');

const RUN = `T${Date.now().toString(36).toUpperCase()}`;
const created = []; // institution ids to clean up

let failures = 0;
const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failures++;
    console.error(`❌ ${name}\n   ${err.message}`);
  }
};

const listen = (app) => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

let saBase;
let iaBase;
let saToken;

const call = async (base, method, path, token, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};
const sa = (method, path, body) => call(saBase, method, `/api/v1/super-admin${path}`, saToken, body);
const ia = (token, method, path, body) => call(iaBase, method, `/api/v1/admin${path}`, token, body);

const onboard = async (type, extra = {}) => {
  const code = (extra.code || `${RUN}-${type}`).slice(0, 40);
  const res = await sa('POST', '/institutions', {
    name: `Test ${type} ${RUN}`,
    code,
    type,
    adminName: 'Test Admin',
    adminEmail: `${code.toLowerCase()}@test.invalid`,
    adminPassword: 'Test@12345',
    ...extra,
  });
  assert.strictEqual(res.status, 201, `onboard ${type}: ${res.status} ${res.body.message}`);
  const inst = await prisma.institution.findUnique({ where: { code } });
  created.push(inst.id);
  const admin = await prisma.user.findFirst({ where: { institutionId: inst.id, role: ROLES.INSTITUTE_ADMIN } });
  const token = generateAccessToken({ id: admin.id, email: admin.email, role: admin.role, institutionId: inst.id });
  return { inst, token };
};

const cleanup = async () => {
  for (const id of created) {
    const userIds = (await prisma.user.findMany({ where: { institutionId: id }, select: { id: true } })).map((u) => u.id);
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.notification.deleteMany({ where: { OR: [{ institutionId: id }, { userId: { in: userIds } }] } });
    await prisma.auditLog.deleteMany({ where: { OR: [{ institutionId: id }, { userId: { in: userIds } }] } });
    await prisma.staff.deleteMany({ where: { institutionId: id } });
    await prisma.department.deleteMany({ where: { institutionId: id } });
    await prisma.faculty.deleteMany({ where: { institutionId: id } });
    await prisma.user.deleteMany({ where: { institutionId: id } });
    await prisma.institution.delete({ where: { id } });
  }
};

(async () => {
  const saServer = await listen(superAdminApp);
  const iaServer = await listen(instituteApp);
  const stServer = await listen(staffApp);
  const sdServer = await listen(studentApp);
  saBase = `http://127.0.0.1:${saServer.address().port}`;
  iaBase = `http://127.0.0.1:${iaServer.address().port}`;
  const staffBase = `http://127.0.0.1:${stServer.address().port}`;
  const studentBase = `http://127.0.0.1:${sdServer.address().port}`;

  const superAdmin = await prisma.user.findFirst({ where: { role: ROLES.SUPER_ADMIN } });
  if (!superAdmin) {
    console.error('❌ No Super Admin user in this database — run the seed first.');
    process.exit(1);
  }
  saToken = generateAccessToken({ id: superAdmin.id, email: superAdmin.email, role: superAdmin.role, institutionId: null });

  console.log(`🧪 Academic structure integration test (run ${RUN})...\n`);
  const ctx = {};

  try {
    await test('Catalog endpoint lists all 4 types with their defaults', async () => {
      const res = await sa('GET', '/institutions/academic-structure-catalog');
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(Object.keys(res.body.data.types), ['SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY']);
      assert.strictEqual(res.body.data.types.SCHOOL.labels.course, 'Standard');
    });

    await test('Onboarding rejects an unknown institution type and invalid academic config', async () => {
      const bad1 = await sa('POST', '/institutions', { name: 'x', code: `${RUN}-BAD1`, type: 'KINDERGARTEN' });
      assert.strictEqual(bad1.status, 400);
      const bad2 = await sa('POST', '/institutions', { name: 'x', code: `${RUN}-BAD2`, type: 'UNIVERSITY', academicConfig: { regulations: { internalAssessmentWeight: 500 } } });
      assert.strictEqual(bad2.status, 400);
      assert.strictEqual(await prisma.institution.count({ where: { code: { startsWith: `${RUN}-BAD` } } }), 0);
    });

    await test('SCHOOL onboarded: /auth/me returns Standard/Term structure, no program/batch/faculty', async () => {
      ctx.school = await onboard('SCHOOL', { academicConfig: { labels: { course: 'Grade' } } });
      const me = await ia(ctx.school.token, 'GET', '/auth/me');
      assert.strictEqual(me.status, 200);
      const s = me.body.data.institution.academicStructure;
      assert.strictEqual(s.type, 'SCHOOL');
      assert.strictEqual(s.labels.course, 'Grade');
      assert.strictEqual(s.labels.semester, 'Term');
      assert.strictEqual(s.levels.program, false);
      assert.strictEqual(s.levels.faculty, false);
    });

    await test('SCHOOL: backend refuses Program, Batch and Faculty creation (422)', async () => {
      const dept = await ia(ctx.school.token, 'POST', '/setup/departments', { code: 'GEN', name: 'General' });
      assert.strictEqual(dept.status, 201, dept.body.message);
      ctx.schoolDeptId = dept.body.data.id;
      const prog = await ia(ctx.school.token, 'POST', '/setup/programs', { departmentId: ctx.schoolDeptId, code: 'P1', name: 'Prog' });
      assert.strictEqual(prog.status, 422, `program: ${prog.status}`);
      const batch = await ia(ctx.school.token, 'POST', '/setup/batches', { courseId: 'any', name: 'B', startYear: 2025, endYear: 2026 });
      assert.strictEqual(batch.status, 422, `batch: ${batch.status}`);
      const fac = await ia(ctx.school.token, 'POST', '/setup/faculties', { code: 'F1', name: 'Fac' });
      assert.strictEqual(fac.status, 422, `faculty: ${fac.status}`);
    });

    await test('COLLEGE: regulation overrides are dropped (follows affiliating university)', async () => {
      ctx.college = await onboard('COLLEGE', { academicConfig: { regulations: { gradingScheme: 'GRADES' } } });
      const inst = await prisma.institution.findUnique({ where: { id: ctx.college.inst.id } });
      assert.strictEqual(inst.academicConfig, null);
      const me = await ia(ctx.college.token, 'GET', '/auth/me');
      assert.strictEqual(me.body.data.institution.academicStructure.regulations.examAuthority, 'AFFILIATING_UNIVERSITY');
    });

    await test('AUTONOMOUS_COLLEGE: configurable regulations persist', async () => {
      ctx.auto = await onboard('AUTONOMOUS_COLLEGE', { academicConfig: { regulations: { gradingScheme: 'GRADES', internalAssessmentWeight: 30 } } });
      const me = await ia(ctx.auto.token, 'GET', '/auth/me');
      const r = me.body.data.institution.academicStructure.regulations;
      assert.strictEqual(r.gradingScheme, 'GRADES');
      assert.strictEqual(r.internalAssessmentWeight, 30);
    });

    await test('UNIVERSITY: faculty level on; faculty + department-in-faculty can be created', async () => {
      ctx.uni = await onboard('UNIVERSITY');
      const fac = await ia(ctx.uni.token, 'POST', '/setup/faculties', { code: 'ENG', name: 'School of Engineering' });
      assert.strictEqual(fac.status, 201, fac.body.message);
      ctx.uniFacultyId = fac.body.data.id;
      const dept = await ia(ctx.uni.token, 'POST', '/setup/departments', { code: 'CSE', name: 'Computer Science', facultyId: ctx.uniFacultyId });
      assert.strictEqual(dept.status, 201, dept.body.message);
      const list = await ia(ctx.uni.token, 'GET', '/setup/departments');
      assert.strictEqual(list.body.data.find((d) => d.code === 'CSE').faculty.name, 'School of Engineering');
    });

    await test('Cross-tenant: a school cannot link or read another institution\'s faculty', async () => {
      const dept = await ia(ctx.school.token, 'POST', '/setup/departments', { code: 'X', name: 'X', facultyId: ctx.uniFacultyId });
      assert.strictEqual(dept.status, 404);
      const list = await ia(ctx.school.token, 'GET', '/setup/faculties');
      assert.strictEqual(list.status, 200);
      assert.strictEqual(list.body.data.length, 0);
      const upd = await ia(ctx.school.token, 'PATCH', `/setup/faculties/${ctx.uniFacultyId}`, { name: 'hijack' });
      assert.strictEqual(upd.status, 404);
    });

    await test('Faculty endpoints refuse a non-admin role from the same institution (403)', async () => {
      const studentToken = generateAccessToken({ id: 'nobody', email: 'x@test.invalid', role: ROLES.STUDENT, institutionId: ctx.uni.inst.id });
      const res = await ia(studentToken, 'POST', '/setup/faculties', { code: 'Z', name: 'Z' });
      assert.strictEqual(res.status, 403);
    });

    await test('Update allow-list: status/modules/code in the edit body are ignored', async () => {
      const res = await sa('PUT', `/institutions/${ctx.college.inst.id}`, { name: 'Renamed College', status: 'SUSPENDED', modules: ['library'], code: 'HACKED' });
      assert.strictEqual(res.status, 200, res.body.message);
      const inst = await prisma.institution.findUnique({ where: { id: ctx.college.inst.id } });
      assert.strictEqual(inst.name, 'Renamed College');
      assert.strictEqual(inst.status, 'ACTIVE');
      assert.strictEqual(inst.code, ctx.college.inst.code);
      assert.deepStrictEqual(inst.modules, ctx.college.inst.modules);
    });

    await test('Changing SCHOOL -> COLLEGE keeps data and unlocks programs; GET returns new structure', async () => {
      const res = await sa('PUT', `/institutions/${ctx.school.inst.id}`, { type: 'COLLEGE' });
      assert.strictEqual(res.status, 200, res.body.message);
      const detail = await sa('GET', `/institutions/${ctx.school.inst.id}`);
      assert.strictEqual(detail.body.data.academicStructure.type, 'COLLEGE');
      assert.strictEqual(detail.body.data.academicStructure.labels.course, 'Grade'); // saved label override survives
      assert.strictEqual(await prisma.department.count({ where: { institutionId: ctx.school.inst.id } }), 1);
      const prog = await ia(ctx.school.token, 'POST', '/setup/programs', { departmentId: ctx.schoolDeptId, code: 'P1', name: 'Prog' });
      assert.strictEqual(prog.status, 201, prog.body.message);
      await prisma.program.delete({ where: { id: prog.body.data.id } });
    });

    await test('Update rejects invalid type/config and clears academicConfig back to defaults', async () => {
      const bad = await sa('PUT', `/institutions/${ctx.auto.inst.id}`, { type: 'KINDERGARTEN' });
      assert.strictEqual(bad.status, 400);
      const clear = await sa('PUT', `/institutions/${ctx.auto.inst.id}`, { academicConfig: null });
      assert.strictEqual(clear.status, 200, clear.body.message);
      const inst = await prisma.institution.findUnique({ where: { id: ctx.auto.inst.id } });
      assert.strictEqual(inst.academicConfig, null);
    });

    await test('Affiliation link is cleared when an institution stops being a college', async () => {
      await prisma.institution.update({ where: { id: ctx.auto.inst.id }, data: { affiliatedUniversityId: ctx.uni.inst.id } });
      const res = await sa('PUT', `/institutions/${ctx.auto.inst.id}`, { type: 'UNIVERSITY' });
      assert.strictEqual(res.status, 200, res.body.message);
      const inst = await prisma.institution.findUnique({ where: { id: ctx.auto.inst.id } });
      assert.strictEqual(inst.affiliatedUniversityId, null);
    });

    await test('Staff, Student and Parent /auth/me all carry their own institution\'s structure', async () => {
      const users = await prisma.user.findMany({
        where: {
          role: { in: [ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT] },
          institutionId: { not: null },
          institution: { code: { not: { startsWith: RUN } } },
          // a parent must actually be linked to a child — unlinked parents are (correctly) refused
          OR: [{ role: { not: ROLES.PARENT } }, { parent: { students: { some: {} } } }],
        },
        include: { institution: { select: { type: true } }, staff: { select: { id: true } }, student: { select: { id: true } }, parent: { select: { id: true } } },
      });
      const pick = (role) => users.find((u) => u.role === role);
      const checked = [];
      for (const [role, base, prefix] of [[ROLES.TEACHER, staffBase, '/api/v1/staff'], [ROLES.STUDENT, studentBase, '/api/v1/student'], [ROLES.PARENT, studentBase, '/api/v1/student']]) {
        const u = pick(role);
        if (!u) continue;
        const token = generateAccessToken({
          id: u.id, email: u.email, role: u.role, institutionId: u.institutionId,
          ...(u.staff && { staffId: u.staff.id }), ...(u.student && { studentId: u.student.id }), ...(u.parent && { parentId: u.parent.id }),
        });
        const me = await call(base, 'GET', `${prefix}/auth/me`, token);
        assert.strictEqual(me.status, 200, `${role} /auth/me: ${me.status} ${me.body.message}`);
        const s = me.body.data.institution.academicStructure;
        assert.strictEqual(s.type, u.institution.type, `${role} sees its own institution's type`);
        assert.ok(s.labels.course && s.labels.semester && Array.isArray(s.hierarchy), `${role} gets labels + hierarchy`);
        checked.push(role);
      }
      assert.ok(checked.length >= 2, `expected seeded staff/student users, checked: ${checked.join(', ') || 'none'}`);
    });

    await test('Report definitions show each institution\'s own academic terms', async () => {
      const { reportEngine } = require('../shared');
      const report = await prisma.report.findFirst({
        where: { status: { not: 'ARCHIVED' }, visibility: 'SYSTEM', filters: { some: { fieldKey: 'courseId', label: 'Course' } } },
      });
      if (!report) throw new Error('no seeded report with a Course filter — run the seed');
      const university = await reportEngine.getReportDefinition(report.code, ctx.uni.inst.id);
      assert.strictEqual(university.filters.find((f) => f.fieldKey === 'courseId').label, 'Course');
      // ctx.school was switched to COLLEGE earlier but kept its custom "Grade" label
      const schoolNowCollege = await reportEngine.getReportDefinition(report.code, ctx.school.inst.id);
      assert.strictEqual(schoolNowCollege.filters.find((f) => f.fieldKey === 'courseId').label, 'Grade');
      const freshSchool = await onboard('SCHOOL', { code: `${RUN}-SCH2`.slice(0, 40), adminEmail: `${RUN.toLowerCase()}-sch2@test.invalid` });
      const school = await reportEngine.getReportDefinition(report.code, freshSchool.inst.id);
      assert.strictEqual(school.filters.find((f) => f.fieldKey === 'courseId').label, 'Standard');
    });

    await test('Student certificate types follow the institution\'s enabled templates', async () => {
      const u = await prisma.user.findFirst({
        where: { role: ROLES.STUDENT, institutionId: { not: null }, institution: { code: { not: { startsWith: RUN } } } },
        include: { student: { select: { id: true } } },
      });
      if (!u?.student) throw new Error('no seeded student — run the seed');
      const token = generateAccessToken({ id: u.id, email: u.email, role: u.role, institutionId: u.institutionId, studentId: u.student.id });
      const before = await call(studentBase, 'GET', '/api/v1/student/certificate-types', token);
      if (before.status === 403) return; // certificates module not enabled for this seeded institution
      assert.strictEqual(before.status, 200, before.body.message);
      assert.ok(before.body.data.some((t) => t.value === 'CONDUCT'), 'CONDUCT offered by default');

      // Institution disables the Conduct template -> no longer offered, and a request is refused
      const template = await prisma.certificateTemplate.findUnique({ where: { code: 'CONDUCT' } });
      const existing = await prisma.institutionCertificateTemplate.findUnique({ where: { institutionId_templateId: { institutionId: u.institutionId, templateId: template.id } } });
      await prisma.institutionCertificateTemplate.upsert({
        where: { institutionId_templateId: { institutionId: u.institutionId, templateId: template.id } },
        update: { enabled: false },
        create: { institutionId: u.institutionId, templateId: template.id, enabled: false },
      });
      try {
        const after = await call(studentBase, 'GET', '/api/v1/student/certificate-types', token);
        assert.ok(!after.body.data.some((t) => t.value === 'CONDUCT'), 'disabled CONDUCT hidden');
        const req = await call(studentBase, 'POST', '/api/v1/student/certificate-requests', token, { type: 'CONDUCT' });
        assert.strictEqual(req.status, 400, 'request for a disabled type refused');
      } finally {
        // restore exactly what was there before
        if (existing) await prisma.institutionCertificateTemplate.update({ where: { id: existing.id }, data: { enabled: existing.enabled } });
        else await prisma.institutionCertificateTemplate.delete({ where: { institutionId_templateId: { institutionId: u.institutionId, templateId: template.id } } });
      }
    });

    await test('Existing (seeded) institutions still resolve a structure with no academicConfig', async () => {
      const legacy = await prisma.institution.findFirst({ where: { code: { not: { startsWith: RUN } } } });
      const detail = await sa('GET', `/institutions/${legacy.id}`);
      assert.strictEqual(detail.status, 200);
      assert.strictEqual(detail.body.data.academicStructure.type, legacy.type);
    });
  } finally {
    await cleanup().catch((err) => {
      failures++;
      console.error('❌ Cleanup failed:', err.message);
    });
    saServer.close();
    iaServer.close();
    stServer.close();
    sdServer.close();
    await prisma.$disconnect();
  }

  if (failures) {
    console.error(`\n❌ FAIL: ${failures} integration check(s) failed.`);
    process.exit(1);
  }
  console.log('\n🎉 Academic structure works end-to-end: persistence, /auth/me, enforcement, allow-list, isolation.');
  process.exit(0);
})();
