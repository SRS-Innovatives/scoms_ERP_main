/**
 * Parent API (Phase 3b)
 *   - student-only actions are blocked for parents (blockParentWrite on the route),
 *   - GET/PATCH /parent/profile: parent-only, edits only contact fields, validates them,
 *     never touches names / income / login identity.
 * No database: prisma.parent / auditLog are stubbed.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const prisma = require('../shared/database/client');
const { ROLES } = require('../shared/constants/roles');
const { getMyProfile, updateMyProfile } = require('../Student_Backend/src/controllers/parentController');

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

let row;
let lastUpdate;
prisma.parent.findUnique = async () => (row ? { ...row, user: { email: 'p@x.in', mobile: '9000000000', userCode: 'P1' } } : null);
prisma.parent.update = async ({ data }) => {
  lastUpdate = data;
  row = { ...row, ...data };
  return { ...row, user: { email: 'p@x.in', mobile: '9000000000', userCode: 'P1' } };
};
prisma.auditLog.create = async () => ({});

const call = (handler, { role = ROLES.PARENT, parentId = 'par-1', body = {} } = {}) =>
  new Promise((resolve) => {
    const req = { user: { id: 'u1', role, parentId, institutionId: 'inst-1' }, body, ip: '', get: () => '' };
    const res = { status() { return this; }, json: (payload) => resolve({ ok: true, payload }) };
    handler(req, res, (err) => resolve({ ok: false, err }));
  });

(async () => {
  const routes = fs.readFileSync(path.join(__dirname, '../Student_Backend/src/routes/apiRoutes.js'), 'utf8');

  await test('student-only writes are blocked for parents on the route', () => {
    ['/attendance/corrections', '/events/register', '/clubs/join', '/assignments/submit', '/feedback', '/postings/apply'].forEach((p) => {
      const line = routes.split('\n').find((l) => l.includes(`router.post('${p}'`));
      assert.ok(line, `POST ${p} exists`);
      assert.ok(/blockParentWrite\(/.test(line), `POST ${p} has blockParentWrite`);
    });
  });

  await test('parent profile routes are mounted', () => {
    assert.ok(routes.includes("router.get('/parent/profile', parentController.getMyProfile)"));
    assert.ok(routes.includes("router.patch('/parent/profile', parentController.updateMyProfile)"));
  });

  await test('GET /parent/profile: parent gets own record with login identity', async () => {
    row = { id: 'par-1', fatherName: 'Ravi', fatherPhone: '9876543210' };
    const r = await call(getMyProfile);
    assert.ok(r.ok, r.err?.message);
    assert.strictEqual(r.payload.data.fatherName, 'Ravi');
    assert.strictEqual(r.payload.data.loginMobile, '9000000000');
    assert.strictEqual(r.payload.data.user, undefined, 'raw user relation not leaked');
  });

  await test('GET /parent/profile: a student is refused', async () => {
    const r = await call(getMyProfile, { role: ROLES.STUDENT, parentId: undefined });
    assert.ok(!r.ok);
  });

  await test('PATCH: updates contact fields, trims, clears empty to null', async () => {
    row = { id: 'par-1', fatherName: 'Ravi', motherEmail: 'old@x.in' };
    const r = await call(updateMyProfile, { body: { fatherPhone: ' +91 98765 43210 ', motherEmail: '', address: '12 Main St' } });
    assert.ok(r.ok, r.err?.message);
    assert.deepStrictEqual(lastUpdate, { fatherPhone: '+91 98765 43210', motherEmail: null, address: '12 Main St' });
  });

  await test('PATCH: refuses names, income and unknown fields', async () => {
    lastUpdate = undefined;
    const r = await call(updateMyProfile, { body: { fatherName: 'X', annualIncome: '1L', fatherPhone: '9876543210' } });
    assert.ok(!r.ok && /can't be changed/.test(r.err.message), r.err?.message);
    assert.strictEqual(lastUpdate, undefined, 'nothing written');
  });

  await test('PATCH: validates phone and email', async () => {
    const bad = await call(updateMyProfile, { body: { fatherPhone: 'abc', motherEmail: 'nope' } });
    assert.ok(!bad.ok && /phone/.test(bad.err.message) && /email/.test(bad.err.message), bad.err?.message);
  });

  await test('PATCH: empty body is rejected', async () => {
    const r = await call(updateMyProfile, { body: {} });
    assert.ok(!r.ok && /Nothing to update/.test(r.err.message));
  });

  // --- Parent corner: discipline / health / PTM notes ---------------------------------
  const records = require('../Student_Backend/src/controllers/parentRecordsController');
  const seen = {};
  const stubFind = (model, rows) => {
    prisma[model].findMany = async (args) => {
      seen[model] = args;
      return rows;
    };
  };
  stubFind('disciplineRecord', [{ id: 'd1', category: 'MINOR', reportedBy: { firstName: 'Anu', lastName: 'K', designation: 'Teacher' } }]);
  stubFind('healthRecord', [{ id: 'h1', referredToHospital: false, recordedBy: null }]);
  stubFind('parentMeetingNote', [{ id: 'p1', discussionNotes: 'Good progress', staff: { firstName: 'Ravi', lastName: '', designation: 'HOD' } }]);
  const callRecords = (handler, role = ROLES.PARENT) =>
    new Promise((resolve) => {
      const req = { user: { id: 'u1', role, parentId: 'par-1', studentId: 'stu-9', institutionId: 'inst-1' }, institutionId: 'inst-1' };
      const res = { status() { return this; }, json: (payload) => resolve({ ok: true, payload }) };
      handler(req, res, (err) => resolve({ ok: false, err }));
    });

  await test('parent-corner routes are mounted, module-gated', () => {
    assert.ok(/router\.get\('\/discipline', requireModule\('discipline'\)/.test(routes));
    assert.ok(/router\.get\('\/health-records', requireModule\('health'\)/.test(routes));
    assert.ok(/router\.get\('\/ptm-notes', requireModule\('ptm'\)/.test(routes));
  });

  await test('parent-corner records: students are refused', async () => {
    for (const h of [records.getDisciplineRecords, records.getHealthRecords, records.getPtmNotes]) {
      const r = await callRecords(h, ROLES.STUDENT);
      assert.ok(!r.ok && r.err.statusCode === 403, 'student gets 403');
    }
  });

  await test('parent-corner records: scoped to active child + institution, staff reduced to a name', async () => {
    const d = await callRecords(records.getDisciplineRecords);
    assert.ok(d.ok, d.err?.message);
    assert.deepStrictEqual(seen.disciplineRecord.where, { studentId: 'stu-9', institutionId: 'inst-1' });
    assert.strictEqual(d.payload.data[0].reportedBy, 'Anu K');
    const h = await callRecords(records.getHealthRecords);
    assert.deepStrictEqual(seen.healthRecord.where, { studentId: 'stu-9', institutionId: 'inst-1' });
    assert.strictEqual(h.payload.data[0].recordedBy, null);
    const p = await callRecords(records.getPtmNotes);
    assert.deepStrictEqual(seen.parentMeetingNote.where, { studentId: 'stu-9', institutionId: 'inst-1' });
    assert.strictEqual(p.payload.data[0].teacher, 'Ravi');
    assert.strictEqual(p.payload.data[0].staff, undefined, 'raw staff relation not leaked');
  });

  console.log('Parent API');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
