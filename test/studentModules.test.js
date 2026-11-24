/**
 * Student/parent modules behind the Phase 4 app screens: Leave, Announcements,
 * Academic Calendar. Locks in the fixes made with them:
 *   - leave: dates validated, end ≥ start, only the institution's leave types,
 *   - announcements: a parent also gets PARENTS-targeted announcements,
 *   - calendar: from+to both apply, and an event running into the range is included.
 * No database: the Prisma calls are stubbed.
 */
const assert = require('assert');

const prisma = require('../shared/database/client');
const { ROLES } = require('../shared/constants/roles');

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

const call = (handler, { role = ROLES.STUDENT, body = {}, query = {} } = {}) =>
  new Promise((resolve) => {
    const req = { user: { id: 'u1', role, studentId: 'stu-1', institutionId: 'inst-1' }, institutionId: 'inst-1', body, query };
    const res = { status() { return this; }, json: (payload) => resolve({ ok: true, data: payload.data }) };
    handler(req, res, (err) => resolve({ ok: false, err }));
  });

let created;
prisma.institutionCustomList.findMany = async () => []; // → default leave types
prisma.leaveRequest.create = async ({ data }) => {
  created = data;
  return { id: 'l1', ...data };
};
// notifyLeaveApprovers is best-effort and fire-and-forget; give it empty results
prisma.student.findUnique = async () => ({ courseId: 'c1', sectionId: 's1', firstName: 'A', lastName: 'B', section: null });
prisma.user.findMany = async () => [];
prisma.section.findUnique = async () => null;

let announcementWhere;
prisma.announcement.findMany = async (args) => {
  announcementWhere = args.where;
  return [];
};
prisma.announcement.count = async () => 0;

let calendarWhere;
prisma.academicCalendarEvent.findMany = async (args) => {
  calendarWhere = args.where;
  return [];
};

(async () => {
  const leave = require('../Student_Backend/src/controllers/leaveController');
  const announcements = require('../Student_Backend/src/controllers/announcementController');
  const calendar = require('../Student_Backend/src/controllers/academicCalendarController');

  await test('leave: valid request is created with trimmed reason', async () => {
    const r = await call(leave.applyLeave, { body: { type: 'MEDICAL', startDate: '2026-12-01', endDate: '2026-12-03', reason: '  fever  ' } });
    assert.ok(r.ok, r.err?.message);
    assert.strictEqual(created.type, 'MEDICAL');
    assert.strictEqual(created.reason, 'fever');
  });

  await test('leave: end before start is refused', async () => {
    const r = await call(leave.applyLeave, { body: { type: 'CASUAL', startDate: '2026-12-05', endDate: '2026-12-01', reason: 'x' } });
    assert.ok(!r.ok && /before/.test(r.err.message));
  });

  await test('leave: invalid date and unknown type are refused', async () => {
    const bad = await call(leave.applyLeave, { body: { startDate: 'nope', endDate: '2026-12-01', reason: 'x' } });
    assert.ok(!bad.ok && /valid date/.test(bad.err.message));
    const unknown = await call(leave.applyLeave, { body: { type: 'VACATION', startDate: '2026-12-01', endDate: '2026-12-01', reason: 'x' } });
    assert.ok(!unknown.ok && /Unknown leave type/.test(unknown.err.message));
  });

  await test('leave: missing type falls back to CASUAL', async () => {
    const r = await call(leave.applyLeave, { body: { startDate: '2026-12-01', endDate: '2026-12-01', reason: 'x' } });
    assert.ok(r.ok, r.err?.message);
    assert.strictEqual(created.type, 'CASUAL');
  });

  await test('announcements: student gets ALL+STUDENTS, parent also gets PARENTS', async () => {
    await call(announcements.getAnnouncements);
    assert.deepStrictEqual(announcementWhere.targetRole, { in: ['ALL', 'STUDENTS'] });
    await call(announcements.getAnnouncements, { role: ROLES.PARENT });
    assert.deepStrictEqual(announcementWhere.targetRole, { in: ['ALL', 'STUDENTS', 'PARENTS'] });
  });

  await test('calendar: from AND to both apply, overlapping events included', async () => {
    const r = await call(calendar.getEvents, { query: { from: '2026-12-01', to: '2026-12-31' } });
    assert.ok(r.ok, r.err?.message);
    assert.strictEqual(calendarWhere.institutionId, 'inst-1');
    assert.deepStrictEqual(calendarWhere.AND[0], { startDate: { lte: new Date('2026-12-31') } });
    assert.deepStrictEqual(calendarWhere.AND[1], {
      OR: [{ endDate: { gte: new Date('2026-12-01') } }, { endDate: null, startDate: { gte: new Date('2026-12-01') } }],
    });
  });

  await test('calendar: no range → all events; bad date → 400', async () => {
    await call(calendar.getEvents);
    assert.deepStrictEqual(calendarWhere, { institutionId: 'inst-1' });
    const bad = await call(calendar.getEvents, { query: { from: 'garbage' } });
    assert.ok(!bad.ok && bad.err.statusCode === 400);
  });

  console.log('Student modules');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
