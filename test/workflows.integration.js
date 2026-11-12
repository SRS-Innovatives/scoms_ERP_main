/**
 * End-to-end WORKFLOW test — real multi-role journeys over HTTP against the 4 live apps.
 *
 * Uses the seeded school (Delhi Public International School) and its seeded admin,
 * teacher, student and parent. Creates only what a journey needs (a subject, a teacher
 * assignment, a leave, a homework, ...) and removes/restores ALL of it at the end, even
 * on failure. Each step that fails is reported with the screen/area it breaks.
 *
 * Run: node test/workflows.integration.js     (needs DATABASE_URL with the seed loaded)
 */
require('dotenv').config();
process.env.RBAC_ENFORCEMENT_ENABLED = 'true'; // same as production

const path = require('path');
const { prisma, generateAccessToken, ROLES } = require('../shared');

const ROOT = path.resolve(__dirname, '..');
const RUN = `WF${Date.now().toString(36).toUpperCase()}`;
const startedAt = new Date();
const findings = [];
const cleanups = []; // run in reverse order at the end

const step = async (workflow, name, area, fn) => {
  try {
    const note = await fn();
    findings.push({ workflow, step: name, area, ok: true, note: note || '' });
    console.log(`  ✅ ${name}${note ? ` — ${note}` : ''}`);
    return true;
  } catch (err) {
    findings.push({ workflow, step: name, area, ok: false, note: err.message });
    console.log(`  ❌ ${name}\n     BROKEN AREA: ${area}\n     ${err.message}`);
    return false;
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const listen = (app) => new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
const servers = [];
const bases = {};
const call = async (portal, method, url, token, body) => {
  const res = await fetch(`${bases[portal].base}${bases[portal].prefix}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json, data: json.data };
};
const okOrThrow = (r, what) => expect(r.status >= 200 && r.status < 300, `${what} → HTTP ${r.status}: ${r.body.message || 'no message'}`);

(async () => {
  for (const [key, backend, prefix] of [
    ['admin', 'IntituteAdmin_Backend', '/api/v1/admin'],
    ['staff', 'Staff_backend', '/api/v1/staff'],
    ['student', 'Student_Backend', '/api/v1/student'],
    ['super', 'SuperAdmin_Backend', '/api/v1/super-admin'],
  ]) {
    const s = await listen(require(path.join(ROOT, backend, 'src', 'app')));
    servers.push(s);
    bases[key] = { base: `http://127.0.0.1:${s.address().port}`, prefix };
  }

  // ---------- seeded actors ----------
  const studentUser = await prisma.user.findFirst({ where: { email: 'arun.kumar@student.dpis.edu.in' }, include: { student: true } });
  if (!studentUser?.student) { console.error('❌ Seed not loaded (no arun.kumar student) — run npm run prisma:seed'); process.exit(1); }
  const student = studentUser.student;
  const inst = student.institutionId;
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@dpis-delhi.edu.in' } });
  const teacherUser = await prisma.user.findFirst({ where: { email: 'teacher@dpis-delhi.edu.in' }, include: { staff: true } });
  const parentUser = await prisma.user.findFirst({ where: { email: 'parent.kumar@dpis.edu.in' }, include: { parent: true } });
  const sign = (u, extra = {}) => generateAccessToken({ id: u.id, email: u.email, role: u.role, institutionId: u.institutionId, ...extra });
  const T = {
    admin: sign(adminUser),
    teacher: sign(teacherUser, { staffId: teacherUser.staff.id }),
    student: sign(studentUser, { studentId: student.id }),
    parent: sign(parentUser, { parentId: parentUser.parent.id }),
  };

  try {
    // ---------- shared setup: a subject + this teacher assigned to the student's section ----------
    const subject = await prisma.subject.create({ data: { institutionId: inst, code: `${RUN}-SUB`, name: 'Workflow Test Subject' } });
    cleanups.push(() => prisma.subject.delete({ where: { id: subject.id } }));
    const mapping = await prisma.subjectTeacherMapping.create({ data: { subjectId: subject.id, staffId: teacherUser.staff.id, sectionId: student.sectionId } });
    cleanups.push(() => prisma.subjectTeacherMapping.delete({ where: { id: mapping.id } }));
    const section = await prisma.section.findUnique({ where: { id: student.sectionId } });
    await prisma.section.update({ where: { id: section.id }, data: { classTeacherId: teacherUser.staff.id } });
    cleanups.push(() => prisma.section.update({ where: { id: section.id }, data: { classTeacherId: section.classTeacherId } }));

    // ================= W1 Login =================
    console.log('\n▶ W1 · Every role can sign in with the seeded password');
    for (const [portal, email, label] of [
      ['super', 'superadmin@scoms.in', 'Super Admin'], ['admin', 'admin@dpis-delhi.edu.in', 'Institute Admin'],
      ['staff', 'teacher@dpis-delhi.edu.in', 'Teacher'], ['student', 'arun.kumar@student.dpis.edu.in', 'Student'],
      ['student', 'parent.kumar@dpis.edu.in', 'Parent'],
    ]) {
      await step('W1 Login', `${label} signs in`, `Login page → ${label} portal`, async () => {
        const r = await call(portal, 'POST', '/auth/login', null, { identifier: email, email, password: 'Password@123' });
        okOrThrow(r, 'POST /auth/login');
        expect(r.data?.accessToken, 'login returned no access token');
      });
    }

    // ================= W2 Student leave → class teacher approves =================
    console.log('\n▶ W2 · Student applies for leave → class teacher approves → student sees it approved');
    let leaveId;
    await step('W2 Leave', 'Student applies for leave', 'Student portal → Leave Requests → Apply Leave', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const r = await call('student', 'POST', '/leave', T.student, { type: 'MEDICAL', startDate: today, endDate: today, reason: `${RUN} fever` });
      okOrThrow(r, 'POST /leave');
      leaveId = r.data.id;
      cleanups.push(() => prisma.leaveRequest.deleteMany({ where: { id: leaveId } }));
    });
    await step('W2 Leave', 'Class teacher sees the request', 'Staff portal → Leave → Student Leave Approvals (Teacher role)', async () => {
      const r = await call('staff', 'GET', '/student-leave', T.teacher);
      okOrThrow(r, 'GET /student-leave as TEACHER');
      expect(r.data.some((l) => l.id === leaveId), 'request not in the class teacher\'s list');
    });
    await step('W2 Leave', 'Class teacher approves it', 'Staff portal → Student Leave Approvals → Approve (Teacher role)', async () => {
      const r = await call('staff', 'PATCH', `/student-leave/${leaveId}`, T.teacher, { status: 'APPROVED' });
      okOrThrow(r, 'PATCH /student-leave/:id as TEACHER');
    });
    await step('W2 Leave', 'Student sees it approved', 'Student portal → Leave Requests', async () => {
      const r = await call('student', 'GET', '/leave', T.student);
      okOrThrow(r, 'GET /leave');
      const l = r.data.find((x) => x.id === leaveId);
      expect(l?.status === 'APPROVED', `status is ${l?.status || 'missing'}, expected APPROVED`);
    });

    // ================= W3 Certificate request → admin issues =================
    console.log('\n▶ W3 · Student requests a certificate → admin approves → student sees the issued certificate');
    let requestId;
    await step('W3 Certificate', 'Student requests a Bonafide certificate', 'Student portal → Certificates → Request', async () => {
      const r = await call('student', 'POST', '/certificate-requests', T.student, { type: 'BONAFIDE', reason: `${RUN} bank` });
      okOrThrow(r, 'POST /certificate-requests');
      requestId = r.data.id;
      cleanups.push(() => prisma.certificateRequest.deleteMany({ where: { id: requestId } }));
    });
    let certNo;
    await step('W3 Certificate', 'Admin approves and issues it', 'Institute Admin → Certificates → Certificate Requests → Approve', async () => {
      const list = await call('admin', 'GET', '/certificate-requests', T.admin);
      okOrThrow(list, 'GET /certificate-requests');
      expect(list.data.some((x) => x.id === requestId), 'request not visible to admin');
      const r = await call('admin', 'PATCH', `/certificate-requests/${requestId}`, T.admin, { decision: 'APPROVE' });
      okOrThrow(r, 'PATCH /certificate-requests/:id');
      certNo = r.data?.certificate?.certificateNo;
      cleanups.push(() => prisma.certificate.deleteMany({ where: { certificateNo: certNo } }));
      return `certificate ${certNo}`;
    });
    await step('W3 Certificate', 'Student sees the issued certificate', 'Student portal → Certificates → Issued', async () => {
      const r = await call('student', 'GET', '/certificates', T.student);
      okOrThrow(r, 'GET /certificates');
      expect(r.data.some((c) => c.certificateNo === certNo), 'issued certificate not in the student\'s list');
    });

    // ================= W4 Attendance =================
    console.log('\n▶ W4 · Teacher marks attendance → student sees it; a teacher cannot write into another institution');
    let sessionId;
    await step('W4 Attendance', 'Teacher loads the class roster', 'Staff portal → Attendance → Take Attendance', async () => {
      const r = await call('staff', 'GET', `/attendance/roster?sectionId=${student.sectionId}`, T.teacher);
      okOrThrow(r, 'GET /attendance/roster');
      expect((r.data || []).some((s) => s.id === student.id), 'student missing from roster');
    });
    await step('W4 Attendance', 'Teacher marks the student absent', 'Staff portal → Attendance → Take Attendance → Save', async () => {
      const r = await call('staff', 'POST', '/attendance/mark', T.teacher, {
        sectionId: student.sectionId, subjectId: subject.id, date: new Date().toISOString().slice(0, 10), periodNumber: 7,
        records: [{ studentId: student.id, status: 'ABSENT' }],
      });
      okOrThrow(r, 'POST /attendance/mark');
      sessionId = r.data.id;
      cleanups.push(() => prisma.attendanceSession.deleteMany({ where: { id: sessionId } }));
    });
    await step('W4 Attendance', 'Student sees the absence', 'Student portal → Attendance', async () => {
      const r = await call('student', 'GET', '/attendance', T.student);
      okOrThrow(r, 'GET /attendance');
      expect(JSON.stringify(r.data).length > 2, 'empty attendance summary');
    });
    // cross-tenant: build a section in a throwaway second institution
    const other = await prisma.institution.create({ data: { code: `${RUN}-OTHER`, name: `${RUN} Other School`, type: 'SCHOOL' } });
    cleanups.push(() => prisma.institution.delete({ where: { id: other.id } }));
    const oDept = await prisma.department.create({ data: { institutionId: other.id, code: 'D', name: 'D' } });
    cleanups.push(() => prisma.department.deleteMany({ where: { institutionId: other.id } }));
    const oCourse = await prisma.course.create({ data: { institutionId: other.id, departmentId: oDept.id, code: 'C', name: 'C' } });
    const oYear = await prisma.academicYear.create({ data: { institutionId: other.id, yearName: '2026-27', startDate: new Date('2026-06-01'), endDate: new Date('2027-05-31') } });
    cleanups.push(() => prisma.academicYear.deleteMany({ where: { institutionId: other.id } }));
    const oSem = await prisma.semester.create({ data: { courseId: oCourse.id, academicYearId: oYear.id, name: 'T1', semesterNumber: 1 } });
    const oSection = await prisma.section.create({ data: { semesterId: oSem.id, name: 'A' } });
    await step('W4 Attendance', 'Teacher is REFUSED marking attendance in another institution\'s section', 'Staff API → POST /attendance/mark (security: institution separation)', async () => {
      const r = await call('staff', 'POST', '/attendance/mark', T.teacher, {
        sectionId: oSection.id, date: new Date().toISOString().slice(0, 10), periodNumber: 6, records: [],
      });
      if (r.status < 300) {
        cleanups.push(() => prisma.attendanceSession.deleteMany({ where: { sectionId: oSection.id } }));
        throw new Error(`accepted (HTTP ${r.status}) — an attendance session was written against another institution's section`);
      }
      return `refused with HTTP ${r.status}`;
    });
    await step('W4 Attendance', 'Teacher is REFUSED marking a section they do not teach', 'Staff API → POST /attendance/mark (permission: own classes only)', async () => {
      const otherSection = await prisma.section.findFirst({ where: { id: { not: student.sectionId }, semester: { course: { institutionId: inst } } } });
      if (!otherSection) return 'skipped — the school has only one section';
      const r = await call('staff', 'POST', '/attendance/mark', T.teacher, { sectionId: otherSection.id, subjectId: subject.id, date: new Date().toISOString().slice(0, 10), periodNumber: 6, records: [] });
      if (r.status < 300) {
        cleanups.push(() => prisma.attendanceSession.deleteMany({ where: { sectionId: otherSection.id, periodNumber: 6 } }));
        throw new Error(`accepted (HTTP ${r.status}) for a section this teacher is not assigned to`);
      }
      return `refused with HTTP ${r.status}`;
    });

    // ================= W5 Homework =================
    console.log('\n▶ W5 · Teacher posts homework → student submits → teacher grades → parent and admin can see it');
    let assignmentId;
    let submissionId;
    await step('W5 Homework', 'Teacher posts homework', 'Staff portal → Assignments → Create Assignment', async () => {
      const due = new Date(Date.now() + 3 * 864e5).toISOString();
      const r = await call('staff', 'POST', '/assignments', T.teacher, { title: `${RUN} Chapter 3`, description: 'Exercises 1-5', subjectId: subject.id, sectionId: student.sectionId, dueDate: due, totalMarks: 10 });
      okOrThrow(r, 'POST /assignments');
      assignmentId = r.data.id;
      cleanups.push(() => prisma.assignment.deleteMany({ where: { id: assignmentId } }));
    });
    await step('W5 Homework', 'Student sees and submits it', 'Student portal → Assignments → Submit', async () => {
      const list = await call('student', 'GET', '/assignments', T.student);
      okOrThrow(list, 'GET /assignments');
      expect(list.data.some((a) => a.id === assignmentId), 'new homework not in the student\'s list');
      const r = await call('student', 'POST', '/assignments/submit', T.student, { assignmentId, content: 'My answers' });
      okOrThrow(r, 'POST /assignments/submit');
      submissionId = r.data.id;
    });
    await step('W5 Homework', 'Teacher grades the submission', 'Staff portal → Assignments → Submissions → Evaluate', async () => {
      const r = await call('staff', 'PATCH', `/assignments/submissions/${submissionId}/evaluate`, T.teacher, { marksObtained: 8, feedback: 'Good' });
      okOrThrow(r, 'PATCH /assignments/submissions/:id/evaluate');
    });
    await step('W5 Homework', 'Parent sees the child\'s homework', 'Student portal → Assignments (Parent login)', async () => {
      const r = await call('student', 'GET', '/assignments', T.parent);
      okOrThrow(r, 'GET /assignments as PARENT');
    });
    await step('W5 Homework', 'Institute Admin sees homework', 'Institute Admin → Homework', async () => {
      const r = await call('admin', 'GET', '/homework', T.admin);
      okOrThrow(r, 'GET /homework as INSTITUTE_ADMIN');
    });

    // ================= W6 Exams =================
    console.log('\n▶ W6 · Exam views for each role');
    await step('W6 Exams', 'Student sees exam schedule and results', 'Student portal → Exams', async () => {
      okOrThrow(await call('student', 'GET', '/exams/schedule', T.student), 'GET /exams/schedule');
      okOrThrow(await call('student', 'GET', '/exams/results', T.student), 'GET /exams/results');
    });
    await step('W6 Exams', 'Parent sees the child\'s exam schedule', 'Student portal → Exams → Schedule (Parent login)', async () => {
      okOrThrow(await call('student', 'GET', '/exams/schedule', T.parent), 'GET /exams/schedule as PARENT');
    });
    await step('W6 Exams', 'Parent sees the child\'s results', 'Student portal → Exams → Results (Parent login)', async () => {
      okOrThrow(await call('student', 'GET', '/exams/results', T.parent), 'GET /exams/results as PARENT');
    });
    await step('W6 Exams', 'Institute Admin can open marks entry for an exam schedule', 'Institute Admin → Examination → Marks Entry', async () => {
      const sched = await prisma.examSchedule.findFirst({ where: { exam: { institutionId: inst } } });
      if (!sched) return 'skipped — no exam schedule in the seed';
      okOrThrow(await call('admin', 'GET', `/exam-schedules/${sched.id}/marks`, T.admin), 'GET /exam-schedules/:id/marks as INSTITUTE_ADMIN');
    });

    // ================= W7 Online fee payment =================
    console.log('\n▶ W7 · Student pays fees online (gateway in test mode) — amount and replay protection');
    const fee = await prisma.studentFeeAssignment.findFirst({ where: { studentId: student.id, dueAmount: { gt: 1 } } });
    if (!fee) console.log('  ⚠ skipped — the student has no outstanding fee');
    else {
      const snapshot = { paidAmount: fee.paidAmount, dueAmount: fee.dueAmount, status: fee.status };
      const createdPayments = [];
      cleanups.push(async () => {
        await prisma.feeReceipt.deleteMany({ where: { paymentId: { in: createdPayments } } });
        await prisma.feePayment.deleteMany({ where: { id: { in: createdPayments } } });
        await prisma.studentFeeAssignment.update({ where: { id: fee.id }, data: snapshot });
      });
      let order;
      await step('W7 Fees', 'Student starts a ₹1 payment', 'Student portal → Pay Fees', async () => {
        const r = await call('student', 'POST', '/fees/pay/initiate', T.student, { studentFeeAssignmentId: fee.id, amount: 1 });
        okOrThrow(r, 'POST /fees/pay/initiate');
        order = r.data;
        expect(order.simulated, 'gateway is LIVE in this environment — refusing to continue the payment test');
        return `order ${order.orderId} (test mode)`;
      });
      if (order?.simulated) {
        const verifyBody = (amountPaid) => ({ studentFeeAssignmentId: fee.id, amountPaid, razorpayOrderId: order.orderId, razorpayPaymentId: order.paymentId, razorpaySignature: order.signature });
        await step('W7 Fees', 'Paying ₹1 must NOT record the full due amount as paid', 'Student API → POST /fees/pay/verify (security: amount tampering)', async () => {
          const r = await call('student', 'POST', '/fees/pay/verify', T.student, verifyBody(fee.dueAmount));
          if (r.data?.payment?.id) createdPayments.push(r.data.payment.id);
          const after = await prisma.studentFeeAssignment.findUnique({ where: { id: fee.id } });
          if (r.status < 300 && after.paidAmount >= snapshot.paidAmount + fee.dueAmount) {
            throw new Error(`a ₹1 order was accepted as ₹${fee.dueAmount} — fee marked ${after.status} (paid ₹${after.paidAmount} of ₹${after.totalAmount - after.discountAmount})`);
          }
          return `refused or credited ₹1 only (HTTP ${r.status})`;
        });
        await step('W7 Fees', 'Re-sending the same payment confirmation must NOT be credited twice', 'Student API → POST /fees/pay/verify (security: replay)', async () => {
          const first = await call('student', 'POST', '/fees/pay/verify', T.student, verifyBody(1));
          if (first.data?.payment?.id) createdPayments.push(first.data.payment.id);
          const second = await call('student', 'POST', '/fees/pay/verify', T.student, verifyBody(1));
          if (second.data?.payment?.id) createdPayments.push(second.data.payment.id);
          if (second.status < 300) throw new Error('the same Razorpay payment id was accepted again and credited a second time');
          return `second attempt refused (HTTP ${second.status})`;
        });
      }
    }
  } finally {
    // notifications the journeys triggered for the seeded users
    await prisma.notification.deleteMany({ where: { createdAt: { gte: startedAt }, OR: [{ institutionId: (await prisma.user.findUnique({ where: { id: studentUser.id } })).institutionId }, { userId: { in: [studentUser.id, teacherUser.id, parentUser.id, adminUser.id] } }] } }).catch(() => {});
    for (const fn of cleanups.reverse()) {
      try { await fn(); } catch (err) { console.error('  ⚠ cleanup step failed:', err.message); }
    }
    servers.forEach((s) => s.close());
    const broken = findings.filter((f) => !f.ok);
    console.log(`\n${findings.length - broken.length}/${findings.length} workflow steps passed.`);
    if (process.argv.includes('--json')) console.log(JSON.stringify(findings, null, 2));
    await prisma.$disconnect();
    process.exit(broken.length ? 1 : 0);
  }
})();
