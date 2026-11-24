/**
 * Staff app S4 P2 backend: PTM notes, study materials, messages — plus their query
 * optimisations.
 *   1. conversation ?after= returns only newer messages (polling stays tiny),
 *   2. the "sections I teach" lookup is cached and dropped on invalidate,
 *   3. messages: chat list carries lastMessage from ONE query; send trims, limits, only to my
 *      students, and notifies the student,
 *   4. PTM: student list, validation, only my students, parents notified,
 *   5. materials: fileType / link validation,
 *   6. the mobile gateway serves signed /api/v1/media links.
 *
 * No database: Prisma calls and the shared notifiers are stubbed.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

delete process.env.MODULE_REGISTRY_ENABLED;
delete process.env.RBAC_ENFORCEMENT_ENABLED;

const shared = require('../shared');
const prisma = require('../shared/database/client');
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
const flush = () => new Promise((r) => setImmediate(r));

// stubs set before the controllers are required (they destructure on load)
const single = [];
const many = [];
shared.pushNotification = async (a) => { single.push(a); };
shared.pushNotificationToMany = async (a) => { many.push(a); return a.userIds.length; };
let mappingQueries = 0;
prisma.subjectTeacherMapping.findMany = async () => { mappingQueries += 1; return [{ sectionId: 'sec-A' }]; };
const me = { id: 'u-me', staffId: 's-me', role: 'TEACHER' };

(async () => {
  await test('conversation ?after= fetches only newer messages, oldest first', async () => {
    const { findConversation } = require('../shared/utils/findList');
    let args = null;
    prisma.message.findMany = async (a) => { args = a; return [{ id: 'm9' }]; };
    const out = await findConversation(prisma, 'a', 'b', { query: { after: '2026-11-23T10:00:00.000Z' } });
    assert.deepStrictEqual(args.where.createdAt, { gt: new Date('2026-11-23T10:00:00.000Z') });
    assert.deepStrictEqual(args.orderBy, { createdAt: 'asc' });
    assert.deepStrictEqual(out, { rows: [{ id: 'm9' }], meta: { hasMore: false } });
    await findConversation(prisma, 'a', 'b', { query: {} });
    assert.deepStrictEqual(args.orderBy, { createdAt: 'desc' }, 'without after: the normal latest-page query');
  });

  await test('taught sections are cached; invalidate drops them', async () => {
    const { getTaughtSectionIds } = require('../shared/academic/taughtSections');
    invalidate('teacherSections');
    mappingQueries = 0;
    assert.deepStrictEqual(await getTaughtSectionIds('s-me'), ['sec-A']);
    await getTaughtSectionIds('s-me');
    await getTaughtSectionIds('s-me');
    assert.strictEqual(mappingQueries, 1, 'one DB query for three calls');
    invalidate('teacherSections');
    await getTaughtSectionIds('s-me');
    assert.strictEqual(mappingQueries, 2);
    assert.deepStrictEqual(await getTaughtSectionIds(null), []);
  });

  await test('chat list: lastMessage per student from one message query', async () => {
    const ctrl = require('../Staff_backend/src/controllers/messageController');
    prisma.student.findMany = async () => [
      { userId: 'stu-1', firstName: 'A', lastName: 'X', rollNumber: '1', section: { name: 'A' } },
      { userId: 'stu-2', firstName: 'B', lastName: 'Y', rollNumber: '2', section: { name: 'A' } },
    ];
    let messageQueries = 0;
    prisma.message.findMany = async () => {
      messageQueries += 1;
      return [
        { id: 'm3', senderId: 'stu-1', receiverId: 'u-me', content: 'newest from A', createdAt: new Date('2026-11-23') },
        { id: 'm2', senderId: 'u-me', receiverId: 'stu-1', content: 'older', createdAt: new Date('2026-11-22') },
      ];
    };
    const { data } = await call(ctrl.getMyStudents, { user: me });
    assert.strictEqual(messageQueries, 1);
    assert.deepStrictEqual(data[0].lastMessage, { content: 'newest from A', createdAt: new Date('2026-11-23'), fromMe: false });
    assert.strictEqual(data[1].lastMessage, null);
  });

  await test('send message: trims, enforces length, only my students, notifies the student', async () => {
    const ctrl = require('../Staff_backend/src/controllers/messageController');
    prisma.student.findFirst = async ({ where }) => (where.userId === 'stu-1' ? { id: 'st1' } : null);
    let created = null;
    prisma.message.create = async ({ data }) => { created = data; return { id: 'm10', ...data }; };
    prisma.staff.findUnique = async () => ({ firstName: 'Priya', lastName: 'K' });
    single.length = 0;
    await call(ctrl.sendMessage, { user: me, body: { receiverId: 'stu-1', content: '  Hello class  ' } });
    assert.strictEqual(created.content, 'Hello class');
    await flush();
    await flush();
    assert.strictEqual(single.length, 1);
    assert.strictEqual(single[0].userId, 'stu-1');
    assert.strictEqual(single[0].title, 'Message from Priya K');

    const long = await call(ctrl.sendMessage, { user: me, body: { receiverId: 'stu-1', content: 'x'.repeat(2001) } }).then(() => null, (e) => e);
    assert.ok(long && /at most 2000/.test(long.message));
    const blank = await call(ctrl.sendMessage, { user: me, body: { receiverId: 'stu-1', content: '   ' } }).then(() => null, (e) => e);
    assert.ok(blank, 'blank message refused');
    const stranger = await call(ctrl.sendMessage, { user: me, body: { receiverId: 'stu-9', content: 'hi' } }).then(() => null, (e) => e);
    assert.ok(stranger && /not found or access denied/.test(stranger.message));
  });

  await test('PTM: my students only, date / length validation, parents notified', async () => {
    const ctrl = require('../Staff_backend/src/controllers/parentMeetingController');
    let listWhere = null;
    prisma.student.findMany = async ({ where }) => { listWhere = where; return [{ id: 'st1' }]; };
    await call(ctrl.getMyStudents, { user: me });
    assert.deepStrictEqual(listWhere.sectionId, { in: ['sec-A'] });
    assert.strictEqual(listWhere.institutionId, 'inst-1');

    prisma.student.findFirst = async ({ where }) =>
      where.id === 'st1' ? { id: 'st1', firstName: 'Aarav', parents: [{ parent: { userId: 'par-1' } }, { parent: { userId: 'par-1' } }] } : null;
    let saved = null;
    prisma.parentMeetingNote.create = async ({ data }) => { saved = data; return { id: 'n1', ...data }; };
    many.length = 0;
    await call(ctrl.createNote, { user: me, body: { studentId: 'st1', discussionNotes: ' Good progress ', meetingDate: '2026-11-20', parentName: ' Mr K ' } });
    assert.strictEqual(saved.discussionNotes, 'Good progress');
    assert.strictEqual(saved.parentName, 'Mr K');
    await flush();
    assert.strictEqual(many.length, 1);
    assert.deepStrictEqual(many[0].userIds, ['par-1'], 'each parent once');

    const future = await call(ctrl.createNote, { user: me, body: { studentId: 'st1', discussionNotes: 'x', meetingDate: '2099-01-01' } }).then(() => null, (e) => e);
    assert.ok(future && /future/.test(future.message));
    const bad = await call(ctrl.createNote, { user: me, body: { studentId: 'st1', discussionNotes: 'x', meetingDate: 'soon' } }).then(() => null, (e) => e);
    assert.ok(bad && /valid date/.test(bad.message));
    const other = await call(ctrl.createNote, { user: me, body: { studentId: 'st9', discussionNotes: 'x' } }).then(() => null, (e) => e);
    assert.ok(other && /own assigned classes/.test(other.message));
  });

  await test('materials: type and link are validated', async () => {
    const ctrl = require('../Staff_backend/src/controllers/materialController');
    prisma.subjectTeacherMapping.findFirst = async () => ({ id: 'map' });
    prisma.studyMaterial.create = async ({ data }) => ({ id: 'mat1', ...data });
    const base = { title: 'Notes', subjectId: 'sub1', fileType: 'LINK', fileUrl: 'https://drive.google.com/x' };
    const ok = await call(ctrl.createMaterial, { user: me, body: base });
    assert.strictEqual(ok.data.id, 'mat1');
    const badType = await call(ctrl.createMaterial, { user: me, body: { ...base, fileType: 'EXE' } }).then(() => null, (e) => e);
    assert.ok(badType && /fileType must be one of/.test(badType.message));
    const badLink = await call(ctrl.createMaterial, { user: me, body: { ...base, fileUrl: 'javascript:alert(1)' } }).then(() => null, (e) => e);
    assert.ok(badLink && /http\(s\) link/.test(badLink.message));
  });

  await test('the mobile gateway serves signed media links', () => {
    const src = fs.readFileSync(path.join(__dirname, '../scoms-app-backend/src/app.js'), 'utf8');
    assert.ok(/app\.use\('\/api\/v1\/media', require\('..\/..\/shared\/media\/mediaRoutes'\)\)/.test(src));
  });

  console.log('Staff collaboration (PTM, materials, messages)');
  console.log(results.join('\n'));
  if (failures) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall passed');
  process.exit(0);
})();
