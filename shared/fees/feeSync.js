/**
 * Fee sync — keeps one student's fees in step with the fee rules (shared/fees/feeRules.js)
 * and their class, quota, hostel and transport.
 *
 *   assign  every PUBLISHED fee of the current academic year that matches the student's
 *           class/section (newest version only; never a second version of a fee they have)
 *           and that charges them something under its rules
 *   adjust  their current-year fees with rules, when what the rules say has changed since
 *           the fee was worked out (StudentFeeItem.basisAmount = the full-year amount last
 *           used). The change is applied by the policy's midYearChange:
 *             FULL       the whole difference
 *             PRORATA    the difference × months left in the academic year / months in it
 *             NEXT_TERM  nothing now (shown as deferred)
 *           A head is never cut below what was already paid on it.
 *
 * Called by: admission (single, bulk, pre-admission), promotion, hostel/transport changes —
 * each only when its Fee Policy switch is on — and by the admin's "Recalculate fees".
 */
const { latestVersions } = require('./feeItems');
const { createInstallmentsFromSchedule } = require('./installments');
const { resolveStructureForStudent, loadStudentContext, loadStudentContexts, hasRules } = require('./feeRules');
const { getFeePolicy, round2 } = require('./feePolicy');
const logger = require('../utils/logger');

const MONTH = 30.44 * 24 * 60 * 60 * 1000;
const STRUCTURE_INCLUDE = {
  items: { include: { feeHead: { select: { name: true } } } },
  installmentSchedule: true,
  academicYear: { select: { id: true, startDate: true, endDate: true, isCurrent: true, yearName: true } },
};

/** { total, left } whole months of an academic year, and how many are left from `now`. */
const monthsLeft = (year, now = new Date()) => {
  const start = new Date(year.startDate);
  const end = new Date(year.endDate);
  const total = Math.max(1, Math.round((end - start) / MONTH));
  if (now <= start) return { total, left: total };
  if (now >= end) return { total, left: 0 };
  return { total, left: Math.min(total, Math.ceil((end - now) / MONTH)) };
};

/** Published, current-year fees for this class/section — newest version of each. */
const findMatchingStructures = async (db, institutionId, courseId, sectionId) => latestVersions(await db.feeStructure.findMany({
  where: {
    institutionId,
    status: 'PUBLISHED',
    academicYear: { isCurrent: true },
    AND: [
      { OR: [{ courseId: null }, ...(courseId ? [{ courseId }] : [])] },
      { OR: [{ sectionId: null }, ...(sectionId ? [{ sectionId }] : [])] },
    ],
  },
  include: STRUCTURE_INCLUDE,
}));

/**
 * Creates one student's assignment of a structure from its rules. `scale` (0–1) charges a
 * part of the year (mid-year joining of a hostel/bus fee). Returns null when the rules
 * charge this student nothing.
 */
const assignResolvedStructure = async (tx, structure, studentId, { resolved = null, scale = 1 } = {}) => {
  const plan = resolved || await resolveStructureForStudent(tx, structure, studentId);
  const rows = plan.items
    .filter((i) => i.amount > 0)
    .map((i) => ({ ...i, charged: round2(i.amount * scale), note: scale < 1 && i.ruled ? `${i.note ? `${i.note}; ` : ''}part year (${Math.round(scale * 100)}%)` : i.note }))
    .filter((i) => i.charged > 0);
  if (rows.length === 0) return null;
  const total = round2(rows.reduce((s, i) => s + i.charged, 0));
  const assignment = await tx.studentFeeAssignment.create({
    data: { feeStructureId: structure.id, studentId, structureVersion: structure.version, totalAmount: total, dueAmount: total },
  });
  await tx.studentFeeItem.createMany({
    data: rows.map((i) => ({
      studentFeeAssignmentId: assignment.id, feeHeadId: i.feeHeadId, feeHeadName: i.feeHeadName,
      amount: i.charged, dueAmount: i.charged, basisAmount: i.ruled ? i.amount : null, note: i.note,
    })),
  });
  await createInstallmentsFromSchedule(tx, assignment, structure.installmentSchedule);
  return assignment;
};

/**
 * What a sync would do for one student, without changing anything.
 *   event  ADMISSION | PROMOTION | SERVICE_CHANGE | MANUAL
 * → { assign: [...], adjust: [...], deferred: [...], mode }
 */
const planStudentFeeSync = async (db, { institutionId, studentId, event = 'MANUAL', policy = null, now = new Date(), cache = null, prefetch = null }) => {
  const p = policy || await getFeePolicy(db, institutionId);
  // `prefetch` (from planFeeSyncForStudents) carries the student, their fees and a context
  // loader already fetched for a whole class
  const student = prefetch ? prefetch.student : await db.student.findFirst({ where: { id: studentId, institutionId }, select: { id: true, courseId: true, sectionId: true, status: true } });
  if (!student) return null;
  const midYear = event === 'SERVICE_CHANGE' || event === 'MANUAL';
  const mode = midYear ? p.midYearChange : 'FULL';
  const out = { assign: [], adjust: [], deferred: [], mode, event };
  if (student.status !== 'ACTIVE') return out;

  // `cache` (a plain object shared across one class run) keeps each class's matching fee
  // structures, so a whole class loads them once instead of once per student
  const key = `${student.courseId}|${student.sectionId}`;
  const structuresP = cache?.[key] || findMatchingStructures(db, institutionId, student.courseId, student.sectionId);
  if (cache) cache[key] = structuresP;
  // every fee the student holds (any year) in one query: the current-year ones are adjusted,
  // all of them stop a second version of the same fee being assigned
  const [structures, mine] = await Promise.all([
    structuresP,
    prefetch ? prefetch.fees : db.studentFeeAssignment.findMany({
      where: { studentId },
      include: { items: true, feeStructure: { include: STRUCTURE_INCLUDE } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);
  const current = mine.filter((a) => a.feeStructure.institutionId === institutionId && a.feeStructure.academicYear?.isCurrent);
  const ctxByYear = new Map();
  const ctxFor = prefetch ? (year) => prefetch.ctxFor(year, studentId) : async (year) => {
    if (!ctxByYear.has(year.id)) ctxByYear.set(year.id, await loadStudentContext(db, studentId, year));
    return ctxByYear.get(year.id);
  };

  // 1. fees to assign — skip any fee the student already holds in any version
  const heldRoots = new Set(mine.map((h) => h.feeStructure.parentStructureId || h.feeStructure.id));
  for (const s of structures) {
    if (heldRoots.has(s.parentStructureId || s.id)) continue;
    const resolved = await resolveStructureForStudent(db, s, studentId, hasRules(s) ? await ctxFor(s.academicYear) : null);
    if (!(resolved.total > 0)) continue;
    // joining a hostel / bus fee in the middle of the year
    let scale = 1;
    if (midYear && hasRules(s)) {
      const m = monthsLeft(s.academicYear, now);
      if (mode === 'NEXT_TERM') { out.deferred.push({ structureId: s.id, name: s.name, total: resolved.total, reason: 'Charged from next term (Fee Policy)' }); continue; }
      if (mode === 'PRORATA') scale = m.left / m.total;
    }
    out.assign.push({ structureId: s.id, name: s.name, total: round2(resolved.items.reduce((t, i) => t + round2(i.amount * scale), 0)), fullTotal: resolved.total, scale, items: resolved.items.filter((i) => i.amount > 0) });
  }

  // 2. current-year fees with rules whose answer changed
  for (const a of current) {
    const s = a.feeStructure;
    if (!hasRules(s)) continue;
    const resolved = await resolveStructureForStudent(db, s, studentId, await ctxFor(s.academicYear));
    const m = monthsLeft(s.academicYear, now);
    const factor = mode === 'PRORATA' ? m.left / m.total : 1;
    const changes = [];
    for (const r of resolved.items) {
      const item = a.items.find((i) => i.feeHeadId === r.feeHeadId);
      const basis = item ? (item.basisAmount ?? item.amount) : 0;
      if (Math.abs(basis - r.amount) < 0.01) continue;
      const current = item ? item.amount : 0;
      const paid = item ? item.paidAmount : 0;
      const to = Math.max(round2(paid), round2(current + (r.amount - basis) * factor), 0);
      changes.push({ feeHeadId: r.feeHeadId, feeHeadName: r.feeHeadName, from: current, to: round2(to), basisFrom: basis, basisTo: r.amount, note: r.note, itemId: item?.id || null });
    }
    if (!changes.length) continue;
    if (mode === 'NEXT_TERM') { out.deferred.push({ assignmentId: a.id, name: s.name, changes, reason: 'Applied from next term (Fee Policy)' }); continue; }
    const totalTo = round2(a.items.reduce((t, i) => t + (changes.find((c) => c.itemId === i.id)?.to ?? i.amount), 0) + changes.filter((c) => !c.itemId).reduce((t, c) => t + c.to, 0));
    out.adjust.push({ assignmentId: a.id, name: s.name, totalFrom: a.totalAmount, totalTo, changes, monthsLeft: m.left, monthsTotal: m.total });
  }
  return out;
};

/**
 * planStudentFeeSync for many students (a class) with a handful of queries in all: the
 * students, all their fees, the class's fee structures once, and the rule details (quota,
 * hostel, bus, siblings) once per academic year. → Map(studentId → plan).
 */
const planFeeSyncForStudents = async (db, { institutionId, studentIds, event = 'MANUAL', policy = null, now = new Date() }) => {
  const p = policy || await getFeePolicy(db, institutionId);
  const ids = [...new Set(studentIds)];
  const [students, fees] = await Promise.all([
    db.student.findMany({ where: { id: { in: ids }, institutionId }, select: { id: true, courseId: true, sectionId: true, status: true } }),
    db.studentFeeAssignment.findMany({
      where: { studentId: { in: ids } },
      include: { items: true, feeStructure: { include: STRUCTURE_INCLUDE } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);
  const feesBy = new Map(ids.map((id) => [id, []]));
  fees.forEach((f) => feesBy.get(f.studentId)?.push(f));
  const studentBy = new Map(students.map((s) => [s.id, s]));
  const ctxByYear = new Map(); // yearId → Promise<Map(studentId → context)>
  const ctxFor = async (year, studentId) => {
    if (!ctxByYear.has(year.id)) ctxByYear.set(year.id, loadStudentContexts(db, ids, year));
    return (await ctxByYear.get(year.id)).get(studentId) || null;
  };
  const cache = {};
  const out = new Map();
  for (const id of ids) {
    const student = studentBy.get(id);
    out.set(id, student
      ? await planStudentFeeSync(db, { institutionId, studentId: id, event, policy: p, now, cache, prefetch: { student, fees: feesBy.get(id), ctxFor } })
      : null);
  }
  return out;
};

/** Applies a plan (from planStudentFeeSync). Returns a short summary. */
const applyStudentFeeSync = async (db, { institutionId, studentId, plan }) => {
  const { recomputeItems } = require('./feeItems');
  const summary = { assigned: [], adjusted: [] };
  for (const x of plan.assign) {
    const structure = await db.feeStructure.findFirst({ where: { id: x.structureId, institutionId, status: 'PUBLISHED' }, include: STRUCTURE_INCLUDE });
    if (!structure) continue;
    const a = await db.$transaction(async (tx) => {
      // re-check inside the transaction: never two versions of one fee
      const root = structure.parentStructureId || structure.id;
      const dup = await tx.studentFeeAssignment.findFirst({ where: { studentId, feeStructure: { OR: [{ id: root }, { parentStructureId: root }] } }, select: { id: true } });
      if (dup) return null;
      return assignResolvedStructure(tx, structure, studentId, { scale: x.scale });
    });
    if (a) summary.assigned.push({ assignmentId: a.id, name: x.name, total: a.totalAmount });
  }
  for (const x of plan.adjust) {
    await db.$transaction(async (tx) => {
      for (const c of x.changes) {
        if (c.itemId) {
          const hasPayments = c.to <= 0 ? await tx.paymentAllocation.count({ where: { studentFeeItemId: c.itemId } }) : 1;
          if (c.to <= 0 && hasPayments === 0) await tx.studentFeeItem.delete({ where: { id: c.itemId } });
          else await tx.studentFeeItem.update({ where: { id: c.itemId }, data: { amount: c.to, basisAmount: c.basisTo, note: c.note } });
        } else if (c.to > 0) {
          await tx.studentFeeItem.create({ data: { studentFeeAssignmentId: x.assignmentId, feeHeadId: c.feeHeadId, feeHeadName: c.feeHeadName, amount: c.to, dueAmount: c.to, basisAmount: c.basisTo, note: c.note } });
        }
      }
      const a = await tx.studentFeeAssignment.findUnique({ where: { id: x.assignmentId }, include: { items: { select: { amount: true } } } });
      const total = round2(a.items.reduce((t, i) => t + i.amount, 0));
      const due = round2(Math.max(0, total - a.discountAmount - a.paidAmount));
      await tx.studentFeeAssignment.update({ where: { id: a.id }, data: { totalAmount: total, dueAmount: due, status: due <= 0 ? 'PAID' : a.paidAmount > 0 ? 'PARTIAL' : 'PENDING' } });
      await recomputeItems(tx, a.id);
    });
    summary.adjusted.push({ assignmentId: x.assignmentId, name: x.name, from: x.totalFrom, to: x.totalTo });
  }
  return summary;
};

const POLICY_SWITCH = { ADMISSION: 'autoAssignOnAdmission', PROMOTION: 'autoAssignOnPromotion', SERVICE_CHANGE: 'autoAdjustOnServiceChange' };

/**
 * The automatic path for events: runs only when that event's Fee Policy switch is on, never
 * throws into the caller (admission etc. must succeed even if fees fail — it's logged), and
 * writes an audit row. Returns the summary, or null when off / nothing to do.
 */
const autoSyncStudentFees = async (db, { institutionId, studentId, event, userId = null }) => {
  try {
    const policy = await getFeePolicy(db, institutionId);
    if (!policy[POLICY_SWITCH[event]]) return null;
    const plan = await planStudentFeeSync(db, { institutionId, studentId, event, policy });
    if (!plan || (!plan.assign.length && !plan.adjust.length)) return null;
    const summary = await applyStudentFeeSync(db, { institutionId, studentId, plan });
    db.auditLog.create({
      data: { institutionId, userId, action: 'FEES_AUTO_SYNCED', module: 'FEES', entity: 'Student', entityId: studentId, newValues: JSON.stringify({ event, ...summary }) },
    }).catch(() => {});
    return summary;
  } catch (err) {
    logger.error(`Automatic fee sync (${event}) failed for student ${studentId}: ${err.message}`);
    return null;
  }
};

module.exports = { findMatchingStructures, assignResolvedStructure, planStudentFeeSync, planFeeSyncForStudents, applyStudentFeeSync, autoSyncStudentFees, monthsLeft, STRUCTURE_INCLUDE };
