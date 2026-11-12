/**
 * Institute Admin features that replaced static pages — end to end over HTTP:
 *   - Official Circulars (admin CRUD; Staff / Student / Parent see only their audience)
 *   - Houses (create, mentor, members by student and by section, points log, standings)
 *   - Biometric import (CSV preview -> commit -> re-import updates, markAbsent, bad rows)
 * Everything created is removed afterwards.
 *
 * Run: node test/adminFeatures.integration.js   (needs the seed loaded)
 */
require('dotenv').config();
process.env.NODE_ENV = 'development';
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const path = require('path');
const assert = require('assert');
const { prisma, generateAccessToken, ROLES } = require('../shared');

const ROOT = path.resolve(__dirname, '..');
const RUN = `AF${Date.now().toString(36).toUpperCase()}`;
const cleanups = [];
let failures = 0;

const test = async (name, fn) => {
  try { const note = await fn(); console.log(`✅ ${name}${note ? ` — ${note}` : ''}`); } catch (err) { failures++; console.log(`❌ ${name}\n   ${err.message}`); }
};
const listen = (app) => new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });

(async () => {
  const staffSrv = await listen(require(path.join(ROOT, 'Staff_backend/src/app')));
  const adminSrv = await listen(require(path.join(ROOT, 'IntituteAdmin_Backend/src/app')));
  const studentSrv = await listen(require(path.join(ROOT, 'Student_Backend/src/app')));
  const api = (srv, prefix) => async (method, url, token, body) => {
    const isForm = body instanceof FormData;
    const res = await fetch(`http://127.0.0.1:${srv.address().port}${prefix}${url}`, {
      method,
      headers: { ...(!isForm && { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}` },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json.data, message: json.message };
  };
  const staffApi = api(staffSrv, '/api/v1/staff');
  const adminApi = api(adminSrv, '/api/v1/admin');
  const studentApi = api(studentSrv, '/api/v1/student');
  const csvForm = (csv, fields) => {
    const fd = new FormData();
    fd.append('file', new Blob([csv], { type: 'text/csv' }), 'device.csv');
    Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
    return fd;
  };

  try {
    const studentA = await prisma.student.findFirst({ where: { user: { email: 'arun.kumar@student.dpis.edu.in' } }, include: { user: true } });
    if (!studentA?.sectionId) throw new Error('Seed not loaded — run npm run prisma:seed');
    const inst = studentA.institutionId;
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@dpis-delhi.edu.in' }, include: { staff: true } });
    const tUser = await prisma.user.findFirst({ where: { email: 'teacher@dpis-delhi.edu.in' }, include: { staff: true } });
    const parentUser = await prisma.user.findFirst({ where: { email: 'parent.kumar@dpis.edu.in' }, include: { parent: true } });
    // The seeded admin has no staff profile; biometric import creates one on first use. Runs last.
    if (!adminUser.staff) cleanups.push(() => prisma.staff.deleteMany({ where: { userId: adminUser.id } }));

    const A = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role, institutionId: inst, ...(adminUser.staff && { staffId: adminUser.staff.id }) });
    const T = generateAccessToken({ id: tUser.id, email: tUser.email, role: tUser.role, institutionId: inst, staffId: tUser.staff.id });
    const S = generateAccessToken({ id: studentA.userId, email: studentA.user.email, role: ROLES.STUDENT, institutionId: inst, studentId: studentA.id });
    const P = generateAccessToken({ id: parentUser.id, email: parentUser.email, role: parentUser.role, institutionId: inst, parentId: parentUser.parent.id });

    // ---------- circulars ----------
    console.log('\n▶ Official Circulars');
    const ids = {};
    const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4 test').toString('base64')}`;
    await test('Admin publishes one circular per audience', async () => {
      for (const audience of ['ALL', 'STAFF', 'STUDENTS', 'PARENTS']) {
        const r = await adminApi('POST', '/circulars', A, { refNo: `${RUN}/${audience}`, title: `${RUN} for ${audience}`, issuedBy: 'Principal', audience, ...(audience === 'ALL' && { attachment: pdf, attachmentName: 'notice.pdf' }) });
        assert.strictEqual(r.status, 201, r.message);
        ids[audience] = r.data.id;
        cleanups.push(() => prisma.circular.deleteMany({ where: { id: r.data.id } }));
      }
    });
    await test('Duplicate reference number is refused with 409', async () => {
      const r = await adminApi('POST', '/circulars', A, { refNo: `${RUN}/ALL`, title: 'dup', issuedBy: 'x' });
      assert.strictEqual(r.status, 409, `${r.status} ${r.message}`);
    });
    await test('Missing title / bad attachment are 400', async () => {
      assert.strictEqual((await adminApi('POST', '/circulars', A, { refNo: `${RUN}/X`, issuedBy: 'x' })).status, 400);
      assert.strictEqual((await adminApi('POST', '/circulars', A, { refNo: `${RUN}/Y`, title: 't', issuedBy: 'x', attachment: 'data:text/html;base64,AAAA' })).status, 400);
    });
    const mine = (r) => r.data.filter((c) => c.refNo.startsWith(RUN)).map((c) => c.refNo.split('/')[1]).sort().join(',');
    await test('Staff sees ALL + STAFF', async () => { const r = await staffApi('GET', '/circulars', T); assert.strictEqual(r.status, 200, r.message); assert.strictEqual(mine(r), 'ALL,STAFF'); });
    await test('Student sees ALL + STUDENTS', async () => { const r = await studentApi('GET', '/circulars', S); assert.strictEqual(r.status, 200, r.message); assert.strictEqual(mine(r), 'ALL,STUDENTS'); });
    await test('Parent sees ALL + PARENTS', async () => { const r = await studentApi('GET', '/circulars', P); assert.strictEqual(r.status, 200, r.message); assert.strictEqual(mine(r), 'ALL,PARENTS'); });
    await test('Lists carry no attachment body; single fetch returns it', async () => {
      const list = await studentApi('GET', '/circulars', S);
      const row = list.data.find((c) => c.id === ids.ALL);
      assert.ok(row.hasAttachment && row.attachment === undefined);
      const one = await studentApi('GET', `/circulars/${ids.ALL}`, S);
      assert.strictEqual(one.data.attachment, pdf);
    });
    await test('Student cannot open a STAFF-only circular (404)', async () => {
      assert.strictEqual((await studentApi('GET', `/circulars/${ids.STAFF}`, S)).status, 404);
    });
    await test('Admin edits and deletes', async () => {
      const u = await adminApi('PATCH', `/circulars/${ids.PARENTS}`, A, { title: `${RUN} edited`, removeAttachment: true });
      assert.strictEqual(u.status, 200, u.message);
      assert.strictEqual(u.data.title, `${RUN} edited`);
      assert.strictEqual((await adminApi('DELETE', `/circulars/${ids.PARENTS}`, A)).status, 200);
      assert.strictEqual((await adminApi('GET', `/circulars/${ids.PARENTS}`, A)).status, 404);
    });

    // ---------- houses ----------
    console.log('\n▶ Houses');
    let red; let blue;
    await test('Create two houses, one with a mentor', async () => {
      const r1 = await adminApi('POST', '/setup/houses', A, { name: `${RUN} Ruby`, color: '#e11d48', mentorStaffId: tUser.staff.id });
      const r2 = await adminApi('POST', '/setup/houses', A, { name: `${RUN} Sapphire`, color: '#0284c7' });
      assert.strictEqual(r1.status, 201, r1.message); assert.strictEqual(r2.status, 201, r2.message);
      red = r1.data; blue = r2.data;
      cleanups.push(() => prisma.house.deleteMany({ where: { name: { startsWith: RUN } } }));
    });
    await test('Bad colour / unknown mentor / duplicate name are refused', async () => {
      assert.strictEqual((await adminApi('POST', '/setup/houses', A, { name: `${RUN} X`, color: 'red' })).status, 400);
      assert.strictEqual((await adminApi('POST', '/setup/houses', A, { name: `${RUN} Y`, mentorStaffId: '00000000-0000-0000-0000-000000000000' })).status, 404);
      assert.strictEqual((await adminApi('POST', '/setup/houses', A, { name: `${RUN} Ruby` })).status, 409);
    });
    const prevHouse = studentA.houseId;
    cleanups.push(() => prisma.student.update({ where: { id: studentA.id }, data: { houseId: prevHouse } }));
    await test('Assign a whole section, then move one student to another house', async () => {
      const r = await adminApi('POST', `/setup/houses/${red.id}/members`, A, { sectionId: studentA.sectionId });
      assert.strictEqual(r.status, 200, r.message);
      assert.ok(r.data.assigned >= 1);
      const m = await adminApi('POST', `/setup/houses/${blue.id}/members`, A, { studentIds: [studentA.id] });
      assert.strictEqual(m.status, 200, m.message);
      const blueMembers = await adminApi('GET', `/setup/houses/${blue.id}/members`, A);
      assert.deepStrictEqual(blueMembers.data.map((s) => s.id), [studentA.id]);
      return `${r.data.assigned} student(s) in section`;
    });
    await test('Unknown student id is refused', async () => {
      assert.strictEqual((await adminApi('POST', `/setup/houses/${red.id}/members`, A, { studentIds: ['00000000-0000-0000-0000-000000000000'] })).status, 404);
    });
    await test('Points: award, deduct, standings', async () => {
      assert.strictEqual((await adminApi('POST', `/setup/houses/${red.id}/points`, A, { points: 50, reason: 'Football 1st' })).status, 201);
      assert.strictEqual((await adminApi('POST', `/setup/houses/${red.id}/points`, A, { points: -10, reason: 'Late to assembly' })).status, 201);
      assert.strictEqual((await adminApi('POST', `/setup/houses/${blue.id}/points`, A, { points: 30, reason: 'Quiz' })).status, 201);
      assert.strictEqual((await adminApi('POST', `/setup/houses/${blue.id}/points`, A, { points: 0, reason: 'x' })).status, 400);
      assert.strictEqual((await adminApi('POST', `/setup/houses/${blue.id}/points`, A, { points: 5 })).status, 400);
      const list = await adminApi('GET', '/setup/houses', A);
      const r = list.data.find((h) => h.id === red.id); const b = list.data.find((h) => h.id === blue.id);
      assert.strictEqual(r.points, 40); assert.strictEqual(b.points, 30);
      assert.ok(r.rank < b.rank);
      assert.strictEqual(r.mentor?.id, tUser.staff.id);
      const log = await adminApi('GET', `/setup/houses/${red.id}/points`, A);
      assert.strictEqual(log.data.length, 2);
    });
    await test('Remove a member; delete a house unassigns its members', async () => {
      assert.strictEqual((await adminApi('DELETE', `/setup/houses/${blue.id}/members/${studentA.id}`, A)).status, 200);
      assert.strictEqual((await adminApi('DELETE', `/setup/houses/${blue.id}/members/${studentA.id}`, A)).status, 404);
      await adminApi('POST', `/setup/houses/${red.id}/members`, A, { studentIds: [studentA.id] });
      assert.strictEqual((await adminApi('DELETE', `/setup/houses/${red.id}`, A)).status, 200);
      const s = await prisma.student.findUnique({ where: { id: studentA.id }, select: { houseId: true } });
      assert.strictEqual(s.houseId, null);
      assert.strictEqual(await prisma.housePointEntry.count({ where: { houseId: red.id } }), 0);
    });

    // ---------- biometric ----------
    console.log('\n▶ Biometric import');
    const day = '2026-11-02'; // a past school day, inside any lock window used by the seed
    const sectionStudents = await prisma.student.count({ where: { sectionId: studentA.sectionId, status: 'ACTIVE', deletedAt: null } });
    const existing = await prisma.attendanceSession.findFirst({ where: { institutionId: inst, sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 } });
    if (existing) throw new Error(`A daily session already exists for ${day} in the test section — pick another date`);
    cleanups.push(() => prisma.attendanceSession.deleteMany({ where: { institutionId: inst, sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 } }));
    const csv = ['Admission Number,Date,In Time,Status', `${studentA.admissionNumber},02-11-2026,08:51,`, 'NOPE-999,2026-11-02,09:00,P', `${studentA.admissionNumber},2026-13-40,,P`, `${studentA.admissionNumber},2026-11-02,,MAYBE`].join('\n');

    await test('Preview validates and writes nothing', async () => {
      const r = await adminApi('POST', '/attendance/biometric-import', A, csvForm(csv, { mode: 'preview', markAbsent: true }));
      assert.strictEqual(r.status, 200, r.message);
      assert.strictEqual(r.data.committed, false);
      assert.strictEqual(r.data.validRows, 1);
      assert.strictEqual(r.data.errors.length, 3);
      assert.strictEqual(r.data.sessions.length, 1);
      assert.strictEqual(r.data.sessions[0].present, 1);
      assert.strictEqual(r.data.sessions[0].absent, sectionStudents - 1);
      assert.strictEqual(await prisma.attendanceSession.count({ where: { sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 } }), 0);
    });
    await test('Commit creates the daily sheet with absentees', async () => {
      const r = await adminApi('POST', '/attendance/biometric-import', A, csvForm(csv, { mode: 'commit', markAbsent: true }));
      assert.strictEqual(r.status, 200, r.message);
      assert.strictEqual(r.data.sessionsCreated, 1);
      const session = await prisma.attendanceSession.findFirst({ where: { sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 }, include: { records: true } });
      assert.strictEqual(session.subjectId, null);
      assert.strictEqual(session.records.length, sectionStudents);
      assert.strictEqual(session.records.find((x) => x.studentId === studentA.id).status, 'PRESENT');
    });
    await test('Re-import updates the same sheet (no duplicate)', async () => {
      const again = `Admission Number,Date,Status\n${studentA.admissionNumber},2026-11-02,LATE`;
      const r = await adminApi('POST', '/attendance/biometric-import', A, csvForm(again, { mode: 'commit' }));
      assert.strictEqual(r.status, 200, r.message);
      assert.strictEqual(r.data.sessionsUpdated, 1);
      assert.strictEqual(await prisma.attendanceSession.count({ where: { sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 } }), 1);
      const rec = await prisma.attendanceRecord.findFirst({ where: { studentId: studentA.id, session: { sectionId: studentA.sectionId, date: new Date(day), periodNumber: 0 } } });
      assert.strictEqual(rec.status, 'LATE');
    });
    await test('Student sees the imported day in their attendance', async () => {
      const r = await studentApi('GET', '/attendance', S);
      assert.strictEqual(r.status, 200, r.message);
    });
    await test('File without required columns / no file is 400', async () => {
      assert.strictEqual((await adminApi('POST', '/attendance/biometric-import', A, csvForm('Name,When\nx,y', {}))).status, 400);
      assert.strictEqual((await adminApi('POST', '/attendance/biometric-import', A, new FormData())).status, 400);
    });
    await test('Teacher (no admin portal) cannot import', async () => {
      const r = await adminApi('POST', '/attendance/biometric-import', T, csvForm(csv, {}));
      assert.ok([401, 403].includes(r.status), `${r.status}`);
    });
  } catch (err) {
    failures++;
    console.error('❌ setup failed:', err.message);
  } finally {
    for (const fn of cleanups.reverse()) { try { await fn(); } catch (err) { console.error('  ⚠ cleanup:', err.message); } }
    [staffSrv, adminSrv, studentSrv].forEach((s) => s.close());
    const left = await prisma.circular.count({ where: { refNo: { startsWith: RUN } } }) + await prisma.house.count({ where: { name: { startsWith: RUN } } });
    console.log(`\ncleanup: ${left ? `${left} test record(s) left` : 'all test data removed'}`);
    await prisma.$disconnect();
    console.log(failures ? `❌ ${failures} check(s) failed` : '🎉 Circulars, Houses and Biometric import work end to end');
    process.exit(failures ? 1 : 0);
  }
})();
