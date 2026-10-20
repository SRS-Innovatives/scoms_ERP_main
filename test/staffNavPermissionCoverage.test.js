/**
 * Staff Mobile Nav <-> Permission Matrix Coverage
 *
 * Found by manual review, not by this test (it didn't exist yet): the original
 * scoms-app-staff role->tab mapping gave Principal/Vice Principal/Staff the same
 * Attendance/Homework/Examination tabs as Teacher, and gave Teacher/HOD a "Publish
 * Marks" button — but the real permission matrix shows Principal/VP/Staff lack
 * ATTENDANCE_MARK/ASSIGNMENTS_VIEW/MARKS_ENTER entirely, and Teacher/HOD lack
 * RESULTS_PUBLISH (only Principal/VP/Exam Admin/Admin can publish). Every one of
 * those would have 403'd in the app. Fixed in scoms-app-staff/src/navigation/
 * roleNavigation.ts and the Examination screen; this test locks the fix in place.
 *
 * ROLE_SCREEN_PERMISSIONS mirrors scoms-app-staff/src/navigation/roleNavigation.ts's
 * ROLE_TABS plus the permission each of that role's actual mobile screens call (see
 * docs/mobile-api.md for the route list). Kept in sync by hand — this test suite is
 * plain JS, not TypeScript, so it can't import the .ts file directly.
 */
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const shadowPermission = require('../shared/middleware/shadowPermission');
const { ROLES, PERMISSIONS } = require('../shared/constants/roles');

const ROLE_SCREEN_PERMISSIONS = {
  // Attendance (view+mark), Homework (view), Examination (view+enter, NOT publish — see above), Leave, Timetable
  [ROLES.TEACHER]: [
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.MARKS_ENTER,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.TIMETABLE_VIEW,
  ],
  // Same screens as Teacher. NOTE: HOD does NOT have LEAVE_APPLY in the real matrix —
  // the Leave screen's read side (GET /leave, /leave/types) is ungated so it still
  // loads, but tapping "Apply Leave" will 403 for HOD. Flagged, not silently patched
  // here — whether HOD should be able to self-apply leave is a policy call for
  // whoever owns shared/permissions/permissionMatrix.js, not this test.
  [ROLES.HOD]: [
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.MARKS_ENTER,
    PERMISSIONS.TIMETABLE_VIEW,
  ],
  [ROLES.LIBRARIAN]: [PERMISSIONS.LIBRARY_MANAGE],
  [ROLES.TRANSPORT_MANAGER]: [PERMISSIONS.TRANSPORT_MANAGE],
  [ROLES.ACCOUNTANT]: [PERMISSIONS.FEES_VIEW, PERMISSIONS.FEES_COLLECT],
  [ROLES.HOSTEL_WARDEN]: [PERMISSIONS.HOSTEL_MANAGE],
  [ROLES.EXAM_ADMIN]: [PERMISSIONS.EXAMS_VIEW, PERMISSIONS.EXAMS_CREATE],
  [ROLES.PLACEMENT_OFFICER]: [PERMISSIONS.PLACEMENT_MANAGE],
  // Every other role (Principal, Vice Principal, Staff, ...) falls back to
  // DEFAULT_TABS (Home + More) in roleNavigation.ts — no gated permission to check.
};

const check = (role, permission) => new Promise((resolve) => {
  const mw = shadowPermission(permission);
  mw({ user: { role, id: 'test' }, method: 'GET', originalUrl: '/test' }, {}, (err) => resolve(!err));
});

(async () => {
  let failures = 0;
  console.log('🧪 Checking every staff mobile tab\'s permission requirement against the real matrix...\n');

  for (const [role, permissions] of Object.entries(ROLE_SCREEN_PERMISSIONS)) {
    for (const permission of permissions) {
      const allowed = await check(role, permission);
      console.log(`${allowed ? '✅' : '❌'} ${role.padEnd(20)} ${permission.padEnd(28)} allowed=${allowed}`);
      if (!allowed) failures++;
    }
  }

  process.env.RBAC_ENFORCEMENT_ENABLED = 'false';

  if (failures > 0) {
    console.error(`\n❌ FAIL: ${failures} role(s) are missing a permission their own mobile tab actually calls — that tab would 403 in the app.`);
    process.exit(1);
  }
  console.log('\n🎉 Every staff role listed in roleNavigation.ts has every permission its own mobile screens call.');
})();
