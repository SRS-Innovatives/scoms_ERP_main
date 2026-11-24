/**
 * GET /dashboard/summary — the one-request home screen.
 * Checks the numbers match the full endpoints' rules, and that each section disappears
 * (null) when the institution lacks the module, when Super Admin hid it in the app (mobile
 * gateway only), or when it's a parent section and the caller is a student.
 * No database: the Prisma reads are stubbed.
 */
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED;
delete process.env.RBAC_ENFORCEMENT_ENABLED;

const prisma = require('../shared/database/client');
const { invalidate } = require('../shared/utils/hotCache');
const { ROLES } = require('../shared/constants/roles');
// The staff summary's approvals section asks who decides which section — no DB here
require('../shared/academic/teachingScope').getLeaveApprovalSectionIds = async () => [];
const { getDashboardSummary } = require('../Student_Backend/src/controllers/dashboardSummaryController');

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

// --- stubs ----------------------------------------------------------------------------
let institutionModules = null; // null = legacy "all enabled"
let hiddenRows = [];
const seen = {};
prisma.institution.findUnique = async () => ({ modules: institutionModules });
prisma.institutionAppModuleSetting.findMany = async () => hiddenRows;
prisma.attendanceRecord.groupBy = async () => [
  { status: 'PRESENT', _count: { _all: 15 } },
  { status: 'LATE', _count: { _all: 2 } },
  { status: 'ON_DUTY', _count: { _all: 1 } },
  { status: 'ABSENT', _count: { _all: 2 } },
];
prisma.student.findUnique = async () => ({ course: { name: 'Class 8' }, section: { name: 'A' } });
prisma.assignment.count = async ({ where }) => {
  seen.assignmentCount = (seen.assignmentCount || []).concat([where]);
  return where.submissions ? 2 : 5;
};
prisma.assignment.findFirst = async () => ({ id: 'a1', title: 'Essay', subjectName: 'English', dueDate: new Date() });
prisma.studentFeeAssignment.findMany = async () => [
  { dueAmount: 1000, lateFeeCharged: 50, lateFeeWaived: 0, lateFeePaid: 0 },
  { dueAmount: 0, lateFeeCharged: 20, lateFeeWaived: 20, lateFeePaid: 0 },
  { dueAmount: 500.5, lateFeeCharged: 0, lateFeeWaived: 0, lateFeePaid: 0 },
];
prisma.notification.count = async () => 4;
prisma.notification.findMany = async () => [{ id: 'n1', title: 'Hi', isRead: false, createdAt: new Date() }];
prisma.disciplineRecord.count = async () => 1;
prisma.healthRecord.count = async ({ where }) => (where.referredToHospital ? 0 : 2);

const reset = (mods = null, hidden = []) => {
  institutionModules = mods;
  hiddenRows = hidden.map(([role, moduleKey]) => ({ role, moduleKey, visible: false }));
  invalidate('institutionModules');
  invalidate('appModuleSettings');
};

const call = ({ role = ROLES.STUDENT, baseUrl = '/api/v1/mobile/student', query = {} } = {}) =>
  new Promise((resolve) => {
    const req = { user: { id: 'u1', role, studentId: 'stu-1', institutionId: 'inst-1' }, institutionId: 'inst-1', baseUrl, query };
    const res = { status() { return this; }, json: (payload) => resolve({ ok: true, data: payload.data }) };
    getDashboardSummary(req, res, (err) => resolve({ ok: false, err }));
  });

(async () => {
  await test('numbers: attendance %, pending homework, fee due incl. outstanding late fee, notifications', async () => {
    reset();
    const r = await call();
    assert.ok(r.ok, r.err?.message);
    // attended = PRESENT 15 + LATE 2 + ON_DUTY 1 = 18 of 20
    assert.deepStrictEqual(r.data.attendance, { percentage: 90, presentCount: 18, absentCount: 2, totalClasses: 20 });
    assert.strictEqual(r.data.homework.pending, 2);
    assert.strictEqual(r.data.homework.total, 5);
    const pendingWhere = seen.assignmentCount.find((w) => w.submissions);
    assert.deepStrictEqual(pendingWhere, { institutionId: 'inst-1', className: pendingWhere.className, status: 'PUBLISHED', submissions: { none: { studentId: 'stu-1' } } });
    // 1000 + 500.5 due, + 50 late outstanding (the waived 20 doesn't count)
    assert.deepStrictEqual(r.data.fees, { totalDue: 1550.5, dueAmount: 1500.5, lateFeeDue: 50, openCount: 2 });
    assert.strictEqual(r.data.notifications.unread, 4);
    assert.strictEqual(r.data.parent, null, 'no parent section for a student');
  });

  await test('institution module off → that section is null', async () => {
    reset(['attendance']); // no 'fee'
    const r = await call();
    assert.ok(r.data.attendance);
    assert.strictEqual(r.data.fees, null);
  });

  await test('Super Admin hid fees in the app → null on the mobile gateway, still there on web', async () => {
    reset(null, [[ROLES.STUDENT, 'fees']]);
    assert.strictEqual((await call()).data.fees, null);
    assert.ok((await call({ baseUrl: '/api/v1/student' })).data.fees, 'web portal unaffected');
  });

  await test('?sections= limits what is computed', async () => {
    reset();
    const r = await call({ query: { sections: 'notifications' } });
    assert.strictEqual(r.data.attendance, null);
    assert.strictEqual(r.data.fees, null);
    assert.ok(r.data.notifications);
  });

  await test('parent: parent-corner counts, gated by institution modules', async () => {
    reset();
    const r = await call({ role: ROLES.PARENT });
    assert.deepStrictEqual(r.data.parent, { openDiscipline: 1, recentHealthVisits: 2, recentHospitalReferrals: 0 });
    reset(['attendance', 'fee']); // no discipline / health
    const r2 = await call({ role: ROLES.PARENT });
    assert.deepStrictEqual(r2.data.parent, { openDiscipline: null, recentHealthVisits: null, recentHospitalReferrals: null });
  });

  // --- Staff ---------------------------------------------------------------------------
  const staff = require('../Staff_backend/src/controllers/dashboardSummaryController');
  prisma.timetableEntry.findMany = async ({ where }) => {
    seen.timetableWhere = where;
    return [{
      id: 't1', period: 2, startTime: '10:00', endTime: '10:45', roomNumber: '12', label: null,
      subject: { name: 'Maths' },
      timetable: { section: { id: 's1', name: 'A', semester: { course: { name: 'Class 8' } } } },
    }];
  };
  prisma.assignment.count = async ({ where }) => (where.status ? 3 : 7);
  prisma.assignmentSubmission.count = async ({ where }) => {
    seen.reviewWhere = where;
    return 4;
  };
  prisma.leaveRequest.groupBy = async () => [{ status: 'PENDING', _count: { _all: 2 } }, { status: 'APPROVED', _count: { _all: 5 } }];
  const callStaff = (query = {}) =>
    new Promise((resolve) => {
      const req = { user: { id: 'u2', role: ROLES.TEACHER, staffId: 'st-1', institutionId: 'inst-1' }, institutionId: 'inst-1', query };
      const res = { status() { return this; }, json: (payload) => resolve({ ok: true, data: payload.data }) };
      staff.getDashboardSummary(req, res, (err) => resolve({ ok: false, err }));
    });

  await test('staff: day of week is computed in India time', () => {
    // 2026-11-22 20:00 UTC is already Monday 01:30 in India
    assert.strictEqual(staff.todayDayOfWeek(new Date('2026-11-22T20:00:00Z')), 'MONDAY');
    assert.strictEqual(staff.todayDayOfWeek(new Date('2026-11-22T10:00:00Z')), 'SUNDAY');
  });

  await test("staff: today's classes from the timetable, homework to review, leave by status, unread", async () => {
    reset();
    const r = await callStaff();
    assert.ok(r.ok, r.err?.message);
    assert.strictEqual(seen.timetableWhere.staffId, 'st-1');
    assert.deepStrictEqual(seen.timetableWhere.timetable, { institutionId: 'inst-1' });
    assert.strictEqual(r.data.today.count, 1);
    assert.deepStrictEqual(r.data.today.classes[0], {
      id: 't1', period: 2, startTime: '10:00', endTime: '10:45', roomNumber: '12', subject: 'Maths', sectionId: 's1', className: 'Class 8 - A',
    });
    assert.deepStrictEqual(r.data.homework, { total: 7, active: 3, toReview: 4 });
    assert.deepStrictEqual(seen.reviewWhere, { status: 'SUBMITTED', assignment: { institutionId: 'inst-1', staffId: 'st-1' } });
    assert.deepStrictEqual(r.data.leave, { pending: 2, approved: 5, rejected: 0 });
    assert.strictEqual(r.data.notifications.unread, 4);
  });

  await test('staff: timetable / homework modules off → those sections null', async () => {
    reset(['attendance']);
    const r = await callStaff();
    assert.strictEqual(r.data.today, null);
    assert.strictEqual(r.data.homework, null);
    assert.ok(r.data.leave, 'leave is ungated');
  });

  console.log('Dashboard summary');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
