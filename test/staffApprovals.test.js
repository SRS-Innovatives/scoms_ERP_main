/**
 * Staff app S4 P1 backend changes:
 *   1. student leave decisions notify the student AND their linked parents,
 *   2. staff announcements include the ones the staff member posted (any audience),
 *   3. the shared academic calendar range returns events OVERLAPPING [from, to],
 *   4. the staff dashboard summary's `approvals` section: student leave in the sections I
 *      decide, attendance corrections only with attendance.approve, never my own requests.
 *
 * No database: Prisma calls and the shared helpers are stubbed.
 */
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED;
delete process.env.RBAC_ENFORCEMENT_ENABLED;

const shared = require('../shared');
const prisma = require('../shared/database/client');
const { ROLES } = require('../shared/constants/roles');
const { invalidate } = require('../shared/utils/hotCache');

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
  fn(req, { status() { return this; }, json: (body) => resolve(body) }, reject);
});

// Shared stubs (set BEFORE the controllers are required — they destructure on load)
const pushed = [];
shared.pushNotificationToMany = async (args) => { pushed.push(args); return args.userIds.length; };
let decideSections = ['sec-A'];
shared.teachingScope.getLeaveApprovalSectionIds = async () => decideSections;
shared.teachingScope.getStaffScope = async () => ({ assignments: [] });
// Principal / VP → null (whole institution); HOD → their department (decideSections here)
shared.teachingScope.getCorrectionReviewSectionIds = async (user) => ([ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL].includes(user.role) ? null : decideSections);

(async () => {
  await test('leave decision notifies the student and every linked parent', async () => {
    pushed.length = 0;
    const ctrl = require('../Staff_backend/src/controllers/studentLeaveController');
    prisma.leaveRequest.findFirst = async () => ({
      id: 'l1',
      startDate: new Date('2026-11-24'),
      endDate: new Date('2026-11-25'),
      student: { sectionId: 'sec-A', userId: 'stu-u', firstName: 'Aarav', parents: [{ parent: { userId: 'par-1' } }, { parent: { userId: 'par-2' } }] },
    });
    prisma.leaveRequest.update = async ({ data }) => ({ id: 'l1', ...data });
    const body = await call(ctrl.updateStudentLeaveStatus, {
      params: { id: 'l1' }, body: { status: 'APPROVED' }, institutionId: 'inst-1', user: { id: 'u-t', email: 't@x', role: ROLES.TEACHER },
    });
    assert.strictEqual(body.data.status, 'APPROVED');
    await new Promise((r) => setImmediate(r));
    const toStudent = pushed.find((p) => p.userIds.includes('stu-u'));
    const toParents = pushed.find((p) => p.userIds.includes('par-1'));
    assert.ok(toStudent && /Your leave request/.test(toStudent.message), 'student notified');
    assert.ok(toParents, 'parents notified');
    assert.deepStrictEqual(toParents.userIds.sort(), ['par-1', 'par-2']);
    assert.ok(/Aarav's leave request/.test(toParents.message), 'parent message names the child');
  });

  await test('leave decision outside my sections is refused; no notification', async () => {
    pushed.length = 0;
    const ctrl = require('../Staff_backend/src/controllers/studentLeaveController');
    decideSections = ['sec-B'];
    const err = await call(ctrl.updateStudentLeaveStatus, {
      params: { id: 'l1' }, body: { status: 'REJECTED' }, institutionId: 'inst-1', user: { id: 'u-t', email: 't@x', role: ROLES.TEACHER },
    }).then(() => null, (e) => e);
    assert.ok(err && /class teacher/.test(err.message));
    assert.strictEqual(pushed.length, 0);
    decideSections = ['sec-A'];
  });

  await test('staff announcements: ALL/STAFF notices plus my own posts', async () => {
    let where = null;
    prisma.announcement.findMany = async (args) => { where = args.where; return []; };
    prisma.announcement.count = async () => 0;
    const ctrl = require('../Staff_backend/src/controllers/announcementController');
    await call(ctrl.getAnnouncements, { institutionId: 'inst-1', user: { id: 'u-t' }, query: {} });
    const json = JSON.stringify(where);
    assert.ok(json.includes('"authorId":"u-t"'), 'own posts included');
    assert.ok(json.includes('"STAFF"') && json.includes('"ALL"'), 'staff/all notices included');
    assert.ok(json.includes('"institutionId":"inst-1"'), 'still scoped to the institution');
  });

  await test('calendar range: overlap filter, validation, both backends use it', async () => {
    const { rangeFilter, listCalendarEvents } = require('../shared/academic/calendarEvents');
    const from = new Date('2026-11-01');
    const to = new Date('2026-11-30');
    assert.deepStrictEqual(rangeFilter(from, to), [
      { startDate: { lte: to } },
      { OR: [{ endDate: { gte: from } }, { endDate: null, startDate: { gte: from } }] },
    ]);
    let args = null;
    prisma.academicCalendarEvent.findMany = async (a) => { args = a; return []; };
    await listCalendarEvents('inst-1', { from: '2026-11-01', to: '2026-11-30' });
    assert.strictEqual(args.where.AND.length, 2, 'from AND to both applied');
    const bad = await listCalendarEvents('inst-1', { from: '2026-11-30', to: '2026-11-01' }).then(() => null, (e) => e);
    assert.ok(bad && /before/.test(bad.message));
    const junk = await listCalendarEvents('inst-1', { from: 'nope' }).then(() => null, (e) => e);
    assert.ok(junk && /valid date/.test(junk.message));
    const staff = require('../Staff_backend/src/controllers/academicCalendarController');
    const student = require('../Student_Backend/src/controllers/academicCalendarController');
    for (const c of [staff, student]) {
      args = null;
      await call(c.getEvents, { institutionId: 'inst-1', query: { from: '2026-11-01' } });
      assert.ok(args && args.where.AND, 'controller goes through the shared query');
    }
  });

  await test('dashboard approvals: leave count in my sections; corrections only for reviewers, never my own', async () => {
    invalidate('institutionModules');
    invalidate('appModuleSettings');
    prisma.institution.findUnique = async () => ({ id: 'inst-1', modules: null });
    prisma.institutionAppModuleSetting.findMany = async () => [];
    prisma.timetableEntry.findMany = async () => [];
    prisma.assignment.count = async () => 0;
    prisma.assignmentSubmission.count = async () => 0;
    prisma.leaveRequest.groupBy = async () => [];
    prisma.notification.count = async () => 0;
    prisma.notification.findMany = async () => [];
    let leaveWhere = null;
    let corrWhere = null;
    prisma.leaveRequest.count = async ({ where }) => { leaveWhere = where; return 3; };
    prisma.attendanceCorrectionRequest.count = async ({ where }) => { corrWhere = where; return 2; };
    const { getDashboardSummary } = require('../Staff_backend/src/controllers/dashboardSummaryController');
    const run = (role, baseUrl = '/api/v1/mobile/staff') =>
      call(getDashboardSummary, { baseUrl, query: { sections: 'approvals' }, user: { id: 'me', staffId: 's1', role, institutionId: 'inst-1' } }).then((b) => b.data.approvals);

    const teacher = await run(ROLES.TEACHER);
    assert.deepStrictEqual(teacher, { studentLeave: 3, corrections: null }, 'teacher: no attendance.approve');
    assert.deepStrictEqual(leaveWhere.student.sectionId.in, ['sec-A']);
    assert.strictEqual(leaveWhere.status, 'PENDING');

    const hod = await run(ROLES.HOD);
    assert.deepStrictEqual(hod, { studentLeave: 3, corrections: 2 });
    assert.deepStrictEqual(corrWhere.requestedById, { not: 'me' }, 'own requests excluded');

    const librarian = await run(ROLES.LIBRARIAN);
    assert.strictEqual(librarian, null, 'nothing to approve → section is null in the app');

    decideSections = [];
    const noSections = await run(ROLES.TEACHER);
    assert.deepStrictEqual(noSections, { studentLeave: 0, corrections: null }, 'no class → 0 without a query');
    decideSections = ['sec-A'];
  });

  await test('corrections: HOD sees / reviews only their department; Principal the whole institution', async () => {
    const ctrl = require('../Staff_backend/src/controllers/attendanceController');
    decideSections = ['dept-1', 'dept-2'];

    let listWhere = null;
    prisma.attendanceCorrectionRequest.findMany = async ({ where }) => { listWhere = where; return []; };
    prisma.user.findMany = async () => [];
    await call(ctrl.getPendingCorrections, { institutionId: 'inst-1', query: {}, user: { id: 'hod', role: ROLES.HOD } });
    assert.deepStrictEqual(listWhere.session, { sectionId: { in: ['dept-1', 'dept-2'] } }, 'HOD: own department');

    await call(ctrl.getPendingCorrections, { institutionId: 'inst-1', query: {}, user: { id: 'p', role: ROLES.PRINCIPAL } });
    assert.strictEqual(listWhere.session, undefined, 'Principal: no section filter');

    // review of a correction outside the HOD's department → not found, nothing changes
    let reviewWhere = null;
    prisma.attendanceCorrectionRequest.findFirst = async ({ where }) => { reviewWhere = where; return null; };
    prisma.attendanceCorrectionRequest.update = async () => { throw new Error('must not update'); };
    const err = await call(ctrl.reviewCorrectionRequest, {
      institutionId: 'inst-1', params: { id: 'c1' }, body: { decision: 'APPROVE' }, user: { id: 'hod', role: ROLES.HOD },
    }).then(() => null, (e) => e);
    assert.ok(err && /not found/i.test(err.message));
    assert.deepStrictEqual(reviewWhere.session, { sectionId: { in: ['dept-1', 'dept-2'] } });

    // Institute Admin's list (no sectionIds) stays institution-wide
    const rules = require('../shared/attendance/attendanceRules');
    await rules.listCorrectionRequests({ institutionId: 'inst-1', status: 'PENDING' });
    assert.strictEqual(listWhere.session, undefined);

    decideSections = ['sec-A'];
  });

  await test('teachers hold ptm.manage (PTM notes)', () => {
    const { ROLE_PERMISSIONS } = require('../shared/permissions/permissionMatrix');
    const { PERMISSIONS } = require('../shared/constants/roles');
    assert.ok(ROLE_PERMISSIONS[ROLES.TEACHER].includes(PERMISSIONS.PTM_MANAGE));
  });

  console.log('Staff approvals & notices');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
