/**
 * Mobile-Facing Tenant Isolation Test
 *
 * Section 19 of the mobile spec requires this explicitly: "Institution A must never
 * access Institution B data... Test this explicitly." Runs real controller functions
 * (no mocked Prisma — this is the actual query logic every mobile/web request goes
 * through) against the real database, using whatever institutions/data are already
 * seeded. Entirely read-only: every check either reads data or calls a read-only
 * controller (getReceipt) with a deliberately wrong req.institutionId, so this test
 * never creates, mutates, or deletes anything.
 *
 * Two class of check:
 *  1. Read-scoping — a query for institution X must never return a row that actually
 *     belongs to institution Y (catches a dropped/forgotten institutionId filter).
 *  2. IDOR — looking up a real, existing record by its real id, but under the WRONG
 *     req.institutionId, must fail with NotFoundError, not succeed (catches a lookup
 *     that trusts the id alone and never re-checks tenant ownership).
 */
const prisma = require('../shared/database/client');
const hostelController = require('../Staff_backend/src/controllers/hostelController');
const examAdminController = require('../Staff_backend/src/controllers/examAdminController');
const feeDeskController = require('../Staff_backend/src/controllers/feeDeskController');
const libraryController = require('../Staff_backend/src/controllers/libraryController');

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

/** Calls a controller exactly like Express would, and resolves with what it did —
 * a caught error (via next(err), same as the real errorHandler middleware sees) or
 * a response body. */
function callController(fn, req) {
  return new Promise((resolve) => {
    const res = mockRes();
    const next = (err) => resolve({ error: err, res });
    Promise.resolve(fn(req, res, next)).then(() => {
      // Controller may have already resolved via res.json() without calling next()
      resolve({ error: null, res });
    }).catch((err) => resolve({ error: err, res }));
  });
}

async function main() {
  console.log('🧪 Running Mobile Tenant Isolation Test (real DB, read-only)...\n');
  let failures = 0;
  const fail = (msg) => { console.error(`❌ FAIL: ${msg}`); failures++; };
  const pass = (msg) => console.log(`✅ ${msg}`);

  const institutions = await prisma.institution.findMany({ select: { id: true, name: true } });
  if (institutions.length < 2) {
    console.error('❌ FAIL: need at least 2 seeded institutions to test cross-tenant isolation.');
    process.exit(1);
  }

  // The institution with real seeded data (student, fee assignment, fee receipt) —
  // whichever one actually has a Student row, so this test works regardless of which
  // specific institution the seed script happens to populate.
  const studentCounts = await Promise.all(
    institutions.map(async (inst) => ({ inst, count: await prisma.student.count({ where: { institutionId: inst.id } }) })),
  );
  const withData = studentCounts.find((s) => s.count > 0)?.inst;
  const empty = studentCounts.find((s) => s.count === 0)?.inst;

  if (!withData || !empty) {
    console.error('❌ FAIL: need one institution with student data and one without to run this test meaningfully.');
    process.exit(1);
  }
  console.log(`Using "${withData.name}" (has data) vs "${empty.name}" (empty) as the two tenants.\n`);

  // ---- 1. Read-scoping: academic years (examAdminController.getAcademicYears) ----
  {
    const { res: resWith } = await callController(examAdminController.getAcademicYears, { institutionId: withData.id });
    const { res: resEmpty } = await callController(examAdminController.getAcademicYears, { institutionId: empty.id });
    const yearsWith = resWith.body?.data ?? [];
    const yearsEmpty = resEmpty.body?.data ?? [];
    const leaked = yearsEmpty.some((y) => yearsWith.some((yw) => yw.id === y.id));
    if (leaked) fail('getAcademicYears leaked a row across institutions');
    else if (yearsEmpty.length > 0) fail(`getAcademicYears for the empty institution returned ${yearsEmpty.length} row(s) — should be 0`);
    else pass(`getAcademicYears correctly scoped (${yearsWith.length} row(s) for "${withData.name}", 0 for "${empty.name}")`);
  }

  // ---- 2. Read-scoping: pending fees (feeDeskController.getPendingFees) ----
  {
    const { res: resWith } = await callController(feeDeskController.getPendingFees, { institutionId: withData.id });
    const { res: resEmpty } = await callController(feeDeskController.getPendingFees, { institutionId: empty.id });
    const pendingWith = resWith.body?.data ?? [];
    const pendingEmpty = resEmpty.body?.data ?? [];
    const leaked = pendingEmpty.some((a) => pendingWith.some((aw) => aw.id === a.id));
    if (leaked) fail('getPendingFees leaked a row across institutions');
    else if (pendingEmpty.length > 0) fail(`getPendingFees for the empty institution returned ${pendingEmpty.length} row(s) — should be 0`);
    else pass(`getPendingFees correctly scoped (${pendingWith.length} row(s) for "${withData.name}", 0 for "${empty.name}")`);
  }

  // ---- 3. Read-scoping: student search (hostelController + libraryController) ----
  for (const [label, controller] of [['hostelController.searchStudents', hostelController], ['libraryController.searchStudents', libraryController]]) {
    const { res: resWith } = await callController(controller.searchStudents, { institutionId: withData.id, query: {} });
    const { res: resEmpty } = await callController(controller.searchStudents, { institutionId: empty.id, query: {} });
    const studentsWith = resWith.body?.data ?? [];
    const studentsEmpty = resEmpty.body?.data ?? [];
    const leaked = studentsEmpty.some((s) => studentsWith.some((sw) => sw.id === s.id));
    if (leaked) fail(`${label} leaked a row across institutions`);
    else if (studentsEmpty.length > 0) fail(`${label} for the empty institution returned ${studentsEmpty.length} row(s) — should be 0`);
    else pass(`${label} correctly scoped (${studentsWith.length} row(s) for "${withData.name}", 0 for "${empty.name}")`);
  }

  // ---- 4. IDOR: a real FeeReceipt looked up under the wrong institution ----
  {
    const realReceipt = await prisma.feeReceipt.findFirst({ select: { id: true, institutionId: true } });
    if (!realReceipt) {
      console.log('⚠️  SKIP: no FeeReceipt exists in the seeded data to run the IDOR check against.');
    } else {
      const wrongInstitution = institutions.find((i) => i.id !== realReceipt.institutionId);
      const { error: wrongErr } = await callController(feeDeskController.getReceipt, {
        institutionId: wrongInstitution.id,
        params: { id: realReceipt.id },
      });
      const { error: rightErr, res: rightRes } = await callController(feeDeskController.getReceipt, {
        institutionId: realReceipt.institutionId,
        params: { id: realReceipt.id },
      });

      if (!wrongErr || wrongErr.constructor?.name !== 'NotFoundError') {
        fail(`getReceipt did not reject a real receipt id looked up under the wrong institution (got: ${wrongErr ? wrongErr.message : 'no error — receipt was returned!'})`);
      } else {
        pass('getReceipt correctly rejects a real receipt id looked up under the wrong institution');
      }

      if (rightErr || !rightRes.body?.data) {
        fail(`getReceipt failed for the CORRECT institution too (control check) — the id/fixture itself is bad: ${rightErr?.message}`);
      } else {
        pass('getReceipt correctly succeeds for the receipt\'s real, correct institution (control check)');
      }
    }
  }

  await prisma.$disconnect();

  if (failures > 0) {
    console.error(`\n❌ FAIL: ${failures} tenant isolation check(s) failed.`);
    process.exit(1);
  }
  console.log('\n🎉 Mobile tenant isolation test PASSED — no cross-institution data leakage detected.');
}

main().catch((err) => {
  console.error('❌ FAIL: test threw unexpectedly:', err);
  process.exit(1);
});
