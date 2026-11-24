/**
 * The "desk" part of GET /dashboard/summary for the non-teaching desk roles — only COUNTS
 * (and one SUM), never lists, so a librarian / warden / transport manager / exam admin /
 * placement officer gets their key numbers inside the same single home-screen request.
 *
 * Each desk is tied to the permission its screen's routes check; the permission is checked
 * ALWAYS (not only under RBAC enforcement) so another role never triggers these queries.
 */
const { prisma, PERMISSIONS } = require('../../../shared');

const TIME_ZONE = 'Asia/Kolkata';

/** Today's date (YYYY-MM-DD) in India, plus that day's [start, end) as instants. */
const indiaDay = (now = new Date()) => {
  const ymd = now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE }); // en-CA → 2026-11-23
  const start = new Date(`${ymd}T00:00:00+05:30`);
  return { ymd, start, end: new Date(start.getTime() + 86_400_000) };
};

const library = async (institutionId, now) => {
  const { start, end } = indiaDay(now);
  const issued = { status: 'ISSUED', book: { institutionId } };
  const [active, overdue, dueToday, fines] = await Promise.all([
    prisma.bookIssue.count({ where: issued }),
    prisma.bookIssue.count({ where: { ...issued, dueDate: { lt: start } } }),
    prisma.bookIssue.count({ where: { ...issued, dueDate: { gte: start, lt: end } } }),
    prisma.bookIssue.aggregate({
      where: { status: 'RETURNED', fineAmount: { gt: 0 }, finePaid: false, book: { institutionId } },
      _count: { _all: true },
      _sum: { fineAmount: true },
    }),
  ]);
  return { kind: 'library', issued: active, overdue, dueToday, unpaidFines: fines._count._all, unpaidFineAmount: fines._sum.fineAmount || 0 };
};

const transport = async (institutionId, now) => {
  const { ymd } = indiaDay(now);
  const [vehicles, done] = await Promise.all([
    prisma.vehicle.count({ where: { institutionId } }),
    prisma.vehicleTrip.groupBy({
      by: ['session'],
      where: { tripDate: new Date(ymd), status: 'COMPLETED', vehicle: { institutionId } },
      _count: { _all: true },
    }),
  ]);
  const by = Object.fromEntries(done.map((g) => [g.session, g._count._all]));
  return { kind: 'transport', vehicles, morningDone: by.MORNING || 0, eveningDone: by.EVENING || 0 };
};

const hostel = async (institutionId) => {
  const inInst = { hostel: { institutionId } };
  const [beds, occupied] = await Promise.all([
    prisma.hostelBed.count({ where: inInst }),
    prisma.hostelBed.count({ where: { ...inInst, isOccupied: true } }),
  ]);
  return { kind: 'hostel', beds, occupied, vacant: beds - occupied };
};

const examSetup = async (institutionId, now) => {
  const [upcoming, ongoing] = await Promise.all([
    prisma.exam.count({ where: { institutionId, startDate: { gt: now } } }),
    prisma.exam.count({ where: { institutionId, startDate: { lte: now }, endDate: { gte: now } } }),
  ]);
  return { kind: 'exam_setup', upcoming, ongoing };
};

const placement = async (institutionId) => {
  const [openPostings, newApplications] = await Promise.all([
    prisma.jobPosting.count({ where: { institutionId, status: 'OPEN' } }),
    prisma.jobApplication.count({ where: { status: 'APPLIED', jobPosting: { institutionId } } }),
  ]);
  return { kind: 'placement', openPostings, newApplications };
};

/** role → desk: institution module (requireModule), permission, Staff App module, loader */
const DESKS = {
  LIBRARIAN: { module: 'library', permission: PERMISSIONS.LIBRARY_MANAGE, appModule: 'library', load: library },
  TRANSPORT_MANAGER: { module: 'transport', permission: PERMISSIONS.TRANSPORT_MANAGE, appModule: 'transport', load: transport },
  HOSTEL_WARDEN: { module: 'hostel', permission: PERMISSIONS.HOSTEL_MANAGE, appModule: 'hostel', load: hostel },
  EXAM_ADMIN: { module: 'examination', permission: PERMISSIONS.EXAMS_CREATE, appModule: 'exam_setup', load: examSetup },
  PLACEMENT_OFFICER: { module: 'placement', permission: PERMISSIONS.PLACEMENT_MANAGE, appModule: 'placement', load: placement },
};

module.exports = { DESKS, indiaDay };
