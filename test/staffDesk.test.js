/**
 * Staff app S5 — desk dashboards and lighter queries:
 *   1. dashboard `desk` section per desk role (counts only), null for other roles, hidden
 *      when Super Admin hides the desk module in the app; "today" is India's day,
 *   2. /hostel/beds: server-side vacant/occupied + search filters and ?page= paging,
 *      unchanged plain array without ?page,
 *   3. /attendance/roster: per-student % from a grouped count, not every record.
 *
 * No database: Prisma calls are stubbed.
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
  fn({ query: {}, body: {}, params: {}, institutionId: 'inst-1', ...req }, { status() { return this; }, json: (b) => resolve(b) }, reject);
});

shared.teachingScope.getLeaveApprovalSectionIds = async () => [];
shared.teachingScope.assertCanViewSection = async () => true;
let hidden = [];
const resetState = () => {
  invalidate('institutionModules');
  invalidate('appModuleSettings');
};
prisma.institution.findUnique = async () => ({ id: 'inst-1', modules: null });
prisma.institutionAppModuleSetting.findMany = async () => hidden.map((moduleKey) => ({ role: 'ALL_STAFF', moduleKey, visible: false }));
prisma.timetableEntry.findMany = async () => [];
prisma.assignment.count = async () => 0;
prisma.assignmentSubmission.count = async () => 0;
prisma.leaveRequest.groupBy = async () => [];
prisma.leaveRequest.count = async () => 0;
prisma.notification.count = async () => 0;
prisma.notification.findMany = async () => [];

(async () => {
  const { getDashboardSummary } = require('../Staff_backend/src/controllers/dashboardSummaryController');
  const desk = (role, baseUrl = '/api/v1/mobile/staff') =>
    call(getDashboardSummary, { baseUrl, query: { sections: 'desk' }, user: { id: 'u1', staffId: 's1', role, institutionId: 'inst-1' } }).then((b) => b.data.desk);

  await test("India's day: 20:00 UTC is already the next day in India", () => {
    const { indiaDay } = require('../Staff_backend/src/controllers/deskSummary');
    const d = indiaDay(new Date('2026-11-23T20:00:00Z'));
    assert.strictEqual(d.ymd, '2026-11-24');
    assert.strictEqual(d.start.toISOString(), '2026-11-23T18:30:00.000Z');
    assert.strictEqual(d.end.getTime() - d.start.getTime(), 86_400_000);
  });

  await test('librarian: issued / overdue / due today / unpaid fines from counts only', async () => {
    resetState();
    hidden = [];
    const wheres = [];
    prisma.bookIssue.count = async ({ where }) => { wheres.push(where); return where.dueDate?.lt && !where.dueDate.gte ? 2 : where.dueDate ? 1 : 9; };
    prisma.bookIssue.aggregate = async () => ({ _count: { _all: 3 }, _sum: { fineAmount: 150 } });
    prisma.bookIssue.findMany = async () => { throw new Error('desk must not load rows'); };
    const d = await desk(ROLES.LIBRARIAN);
    assert.deepStrictEqual(d, { kind: 'library', issued: 9, overdue: 2, dueToday: 1, unpaidFines: 3, unpaidFineAmount: 150 });
    assert.ok(wheres.every((w) => w.status === 'ISSUED' && w.book.institutionId === 'inst-1'), 'scoped to the institution');
  });

  await test('transport, hostel, exam admin, placement desks', async () => {
    resetState();
    prisma.vehicle.count = async () => 4;
    prisma.vehicleTrip.groupBy = async () => [{ session: 'MORNING', _count: { _all: 3 } }];
    assert.deepStrictEqual(await desk(ROLES.TRANSPORT_MANAGER), { kind: 'transport', vehicles: 4, morningDone: 3, eveningDone: 0 });

    prisma.hostelBed.count = async ({ where }) => (where.isOccupied ? 30 : 40);
    assert.deepStrictEqual(await desk(ROLES.HOSTEL_WARDEN), { kind: 'hostel', beds: 40, occupied: 30, vacant: 10 });

    prisma.exam.count = async ({ where }) => (where.endDate ? 1 : 2);
    assert.deepStrictEqual(await desk(ROLES.EXAM_ADMIN), { kind: 'exam_setup', upcoming: 2, ongoing: 1 });

    prisma.jobPosting.count = async () => 5;
    prisma.jobApplication.count = async ({ where }) => (where.status === 'APPLIED' ? 7 : 0);
    assert.deepStrictEqual(await desk(ROLES.PLACEMENT_OFFICER), { kind: 'placement', openPostings: 5, newApplications: 7 });
  });

  await test('no desk for teaching roles; hidden desk module → null in the app, still on the web', async () => {
    resetState();
    assert.strictEqual(await desk(ROLES.TEACHER), null);
    assert.strictEqual(await desk(ROLES.PRINCIPAL), null);
    hidden = ['library'];
    resetState();
    assert.strictEqual(await desk(ROLES.LIBRARIAN), null, 'Super Admin hid Library Desk in the app');
    const web = await desk(ROLES.LIBRARIAN, '/api/v1');
    assert.strictEqual(web.kind, 'library', 'web portal ignores app settings');
    hidden = [];
  });

  await test('hostel beds: filters and paging on the server; plain array without ?page', async () => {
    const ctrl = require('../Staff_backend/src/controllers/hostelController');
    let args = null;
    prisma.hostelBed.findMany = async (a) => { args = a; return [{ id: 'b1' }]; };
    prisma.hostelBed.count = async () => 120;
    const paged = await call(ctrl.getBeds, { query: { page: '2', limit: '50', status: 'vacant', q: '12' } });
    assert.strictEqual(args.where.isOccupied, false);
    assert.ok(Array.isArray(args.where.OR) && args.where.OR.length === 5, 'search across room / bed / student');
    assert.strictEqual(args.skip, 50);
    assert.strictEqual(args.take, 50);
    assert.deepStrictEqual(paged.meta, { page: 2, limit: 50, total: 120, totalPages: 3 });
    assert.ok(args.select && !args.include, 'select only the needed columns');

    const plain = await call(ctrl.getBeds, { query: {} });
    assert.deepStrictEqual(plain.data, [{ id: 'b1' }]);
    assert.strictEqual(args.where.isOccupied, undefined);
    assert.strictEqual(args.skip, undefined);
  });

  await test('roster: attendance % from a grouped count (not every record)', async () => {
    const ctrl = require('../Staff_backend/src/controllers/attendanceController');
    prisma.subjectClassMapping.findFirst = async () => null;
    prisma.subjectClassMapping.findMany = async () => [];
    prisma.subject.findUnique = async () => null;
    prisma.student.findMany = async () => [{ id: 'st1' }, { id: 'st2' }];
    prisma.attendanceRecord.findMany = async () => { throw new Error('roster must not load every record'); };
    prisma.attendanceRecord.groupBy = async () => [
      { studentId: 'st1', status: 'PRESENT', _count: { _all: 3 } },
      { studentId: 'st1', status: 'ABSENT', _count: { _all: 1 } },
    ];
    const { data } = await call(ctrl.getRoster, { query: { sectionId: 'sec-A' }, user: { id: 'u1', staffId: 's1', role: ROLES.TEACHER } });
    assert.strictEqual(data.find((s) => s.id === 'st1').attendancePercent, 75);
    assert.strictEqual(data.find((s) => s.id === 'st2').attendancePercent, null, 'no records → null, not 0');
  });

  console.log('Staff desks & lighter queries');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
