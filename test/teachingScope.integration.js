/**
 * Subject-teacher / class-teacher access — end to end over HTTP (Staff + Admin APIs).
 *
 * In the seeded school it builds: classes 7-A (seeded section) and 7-B, subjects
 * MATHS + SCIENCE for that class, and two teachers:
 *   - teacher T (seeded)  = subject teacher of MATHS in 7-A only
 *   - teacher C (created) = class teacher of 7-A and 7-B, teaches no subject
 * then checks every rule of the agreed workflow, and removes everything afterwards.
 *
 * Run: node test/teachingScope.integration.js   (needs the seed loaded)
 */
require('dotenv').config();
process.env.NODE_ENV = 'development';
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const path = require('path');
const assert = require('assert');
const { prisma, generateAccessToken, ROLES, hashPassword } = require('../shared');

const ROOT = path.resolve(__dirname, '..');
const RUN = `TS${Date.now().toString(36).toUpperCase()}`;
const TODAY = new Date().toISOString().slice(0, 10);
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
    const res = await fetch(`http://127.0.0.1:${srv.address().port}${prefix}${url}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, data: json.data, message: json.message };
  };
  const staffApi = api(staffSrv, '/api/v1/staff');
  const adminApi = api(adminSrv, '/api/v1/admin');
  const studentApi = api(studentSrv, '/api/v1/student');

  try {
    // ---------- fixtures ----------
    const studentA = await prisma.student.findFirst({ where: { user: { email: 'arun.kumar@student.dpis.edu.in' } }, include: { user: true } });
    if (!studentA?.sectionId) throw new Error('Seed not loaded — run npm run prisma:seed');
    const inst = studentA.institutionId;
    const secA = await prisma.section.findUnique({ where: { id: studentA.sectionId }, include: { semester: true } });
    const courseId = secA.semester.courseId;
    const tUser = await prisma.user.findFirst({ where: { email: 'teacher@dpis-delhi.edu.in' }, include: { staff: true } });
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@dpis-delhi.edu.in' } });

    cleanups.push(() => prisma.section.update({ where: { id: secA.id }, data: { classTeacherId: secA.classTeacherId } }));
    const secB = await prisma.section.create({ data: { semesterId: secA.semesterId, name: `${RUN}-B` } });
    cleanups.push(() => prisma.section.delete({ where: { id: secB.id } }));
    const pw = await hashPassword('Scope@12345');
    const sbUser = await prisma.user.create({ data: { institutionId: inst, email: `${RUN.toLowerCase()}-sb@test.invalid`, password: pw, role: ROLES.STUDENT, status: 'ACTIVE' } });
    const studentB = await prisma.student.create({ data: { userId: sbUser.id, institutionId: inst, admissionNumber: `${RUN}-SB`, firstName: 'Bina', lastName: 'B', email: sbUser.email, dob: new Date('2012-01-01'), gender: 'FEMALE', courseId, sectionId: secB.id } });
    cleanups.push(async () => { await prisma.student.delete({ where: { id: studentB.id } }); await prisma.user.delete({ where: { id: sbUser.id } }); });
    const cUser = await prisma.user.create({ data: { institutionId: inst, email: `${RUN.toLowerCase()}-ct@test.invalid`, password: pw, role: ROLES.TEACHER, status: 'ACTIVE' } });
    const cStaff = await prisma.staff.create({ data: { userId: cUser.id, institutionId: inst, employeeCode: `${RUN}-CT`, firstName: 'Class', lastName: 'Teacher', designation: 'Teacher' } });
    cleanups.push(async () => { await prisma.staff.delete({ where: { id: cStaff.id } }); await prisma.user.delete({ where: { id: cUser.id } }); });
    await prisma.section.update({ where: { id: secA.id }, data: { classTeacherId: cStaff.id } });
    await prisma.section.update({ where: { id: secB.id }, data: { classTeacherId: cStaff.id } });

    const maths = await prisma.subject.create({ data: { institutionId: inst, code: `${RUN}-M`, name: 'Maths (scope test)' } });
    const science = await prisma.subject.create({ data: { institutionId: inst, code: `${RUN}-S`, name: 'Science (scope test)' } });
    cleanups.push(() => prisma.subject.deleteMany({ where: { id: { in: [maths.id, science.id] } } }));
    await prisma.subjectClassMapping.createMany({ data: [{ subjectId: maths.id, courseId }, { subjectId: science.id, courseId }] });

    const T = generateAccessToken({ id: tUser.id, email: tUser.email, role: tUser.role, institutionId: inst, staffId: tUser.staff.id });
    const C = generateAccessToken({ id: cUser.id, email: cUser.email, role: cUser.role, institutionId: inst, staffId: cStaff.id });
    const A = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role, institutionId: inst });
    const S = generateAccessToken({ id: studentA.userId, email: studentA.user.email, role: ROLES.STUDENT, institutionId: inst, studentId: studentA.id });
    const sessionsMade = [];
    cleanups.push(() => prisma.attendanceSession.deleteMany({ where: { id: { in: sessionsMade } } }));
    const track = (r) => { if (r.data?.id && r.status === 201) sessionsMade.push(r.data.id); return r; };

    // ---------- admin assigns ----------
    console.log('\n▶ Admin assigns subject teacher (by ids)');
    await test('Admin assigns teacher T → Maths → 7-A', async () => {
      const r = await adminApi('POST', '/staff/assignments', A, { staffId: tUser.staff.id, subjectId: maths.id, sectionId: secA.id });
      assert.ok(r.status === 201 || r.status === 200, `${r.status} ${r.message}`);
      cleanups.push(() => prisma.subjectTeacherMapping.deleteMany({ where: { subjectId: { in: [maths.id, science.id] } } }));
    });
    await test('Admin is refused a subject that is not set up for that class', async () => {
      const otherCourse = await prisma.course.create({ data: { institutionId: inst, departmentId: (await prisma.course.findUnique({ where: { id: courseId } })).departmentId, code: `${RUN}-OC`, name: 'Other class' } });
      const odd = await prisma.subject.create({ data: { institutionId: inst, code: `${RUN}-X`, name: 'Odd', classMappings: { create: { courseId: otherCourse.id } } } });
      cleanups.push(async () => { await prisma.subject.delete({ where: { id: odd.id } }); await prisma.course.delete({ where: { id: otherCourse.id } }); });
      const r = await adminApi('POST', '/staff/assignments', A, { staffId: tUser.staff.id, subjectId: odd.id, sectionId: secA.id });
      assert.strictEqual(r.status, 400, `${r.status} ${r.message}`);
      return r.message;
    });

    // ---------- attendance ----------
    console.log('\n▶ Attendance');
    await test('Subject teacher sees the 7-A roster', async () => {
      const r = await staffApi('GET', `/attendance/roster?sectionId=${secA.id}`, T);
      assert.strictEqual(r.status, 200, r.message);
      assert.ok(r.data.some((s) => s.id === studentA.id));
    });
    await test('Subject teacher is refused the 7-B roster (not assigned)', async () => {
      const r = await staffApi('GET', `/attendance/roster?sectionId=${secB.id}`, T);
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('Subject teacher records Maths attendance for 7-A', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', T, { sectionId: secA.id, subjectId: maths.id, date: TODAY, periodNumber: 3, records: [{ studentId: studentA.id, status: 'PRESENT' }] }));
      assert.strictEqual(r.status, 201, `${r.status} ${r.message}`);
    });
    await test('…is refused Science (a subject not assigned) in 7-A', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', T, { sectionId: secA.id, subjectId: science.id, date: TODAY, periodNumber: 4, records: [] }));
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('…is refused a 7-B student inside a 7-A attendance', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', T, { sectionId: secA.id, subjectId: maths.id, date: TODAY, periodNumber: 5, records: [{ studentId: studentB.id, status: 'ABSENT' }] }));
      assert.strictEqual(r.status, 400, `${r.status} ${r.message}`);
    });
    await test('…is refused daily attendance (only the class teacher takes it)', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', T, { sectionId: secA.id, subjectId: null, date: TODAY, periodNumber: 0, records: [] }));
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('Class teacher takes daily attendance for 7-B', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', C, { sectionId: secB.id, subjectId: null, date: TODAY, periodNumber: 0, records: [{ studentId: studentB.id, status: 'PRESENT' }] }));
      assert.strictEqual(r.status, 201, `${r.status} ${r.message}`);
    });
    await test('Class teacher is refused Maths subject attendance (not the Maths teacher)', async () => {
      const r = track(await staffApi('POST', '/attendance/mark', C, { sectionId: secA.id, subjectId: maths.id, date: TODAY, periodNumber: 6, records: [] }));
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('Approved substitute may take that Maths class, that day only', async () => {
      // one timetable per section — reuse 7-A's if it already has one
      let tt = await prisma.timetable.findFirst({ where: { institutionId: inst, sectionId: secA.id } });
      if (!tt) {
        tt = await prisma.timetable.create({ data: { institutionId: inst, sectionId: secA.id } });
        const created = tt.id;
        cleanups.push(() => prisma.timetable.delete({ where: { id: created } }));
      }
      const entry = await prisma.timetableEntry.create({ data: { timetableId: tt.id, dayOfWeek: 'MONDAY', period: 2, startTime: '10:00', endTime: '10:45', subjectId: maths.id, staffId: tUser.staff.id } });
      const day = new Date(`${TODAY}T00:00:00.000Z`);
      cleanups.push(() => prisma.timetableEntry.delete({ where: { id: entry.id } }));
      const sub = await prisma.substituteRequest.create({ data: { institutionId: inst, timetableEntryId: entry.id, date: day, originalStaffId: tUser.staff.id, substituteStaffId: cStaff.id, requestedById: tUser.id, reason: RUN, status: 'APPROVED' } });
      cleanups.push(() => prisma.substituteRequest.delete({ where: { id: sub.id } }));
      const ok = track(await staffApi('POST', '/attendance/mark', C, { sectionId: secA.id, subjectId: maths.id, date: TODAY, periodNumber: 2, records: [{ studentId: studentA.id, status: 'PRESENT' }] }));
      assert.strictEqual(ok.status, 201, `today: ${ok.status} ${ok.message}`);
      const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      const no = track(await staffApi('POST', '/attendance/mark', C, { sectionId: secA.id, subjectId: maths.id, date: tomorrow, periodNumber: 2, records: [] }));
      assert.strictEqual(no.status, 403, `tomorrow: ${no.status} ${no.message}`);
    });

    // ---------- marks ----------
    console.log('\n▶ Marks entry');
    const year = await prisma.academicYear.findFirst({ where: { institutionId: inst } });
    const exam = await prisma.exam.create({ data: { institutionId: inst, academicYearId: year.id, name: `${RUN} Test Exam`, examType: 'UNIT_TEST', startDate: new Date(), endDate: new Date() } });
    cleanups.push(() => prisma.exam.delete({ where: { id: exam.id } }));
    const sched = await prisma.examSchedule.create({ data: { examId: exam.id, subjectId: maths.id, courseId, examDate: new Date(), startTime: '09:00', endTime: '10:00', maxMarks: 50, passMarks: 18 } });
    await test('Maths teacher\'s marks list holds only 7-A students (not 7-B)', async () => {
      const r = await staffApi('GET', `/exam-schedules/${sched.id}/roster`, T);
      assert.strictEqual(r.status, 200, `${r.status} ${r.message}`);
      const ids = r.data.roster.map((s) => s.id);
      assert.ok(ids.includes(studentA.id) && !ids.includes(studentB.id), `roster ids: ${ids.length}`);
    });
    await test('Maths teacher saves marks for a 7-A student', async () => {
      const r = await staffApi('POST', `/exam-schedules/${sched.id}/marks`, T, { marks: [{ studentId: studentA.id, marksObtained: 40 }] });
      assert.strictEqual(r.status, 200, `${r.status} ${r.message}`);
    });
    await test('…is refused marks for a 7-B student', async () => {
      const r = await staffApi('POST', `/exam-schedules/${sched.id}/marks`, T, { marks: [{ studentId: studentB.id, marksObtained: 40 }] });
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('A teacher not assigned Maths is refused the Maths marks list', async () => {
      const r = await staffApi('GET', `/exam-schedules/${sched.id}/roster`, C);
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });

    // ---------- leave ----------
    console.log('\n▶ Student leave');
    let leaveId;
    await test('Student applies leave', async () => {
      const r = await studentApi('POST', '/leave', S, { type: 'MEDICAL', startDate: TODAY, endDate: TODAY, reason: RUN });
      assert.strictEqual(r.status, 201, `${r.status} ${r.message}`);
      leaveId = r.data.id;
      cleanups.push(() => prisma.leaveRequest.deleteMany({ where: { id: leaveId } }));
    });
    await test('Subject teacher sees it, view only', async () => {
      const r = await staffApi('GET', '/student-leave', T);
      assert.strictEqual(r.status, 200, `${r.status} ${r.message}`);
      const l = r.data.find((x) => x.id === leaveId);
      assert.ok(l, 'not listed');
      assert.strictEqual(l.canDecide, false);
    });
    await test('…and is refused approving it', async () => {
      const r = await staffApi('PATCH', `/student-leave/${leaveId}`, T, { status: 'APPROVED' });
      assert.strictEqual(r.status, 403, `${r.status} ${r.message}`);
    });
    await test('Class teacher approves it; student sees APPROVED', async () => {
      const list = await staffApi('GET', '/student-leave', C);
      assert.strictEqual(list.data.find((x) => x.id === leaveId)?.canDecide, true, 'class teacher cannot decide');
      const r = await staffApi('PATCH', `/student-leave/${leaveId}`, C, { status: 'APPROVED' });
      assert.strictEqual(r.status, 200, `${r.status} ${r.message}`);
      const mine = await studentApi('GET', '/leave', S);
      assert.strictEqual(mine.data.find((x) => x.id === leaveId)?.status, 'APPROVED');
    });

    // ---------- my classes ----------
    console.log('\n▶ My Classes');
    await test('Class teacher sees both sections in "class teacher of"', async () => {
      const r = await staffApi('GET', '/attendance/class-teacher-sections', C);
      assert.strictEqual(r.status, 200, r.message);
      const ids = r.data.map((s) => s.id);
      assert.ok(ids.includes(secA.id) && ids.includes(secB.id));
    });
  } catch (err) {
    failures++;
    console.error('❌ setup failed:', err.message);
  } finally {
    await prisma.notification.deleteMany({ where: { message: { contains: RUN } } }).catch(() => {});
    for (const fn of cleanups.reverse()) { try { await fn(); } catch (err) { console.error('  ⚠ cleanup:', err.message); } }
    [staffSrv, adminSrv, studentSrv].forEach((s) => s.close());
    const left = await prisma.section.count({ where: { name: { startsWith: RUN } } }) + await prisma.subject.count({ where: { code: { startsWith: RUN } } });
    console.log(`\ncleanup: ${left ? `${left} test record(s) left` : 'all test data removed'}`);
    await prisma.$disconnect();
    console.log(failures ? `❌ ${failures} check(s) failed` : '🎉 Subject-teacher / class-teacher access works as agreed');
    process.exit(failures ? 1 : 0);
  }
})();
