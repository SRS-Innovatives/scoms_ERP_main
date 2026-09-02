/**
 * One-time, idempotent backfill: assigns a professional userCode to every existing User
 * row that doesn't have one yet. Students/Staff reuse their own existing admissionNumber/
 * employeeCode (never rewriting an already-issued ID); every other role gets a freshly
 * generated one, numbered sequentially within its institution (or "SCOMS" scope for
 * platform-level users with no institution).
 *
 * Run:  node shared/utils/backfillUserCodes.js
 */
const prisma = require('../database/client');
const { generateUserCode } = require('./idGenerators');

const backfillUserCodes = async () => {
  const users = await prisma.user.findMany({
    where: { userCode: null },
    orderBy: { createdAt: 'asc' },
  });

  const seqByScope = {}; // `${institutionId || 'SCOMS'}::${role}` -> next sequence number
  let updated = 0;

  for (const user of users) {
    let userCode;

    if (user.admissionNumber) {
      userCode = user.admissionNumber;
    } else if (user.employeeCode) {
      userCode = user.employeeCode;
    } else {
      const scopeKey = `${user.institutionId || 'SCOMS'}::${user.role}`;
      const institution = user.institutionId
        ? await prisma.institution.findUnique({ where: { id: user.institutionId }, select: { code: true } })
        : null;

      if (seqByScope[scopeKey] === undefined) {
        seqByScope[scopeKey] = await prisma.user.count({
          where: { institutionId: user.institutionId, role: user.role, userCode: { not: null } },
        });
      }
      seqByScope[scopeKey] += 1;
      userCode = generateUserCode(institution?.code, user.role, seqByScope[scopeKey]);
    }

    // A generated code could theoretically collide with one another user already carries
    // (e.g. two different roles landing on the same scope+sequence) — skip on conflict
    // rather than crash the whole backfill; it's picked up on the next run instead.
    try {
      await prisma.user.update({ where: { id: user.id }, data: { userCode } });
      updated++;
    } catch (err) {
      console.warn(`Skipped user ${user.id} (${user.email || user.mobile}): ${err.message}`);
    }
  }

  return { totalWithoutCode: users.length, updated };
};

module.exports = { backfillUserCodes };

if (require.main === module) {
  backfillUserCodes()
    .then((result) => {
      console.log(`✅ Backfilled userCode for ${result.updated} of ${result.totalWithoutCode} user(s) that were missing one.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Backfill failed:', err);
      process.exit(1);
    });
}
