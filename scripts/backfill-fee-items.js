/**
 * One-time backfill: make every fee's per-head breakdown match its totals.
 *
 * Before the per-head fixes, payments taken online, at the Staff fee desk or through the
 * admin's legacy collect only updated a student's fee TOTALS, and concessions only reduced
 * the TOTAL due — so the head-wise breakdown (StudentFeeItem) showed heads unpaid/undiscounted.
 * This rebuilds each assignment's heads from the facts (shared/fees/feeItems.js
 * recomputeItems with allocateMissing): splits never-split payments per head and spreads
 * the discount. It never changes a payment, a receipt or any total — only the per-head rows
 * and missing PaymentAllocation rows.
 *
 *   node scripts/backfill-fee-items.js            PREVIEW (default) — writes nothing
 *   node scripts/backfill-fee-items.js --apply    write the changes
 *
 * Uses DATABASE_URL from the environment / .env, like the app. Safe to run more than once.
 */
require('dotenv').config();
const prisma = require('../shared/database/client');
const { recomputeItems } = require('../shared/fees/feeItems');

const APPLY = process.argv.includes('--apply');
const ROLLBACK = Symbol('preview-rollback');

(async () => {
  const assignments = await prisma.studentFeeAssignment.findMany({
    where: { items: { some: {} } },
    select: { id: true, dueAmount: true, items: { select: { dueAmount: true } } },
  });
  const mismatchedBefore = assignments.filter((a) => Math.abs(a.items.reduce((s, i) => s + i.dueAmount, 0) - a.dueAmount) > 0.01).length;

  let fixed = 0; let allocated = 0; let stillOff = 0; const offIds = [];
  for (const a of assignments) {
    try {
      await prisma.$transaction(async (tx) => {
        const r = await recomputeItems(tx, a.id, { allocateMissing: true });
        allocated += r.allocated;
        if (Math.abs(r.itemDue - r.assignmentDue) > 0.01) { stillOff += 1; offIds.push(`${a.id} (heads ₹${r.itemDue} vs total ₹${r.assignmentDue})`); } else fixed += 1;
        if (!APPLY) throw ROLLBACK; // preview: undo everything this transaction did
      }, { timeout: 30000 });
    } catch (err) {
      if (err !== ROLLBACK) throw err;
    }
  }

  console.log(`${APPLY ? 'APPLIED' : 'PREVIEW (nothing written — run with --apply to save)'}`);
  console.log(`  fees with a per-head breakdown: ${assignments.length}`);
  console.log(`  heads not matching the totals before: ${mismatchedBefore}`);
  console.log(`  payment amount newly split across heads: ₹${allocated.toFixed(2)}`);
  console.log(`  matching after: ${fixed}; still not matching: ${stillOff}`);
  offIds.slice(0, 20).forEach((x) => console.log(`    - ${x}`));
  if (stillOff) console.log('  (a remaining mismatch means the totals themselves are off — e.g. an overpayment taken before the overpayment block — and needs a manual look)');
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
