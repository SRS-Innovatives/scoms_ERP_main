/**
 * RBAC Permission Matrix Validation
 *
 * Exercises shadowPermission()'s enforcement path (RBAC_ENFORCEMENT_ENABLED=true, set
 * only inside this process — never the real .env or a running server) against every
 * role in ROLES and a representative sample of the permissions wired into real routes
 * this session. Purpose: build confidence in the matrix BEFORE ever flipping the real
 * flag, since only TEACHER and INSTITUTE_ADMIN have been exercised with live traffic.
 *
 * This is not a claim about what SHOULD be allowed — it prints the matrix's current
 * ALLOW/DENY decision for each role x permission pair so a human can sanity-check it
 * against job function before enforcement ever goes live for real users.
 */
process.env.RBAC_ENFORCEMENT_ENABLED = 'true';

const shadowPermission = require('../shared/middleware/shadowPermission');
const { ROLES, PERMISSIONS } = require('../shared/constants/roles');

const check = (role, permission) => {
  let allowed = null;
  const mw = shadowPermission(permission);
  mw({ user: { role, id: 'test' }, method: 'GET', originalUrl: '/test' }, {}, (err) => {
    allowed = !err;
  });
  return allowed;
};

// One representative "core" permission per role — the thing that role most obviously
// needs to do its job. Every role here must ALLOW its own core permission, or the
// matrix has a real bug (not just a policy judgment call).
const CORE_EXPECTATION = [
  [ROLES.SUPER_ADMIN, PERMISSIONS.INSTITUTIONS_DELETE],
  [ROLES.PLATFORM_ADMIN, PERMISSIONS.INSTITUTIONS_VIEW],
  [ROLES.INSTITUTE_ADMIN, PERMISSIONS.STUDENTS_CREATE],
  [ROLES.PRINCIPAL, PERMISSIONS.RESULTS_PUBLISH],
  [ROLES.VICE_PRINCIPAL, PERMISSIONS.LEAVE_APPROVE],
  [ROLES.HOD, PERMISSIONS.MARKS_ENTER],
  [ROLES.TEACHER, PERMISSIONS.ATTENDANCE_MARK],
  [ROLES.STAFF, PERMISSIONS.LEAVE_APPLY],
  [ROLES.ACCOUNTANT, PERMISSIONS.FEES_COLLECT],
  [ROLES.LIBRARIAN, PERMISSIONS.LIBRARY_MANAGE],
  [ROLES.TRANSPORT_MANAGER, PERMISSIONS.TRANSPORT_MANAGE],
  [ROLES.HOSTEL_WARDEN, PERMISSIONS.HOSTEL_MANAGE],
  [ROLES.EXAM_ADMIN, PERMISSIONS.EXAMS_CREATE],
  [ROLES.PLACEMENT_OFFICER, PERMISSIONS.PLACEMENT_MANAGE],
  [ROLES.STUDENT, PERMISSIONS.ASSIGNMENTS_SUBMIT],
  [ROLES.PARENT, PERMISSIONS.PAYMENTS_ONLINE],
];

// Cross-checks: permissions a role should clearly NOT have — catches over-broad grants.
const NEGATIVE_EXPECTATION = [
  [ROLES.LIBRARIAN, PERMISSIONS.FEES_REFUND],
  [ROLES.TRANSPORT_MANAGER, PERMISSIONS.MARKS_ENTER],
  [ROLES.STUDENT, PERMISSIONS.RESULTS_PUBLISH],
  [ROLES.PARENT, PERMISSIONS.ATTENDANCE_MARK],
  [ROLES.STAFF, PERMISSIONS.FEES_REFUND],
  [ROLES.ACCOUNTANT, PERMISSIONS.MARKS_ENTER],
];

let failures = 0;

console.log('--- Core expectation (every role must ALLOW its own core permission) ---');
for (const [role, permission] of CORE_EXPECTATION) {
  const allowed = check(role, permission);
  const ok = allowed === true;
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${role.padEnd(20)} ${permission.padEnd(28)} allowed=${allowed}`);
}

console.log('\n--- Negative expectation (these role x permission pairs must DENY) ---');
for (const [role, permission] of NEGATIVE_EXPECTATION) {
  const allowed = check(role, permission);
  const ok = allowed === false;
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${role.padEnd(20)} ${permission.padEnd(28)} allowed=${allowed} (expected denied)`);
}

process.env.RBAC_ENFORCEMENT_ENABLED = 'false';

if (failures > 0) {
  console.error(`\n❌ FAIL: ${failures} matrix expectation(s) not met.`);
  process.exit(1);
}
console.log('\n🎉 RBAC matrix validation PASSED — every core role permission allows, every negative check denies.');
