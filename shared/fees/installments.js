/**
 * Instalments — consistent with the per-head breakdown and the totals.
 *
 * A fee structure may carry an instalment SCHEDULE (FeeStructureInstallment: e.g. Term 1 =
 * 40% by 15 Jun). Every student assigned it gets those instalments (plan = SCHEDULE). The fee
 * office can still give one student a CUSTOM plan (Installment Setup), which covers what was
 * left to pay at that moment (installmentBase = amount already paid then).
 *
 * Every instalment is a slice of the student's fee after discount, taken in HEAD ORDER —
 * the same order payments fill the heads (shared/fees/feeItems.js). So instalment amounts,
 * what's paid on each, and which heads each one covers are all derived from the same facts
 * and can never disagree with the per-head figures or the totals:
 *   - SCHEDULE amounts = schedule % × (total − discount) — they follow discount changes
 *   - CUSTOM amounts   = as set, adjusted on the last instalment(s) if the discount changes
 *   - paid             = payments fill instalments in order (1, 2, 3 …)
 * recomputeInstallments runs after every payment and every discount change.
 */
const { ValidationError } = require('../errors/customErrors');

const round2 = (n) => Math.round(n * 100) / 100;
const MAX_INSTALLMENTS = 24;

/** Validates a schedule from the structure builder → normalized rows (or [] for none). */
const parseSchedule = (input) => {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new ValidationError('installments must be a list');
  if (input.length === 0) return [];
  if (input.length > MAX_INSTALLMENTS) throw new ValidationError(`At most ${MAX_INSTALLMENTS} instalments are allowed`);
  const rows = input.map((r, idx) => {
    const percent = Number(r.percent);
    const dueDate = new Date(r.dueDate);
    if (!Number.isFinite(percent) || percent <= 0) throw new ValidationError(`Instalment ${idx + 1}: percentage must be more than 0`);
    if (Number.isNaN(dueDate.getTime())) throw new ValidationError(`Instalment ${idx + 1}: a valid due date is required`);
    return { installmentNumber: idx + 1, label: r.label ? String(r.label).trim().slice(0, 60) : null, percent: round2(percent), dueDate };
  });
  const total = round2(rows.reduce((s, r) => s + r.percent, 0));
  if (Math.abs(total - 100) > 0.01) throw new ValidationError(`Instalment percentages must add up to 100% (they add up to ${total}%)`);
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i].dueDate < rows[i - 1].dueDate) throw new ValidationError(`Instalment ${i + 1} is due before instalment ${i} — put the due dates in order`);
  }
  return rows;
};

/** Split `total` by percentages so the parts add up exactly (the last absorbs rounding). */
const splitByPercent = (total, percents) => {
  const parts = percents.map((p) => round2((total * p) / 100));
  const diff = round2(total - parts.reduce((s, x) => s + x, 0));
  if (parts.length) parts[parts.length - 1] = round2(parts[parts.length - 1] + diff);
  return parts;
};

/** A newly assigned student gets the structure's instalments (plan = SCHEDULE). */
const createInstallmentsFromSchedule = async (tx, assignment, schedule) => {
  if (!schedule || schedule.length === 0) return;
  const ordered = [...schedule].sort((a, b) => a.installmentNumber - b.installmentNumber);
  const net = Math.max(0, round2(assignment.totalAmount - (assignment.discountAmount || 0)));
  const amounts = splitByPercent(net, ordered.map((s) => s.percent));
  await tx.feeInstallment.createMany({
    data: ordered.map((s, i) => ({
      studentFeeAssignmentId: assignment.id,
      installmentNumber: i + 1,
      amount: amounts[i],
      dueDate: s.dueDate,
    })),
  });
  await tx.studentFeeAssignment.update({ where: { id: assignment.id }, data: { installmentPlan: 'SCHEDULE', installmentBase: 0 } });
};

/** Recalculates every instalment's amount / paid / status for one assignment. */
const recomputeInstallments = async (tx, assignmentId) => {
  const a = await tx.studentFeeAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, feeStructureId: true, totalAmount: true, discountAmount: true, paidAmount: true, installmentPlan: true, installmentBase: true },
  });
  if (!a) return null;
  const rows = await tx.feeInstallment.findMany({ where: { studentFeeAssignmentId: assignmentId }, orderBy: { installmentNumber: 'asc' } });
  if (rows.length === 0) return [];

  const net = Math.max(0, round2(a.totalAmount - (a.discountAmount || 0)));
  let amounts = rows.map((r) => r.amount);
  let plan = a.installmentPlan === 'SCHEDULE' ? 'SCHEDULE' : 'CUSTOM';
  if (plan === 'SCHEDULE') {
    const schedule = await tx.feeStructureInstallment.findMany({ where: { feeStructureId: a.feeStructureId }, orderBy: { installmentNumber: 'asc' } });
    if (schedule.length === rows.length) amounts = splitByPercent(net, schedule.map((s) => s.percent));
    else plan = 'CUSTOM'; // schedule no longer matches these rows — keep them as they are
  }
  const base = plan === 'SCHEDULE' ? 0 : round2(a.installmentBase || 0);
  if (plan === 'CUSTOM') {
    // keep the plan covering exactly what's left after the base (discount changes adjust the tail)
    const target = Math.max(0, round2(net - base));
    let diff = round2(target - amounts.reduce((s, x) => s + x, 0));
    if (diff > 0) amounts[amounts.length - 1] = round2(amounts[amounts.length - 1] + diff);
    for (let i = amounts.length - 1; diff < 0 && i >= 0; i -= 1) {
      const cut = Math.min(amounts[i], -diff);
      amounts[i] = round2(amounts[i] - cut);
      diff = round2(diff + cut);
    }
  }

  // payments fill instalments in order
  let pool = Math.max(0, round2(a.paidAmount - base));
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const amount = amounts[i];
    const paidAmount = round2(Math.max(0, Math.min(pool, amount)));
    pool = round2(pool - paidAmount);
    const status = amount <= 0 || paidAmount >= amount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
    const r = rows[i];
    if (r.amount !== amount || r.paidAmount !== paidAmount || r.status !== status) {
      await tx.feeInstallment.update({ where: { id: r.id }, data: { amount, paidAmount, status } });
    }
    out.push({ ...r, amount, paidAmount, status });
  }
  return out;
};

/**
 * Which heads each instalment covers (head order). items: the assignment's items in head
 * order (amount, discountAmount, feeHeadName); installments: as recomputed.
 * Returns installments with `heads: [{ feeHeadName, amount }]`.
 */
const installmentHeads = (items, installments, { plan, base = 0 } = {}) => {
  const segments = [];
  let pos = 0;
  for (const i of items) {
    const net = Math.max(0, round2(i.amount - (i.discountAmount || 0)));
    segments.push({ name: i.feeHeadName, from: pos, to: round2(pos + net) });
    pos = round2(pos + net);
  }
  let cursor = plan === 'SCHEDULE' ? 0 : round2(base);
  return installments.map((inst) => {
    const from = cursor;
    const to = round2(cursor + inst.amount);
    cursor = to;
    const heads = segments
      .map((s) => ({ feeHeadName: s.name, amount: round2(Math.max(0, Math.min(to, s.to) - Math.max(from, s.from))) }))
      .filter((h) => h.amount > 0);
    return { ...inst, heads };
  });
};

module.exports = { parseSchedule, splitByPercent, createInstallmentsFromSchedule, recomputeInstallments, installmentHeads, MAX_INSTALLMENTS };
