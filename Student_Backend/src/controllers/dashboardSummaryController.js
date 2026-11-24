/**
 * GET /dashboard/summary — everything the app's home screen shows, in ONE request built
 * from counts and sums instead of five full lists.
 *
 * Before this, the mobile dashboard called /attendance (every attendance record with its
 * session + subject), /assignments, /fees (credit auto-apply + instalments + a late-fee
 * recalculation per fee, sequentially), /notifications and /notifications/unread-count —
 * and threw almost all of it away to show four numbers.
 *
 * Each section is independent and returns null when it isn't available to the caller:
 *   - the institution doesn't have the module (same requireModule() rule as its route),
 *   - RBAC enforcement is on and the role lacks the route's permission,
 *   - (mobile gateway only) Super Admin hid that module in the app for this role.
 * `?sections=attendance,homework,fees,notifications,parent` limits what's computed.
 *
 * Numbers match the full endpoints: attendance % uses the same ATTENDED_STATUSES and the
 * same "no classes yet = 100%" rule as getAttendanceSummary; pending homework counts
 * PUBLISHED assignments for the student's class with no submission, like
 * getMyAssignments; fee due is the stored dueAmount sum (the fee page also applies
 * credit / late fees when opened — this summary deliberately doesn't write anything).
 */
const { prisma, sendSuccess, formatClassLabel, ROLES, PERMISSIONS, attendanceRules } = require('../../../shared');
const { hasPermissionAsync } = require('../../../shared/permissions/permissionMatrix');
const { cachedPermissionClient } = require('../../../shared/utils/hotCache');
const { getInstitutionEnabledModules, isAppModuleVisible } = require('../../../shared/appModules/resolveAppModules');
const { notificationSummary } = require('../../../shared/notifications/notificationSummary');

const ALL_SECTIONS = ['attendance', 'homework', 'fees', 'notifications', 'parent'];
const MOBILE_APP_BY_PREFIX = [['/api/v1/mobile/student', 'STUDENT_APP']];
const DAY = 86_400_000;

const rbacEnforced = () => process.env.RBAC_ENFORCEMENT_ENABLED === 'true';

/** The mobile app this request came through, or null for the web portal. */
const mobileAppOf = (req) => (MOBILE_APP_BY_PREFIX.find(([p]) => (req.baseUrl || '').startsWith(p)) || [])[1] || null;

const makeGate = async (req) => {
  const institutionId = req.institutionId || req.user.institutionId;
  const enabled = await getInstitutionEnabledModules(institutionId);
  const appKey = mobileAppOf(req);
  /** institutionModule: the requireModule() key on the matching route (null = ungated) */
  return async ({ institutionModule, permission, appModule }) => {
    if (institutionModule && !enabled.includes(institutionModule)) return false;
    if (permission && rbacEnforced() && !(await hasPermissionAsync(cachedPermissionClient, req.user.role, permission))) return false;
    if (appKey && appModule) {
      return isAppModuleVisible({ institutionId, appKey, role: req.user.role, moduleKey: appModule });
    }
    return true;
  };
};

const attendanceSection = async (studentId) => {
  const groups = await prisma.attendanceRecord.groupBy({ by: ['status'], where: { studentId }, _count: { _all: true } });
  const totalClasses = groups.reduce((s, g) => s + g._count._all, 0);
  const presentCount = groups.filter((g) => attendanceRules.isAttended(g.status)).reduce((s, g) => s + g._count._all, 0);
  const percentage = totalClasses > 0 ? Number(((presentCount / totalClasses) * 100).toFixed(1)) : 100;
  return { percentage, presentCount, absentCount: totalClasses - presentCount, totalClasses };
};

const homeworkSection = async (institutionId, studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { course: { select: { name: true } }, section: { select: { name: true } } },
  });
  if (!student?.course || !student?.section) return { pending: 0, total: 0, nextDue: null };
  const where = { institutionId, className: formatClassLabel(student.course.name, student.section.name), status: 'PUBLISHED' };
  const pendingWhere = { ...where, submissions: { none: { studentId } } };
  const [total, pending, next] = await Promise.all([
    prisma.assignment.count({ where }),
    prisma.assignment.count({ where: pendingWhere }),
    prisma.assignment.findFirst({
      where: { ...pendingWhere, dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      select: { id: true, title: true, subjectName: true, dueDate: true },
    }),
  ]);
  return { pending, total, nextDue: next };
};

/** Same total as getFeeBadge: due amount + outstanding late fee already charged. Late fees
 * aren't recalculated here (that's a write — the fee page does it when opened). */
const feesSection = async (studentId) => {
  const rows = await prisma.studentFeeAssignment.findMany({
    where: { studentId },
    select: { dueAmount: true, lateFeeCharged: true, lateFeeWaived: true, lateFeePaid: true },
  });
  let dueAmount = 0;
  let lateFeeDue = 0;
  let openCount = 0;
  for (const f of rows) {
    const late = Math.max(0, f.lateFeeCharged - f.lateFeeWaived - f.lateFeePaid);
    if (f.dueAmount > 0 || late > 0) openCount += 1;
    dueAmount += f.dueAmount;
    lateFeeDue += late;
  }
  const round2 = (n) => Math.round(n * 100) / 100;
  return { totalDue: round2(dueAmount + lateFeeDue), dueAmount: round2(dueAmount), lateFeeDue: round2(lateFeeDue), openCount };
};

const notificationsSection = (userId) => notificationSummary(userId);

const parentSection = async (gate, institutionId, studentId) => {
  const scope = { institutionId, studentId };
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const [showDiscipline, showHealth] = await Promise.all([
    gate({ institutionModule: 'discipline', appModule: 'discipline' }),
    gate({ institutionModule: 'health', appModule: 'health' }),
  ]);
  const [openDiscipline, recentVisits, recentReferrals] = await Promise.all([
    showDiscipline ? prisma.disciplineRecord.count({ where: { ...scope, status: 'OPEN' } }) : null,
    showHealth ? prisma.healthRecord.count({ where: { ...scope, visitDate: { gte: weekAgo } } }) : null,
    showHealth ? prisma.healthRecord.count({ where: { ...scope, visitDate: { gte: weekAgo }, referredToHospital: true } }) : null,
  ]);
  return { openDiscipline, recentHealthVisits: recentVisits, recentHospitalReferrals: recentReferrals };
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const requested = String(req.query.sections || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => ALL_SECTIONS.includes(s));
    const want = new Set(requested.length ? requested : ALL_SECTIONS);
    const institutionId = req.institutionId || req.user.institutionId;
    const { studentId } = req.user;
    const gate = await makeGate(req);

    const run = async (name, rule, fn) => {
      if (!want.has(name) || !studentId) return null;
      if (rule && !(await gate(rule))) return null;
      return fn();
    };

    const [attendance, homework, fees, notifications, parent] = await Promise.all([
      run('attendance', { institutionModule: 'attendance', permission: PERMISSIONS.ATTENDANCE_VIEW, appModule: 'attendance' }, () => attendanceSection(studentId)),
      run('homework', { permission: PERMISSIONS.ASSIGNMENTS_VIEW, appModule: 'homework' }, () => homeworkSection(institutionId, studentId)),
      run('fees', { institutionModule: 'fee', permission: PERMISSIONS.FEES_VIEW, appModule: 'fees' }, () => feesSection(studentId)),
      want.has('notifications') ? notificationsSection(req.user.id) : null,
      req.user.role === ROLES.PARENT ? run('parent', null, () => parentSection(gate, institutionId, studentId)) : null,
    ]);

    return sendSuccess(res, { attendance, homework, fees, notifications, parent }, 'Dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary, ALL_SECTIONS };
