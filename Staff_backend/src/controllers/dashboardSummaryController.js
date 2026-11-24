/**
 * GET /dashboard/summary (staff) — the staff app home screen in ONE request.
 *
 * Replaces four calls (/attendance/my-classes, /assignments, /leave, /notifications) whose
 * full lists were fetched only to be counted — and fixes two numbers the old dashboard got
 * wrong: "Today's classes" now really is today's timetable (it was every class mapping the
 * teacher has), and notifications show the unread count (it was the length of the 5-item
 * recent list).
 *
 * Sections return null when the institution lacks the module the matching route requires
 * (timetable / homework), or when RBAC enforcement is on and the role lacks the route's
 * permission, or — through the staff mobile app — when Super Admin hid the matching app module
 * (App Module Access → Staff App). `?sections=today,homework,leave,notifications` limits what's computed.
 */
const { prisma, sendSuccess, PERMISSIONS, teachingScope } = require('../../../shared');
const { hasPermissionAsync } = require('../../../shared/permissions/permissionMatrix');
const { cachedPermissionClient } = require('../../../shared/utils/hotCache');
const { getInstitutionEnabledModules, isAppModuleVisible } = require('../../../shared/appModules/resolveAppModules');
const { DESKS } = require('./deskSummary');
const { notificationSummary } = require('../../../shared/notifications/notificationSummary');

const ALL_SECTIONS = ['today', 'homework', 'leave', 'notifications', 'approvals', 'desk'];
const TIME_ZONE = 'Asia/Kolkata';

const rbacEnforced = () => process.env.RBAC_ENFORCEMENT_ENABLED === 'true';

/** Through the staff mobile gateway → 'STAFF_APP'; the web portal → null (no app-module check). */
const mobileAppOf = (req) => ((req.baseUrl || '').startsWith('/api/v1/mobile/staff') ? 'STAFF_APP' : null);

/** MONDAY, TUESDAY, … in the institution's time zone — TimetableEntry.dayOfWeek format. */
const todayDayOfWeek = (now = new Date()) => now.toLocaleDateString('en-US', { weekday: 'long', timeZone: TIME_ZONE }).toUpperCase();

const todaySection = async (institutionId, staffId, now) => {
  const entries = await prisma.timetableEntry.findMany({
    where: { staffId, dayOfWeek: todayDayOfWeek(now), timetable: { institutionId } },
    orderBy: { period: 'asc' },
    select: {
      id: true, period: true, startTime: true, endTime: true, roomNumber: true, label: true,
      subject: { select: { name: true } },
      timetable: { select: { section: { select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } } } } },
    },
  });
  const classes = entries.map((e) => ({
    id: e.id,
    period: e.period,
    startTime: e.startTime,
    endTime: e.endTime,
    roomNumber: e.roomNumber,
    subject: e.subject?.name ?? e.label ?? null,
    sectionId: e.timetable?.section?.id ?? null,
    className: [e.timetable?.section?.semester?.course?.name, e.timetable?.section?.name].filter(Boolean).join(' - ') || null,
  }));
  return { day: todayDayOfWeek(now), count: classes.length, classes };
};

const homeworkSection = async (institutionId, staffId) => {
  const mine = { institutionId, staffId };
  const [total, active, toReview] = await Promise.all([
    prisma.assignment.count({ where: mine }),
    prisma.assignment.count({ where: { ...mine, status: 'PUBLISHED', dueDate: { gte: new Date() } } }),
    prisma.assignmentSubmission.count({ where: { status: 'SUBMITTED', assignment: mine } }),
  ]);
  return { total, active, toReview };
};

const leaveSection = async (staffId) => {
  const groups = await prisma.leaveRequest.groupBy({ by: ['status'], where: { staffId }, _count: { _all: true } });
  const by = Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
  return { pending: by.PENDING || 0, approved: by.APPROVED || 0, rejected: by.REJECTED || 0 };
};

/**
 * Things waiting for THIS staff member's decision:
 *   studentLeave — pending student leave in sections they decide for (class teacher / HOD's
 *                  department / Principal & VP: all), same rule as GET /student-leave;
 *   corrections  — pending attendance corrections, only for roles holding attendance.approve
 *                  (the review route checks it strictly), excluding their own requests.
 * A part is null when the user can't act on it.
 */
const approvalsSection = async (req, institutionId, { leave, corrections }) => {
  const [sectionIds, canReview] = await Promise.all([
    leave ? teachingScope.getLeaveApprovalSectionIds(req.user, institutionId) : null,
    corrections ? hasPermissionAsync(cachedPermissionClient, req.user.role, PERMISSIONS.ATTENDANCE_APPROVE) : false,
  ]);
  const [studentLeave, pendingCorrections] = await Promise.all([
    sectionIds
      ? sectionIds.length
        ? prisma.leaveRequest.count({ where: { institutionId, status: 'PENDING', studentId: { not: null }, student: { sectionId: { in: sectionIds } } } })
        : 0
      : null,
    canReview
      ? teachingScope.getCorrectionReviewSectionIds(req.user, institutionId).then((ids) =>
          prisma.attendanceCorrectionRequest.count({
            where: {
              institutionId,
              status: 'PENDING',
              requestedById: { not: req.user.id },
              ...(Array.isArray(ids) && { session: { sectionId: { in: ids } } }), // HOD: own department
            },
          }))
      : null,
  ]);
  if (studentLeave === null && pendingCorrections === null) return null;
  return { studentLeave, corrections: pendingCorrections };
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const requested = String(req.query.sections || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => ALL_SECTIONS.includes(s));
    const want = new Set(requested.length ? requested : ALL_SECTIONS);
    const { staffId } = req.user;
    const institutionId = req.institutionId || req.user.institutionId;
    const enabled = await getInstitutionEnabledModules(institutionId);

    const appKey = mobileAppOf(req);

    const allowed = async (institutionModule, permission, appModule) => {
      if (institutionModule && !enabled.includes(institutionModule)) return false;
      if (permission && rbacEnforced() && !(await hasPermissionAsync(cachedPermissionClient, req.user.role, permission))) return false;
      if (appKey && appModule) return isAppModuleVisible({ institutionId, appKey, role: req.user.role, moduleKey: appModule });
      return true;
    };
    const run = async (name, institutionModule, permission, appModule, fn) => {
      if (!want.has(name) || !staffId) return null;
      if (!(await allowed(institutionModule, permission, appModule))) return null;
      return fn();
    };

    const approvals = async () => {
      if (!want.has('approvals') || !staffId) return null;
      const [leaveOk, correctionsOk] = await Promise.all([
        allowed(null, null, 'student_leave'),
        allowed('attendance', null, 'attendance'),
      ]);
      // A scope lookup failure (e.g. an account with no linked staff profile) must not take
      // the whole home screen down — the approvals tiles just don't show.
      return approvalsSection(req, institutionId, { leave: leaveOk, corrections: correctionsOk }).catch(() => null);
    };

    // desk roles (librarian, warden, ...): their key counts — see deskSummary.js
    const desk = async () => {
      const d = DESKS[req.user.role];
      if (!want.has('desk') || !d) return null;
      if (d.module && !enabled.includes(d.module)) return null;
      if (!(await hasPermissionAsync(cachedPermissionClient, req.user.role, d.permission))) return null;
      if (appKey && !(await isAppModuleVisible({ institutionId, appKey, role: req.user.role, moduleKey: d.appModule }))) return null;
      return d.load(institutionId, new Date()).catch(() => null);
    };

    const [today, homework, leave, notifications, approvalCounts, deskCounts] = await Promise.all([
      run('today', 'timetable', PERMISSIONS.TIMETABLE_VIEW, 'timetable', () => todaySection(institutionId, staffId, new Date())),
      run('homework', 'homework', PERMISSIONS.ASSIGNMENTS_VIEW, 'homework', () => homeworkSection(institutionId, staffId)),
      run('leave', null, null, 'leave', () => leaveSection(staffId)),
      want.has('notifications') ? notificationSummary(req.user.id) : null,
      approvals(),
      desk(),
    ]);

    return sendSuccess(res, { today, homework, leave, notifications, approvals: approvalCounts, desk: deskCounts }, 'Dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary, todayDayOfWeek, ALL_SECTIONS };
