/**
 * Fee rules — which fee heads apply to a student, and at what amount.
 *
 * A fee structure item (one head) may carry a rule (FeeStructureItem.rule, null = everyone
 * pays the item's amount):
 *   {
 *     when:       Condition                    the head applies only when this matches
 *     amounts:    [{ when: Condition, amount }] first match sets the amount (e.g. quota price,
 *                                              2nd child's tuition, 0 = waived)
 *     amountFrom: 'TRANSPORT_ROUTE' | 'HOSTEL_BED'   price = the student's route fare / bed fee …
 *     months:     n                            … × n months (default 1)
 *   }
 * Condition (every key given must match; text compares ignore case):
 *   quota[]  category[]  gender[]        Student.admissionQuota / category / gender
 *   newAdmission: bool                   admitted during the fee's academic year
 *   hostel: bool   transport: bool       has a hostel bed / a bus route now
 *   routeIds[]  hostelIds[]              which route / which hostel
 *   siblingOrderMin: n                   n-th child or later (students sharing a parent,
 *                                        in order of admission)
 *   custom: { fieldKey: [values] }       the student's admission custom fields
 * A head that resolves to ₹0 (or whose `when` fails) is not charged at all.
 */
const { ValidationError } = require('../errors/customErrors');

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const LISTS = ['quota', 'category', 'gender', 'routeIds', 'hostelIds'];
const BOOLS = ['newAdmission', 'hostel', 'transport'];
const AMOUNT_FROM = ['TRANSPORT_ROUTE', 'HOSTEL_BED'];

const parseCondition = (c, where) => {
  if (c === null || c === undefined) return null;
  if (typeof c !== 'object' || Array.isArray(c)) throw new ValidationError(`${where}: a condition must be an object`);
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    if (LISTS.includes(k)) {
      if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim())) throw new ValidationError(`${where}: ${k} must be a list of values`);
      out[k] = [...new Set(v.map((x) => x.trim()))];
    } else if (BOOLS.includes(k)) {
      if (typeof v !== 'boolean') throw new ValidationError(`${where}: ${k} must be true or false`);
      out[k] = v;
    } else if (k === 'siblingOrderMin') {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 2 || n > 10) throw new ValidationError(`${where}: siblingOrderMin must be 2 to 10`);
      out[k] = n;
    } else if (k === 'custom') {
      if (typeof v !== 'object' || Array.isArray(v)) throw new ValidationError(`${where}: custom must be { fieldKey: [values] }`);
      const custom = {};
      for (const [fk, vals] of Object.entries(v)) {
        if (!Array.isArray(vals) || vals.length === 0) continue;
        custom[fk] = vals.map((x) => String(x).trim()).filter(Boolean);
      }
      if (Object.keys(custom).length) out.custom = custom;
    } else {
      throw new ValidationError(`${where}: unknown condition "${k}"`);
    }
  }
  return Object.keys(out).length ? out : null;
};

/** Validates one item's rule → the stored form (null when it says nothing). */
const parseRule = (rule, headName = 'fee head') => {
  if (rule === null || rule === undefined) return null;
  if (typeof rule !== 'object' || Array.isArray(rule)) throw new ValidationError(`${headName}: the rule must be an object`);
  const out = {};
  const when = parseCondition(rule.when, `${headName} (applies when)`);
  if (when) out.when = when;
  if (rule.amounts !== undefined && rule.amounts !== null) {
    if (!Array.isArray(rule.amounts)) throw new ValidationError(`${headName}: amounts must be a list`);
    const amounts = rule.amounts.map((a, i) => {
      const amount = round2(a?.amount);
      if (!Number.isFinite(amount) || amount < 0) throw new ValidationError(`${headName}: price ${i + 1} must be 0 or more`);
      const w = parseCondition(a.when, `${headName} (price ${i + 1})`);
      if (!w) throw new ValidationError(`${headName}: price ${i + 1} needs a condition`);
      return { when: w, amount };
    });
    if (amounts.length) out.amounts = amounts;
  }
  if (rule.amountFrom) {
    if (!AMOUNT_FROM.includes(rule.amountFrom)) throw new ValidationError(`${headName}: amountFrom must be ${AMOUNT_FROM.join(' or ')}`);
    const months = rule.months === undefined || rule.months === '' ? 1 : Number(rule.months);
    if (!Number.isInteger(months) || months < 1 || months > 24) throw new ValidationError(`${headName}: months must be 1 to 24`);
    out.amountFrom = rule.amountFrom;
    out.months = months;
  }
  return Object.keys(out).length ? out : null;
};

const norm = (s) => String(s ?? '').trim().toLowerCase();
const inList = (list, value) => value !== null && value !== undefined && value !== '' && list.some((x) => norm(x) === norm(value));

const CONTEXT_SELECT = {
  id: true, admissionQuota: true, category: true, gender: true, customFields: true, admissionDate: true, createdAt: true,
  transport: { select: { routeId: true, route: { select: { routeName: true, monthlyFare: true } } } },
  hostelBed: { select: { hostelId: true, monthlyFee: true, roomNumber: true, hostel: { select: { name: true } } } },
  parents: { select: { parentId: true } },
};

/** Everything a rule may look at, for one student and one academic year. */
const loadStudentContext = async (db, studentId, academicYear = null) => (
  (await loadStudentContexts(db, [studentId], academicYear)).get(studentId) || null
);

/**
 * loadStudentContext for many students in two queries (the students, then every sibling
 * link of their parents) → Map(studentId → context).
 */
const loadStudentContexts = async (db, studentIds, academicYear = null) => {
  const out = new Map();
  if (!studentIds.length) return out;
  const students = await db.student.findMany({ where: { id: { in: [...new Set(studentIds)] } }, select: CONTEXT_SELECT });
  const parentIds = [...new Set(students.flatMap((s) => s.parents.map((p) => p.parentId)))];
  const links = parentIds.length ? await db.parentStudent.findMany({
    where: { parentId: { in: parentIds } },
    select: { parentId: true, student: { select: { id: true, admissionDate: true, createdAt: true, status: true } } },
  }) : [];
  for (const s of students) {
    // sibling order: students sharing a parent, earliest admission first
    let siblingOrder = 1;
    if (s.parents.length) {
      const mine = new Set(s.parents.map((p) => p.parentId));
      const sibs = links.filter((l) => mine.has(l.parentId));
      const unique = [...new Map(sibs.map((x) => [x.student.id, x.student])).values()].filter((x) => x.status === 'ACTIVE' || x.id === s.id);
      unique.sort((a, b) => (new Date(a.admissionDate || a.createdAt) - new Date(b.admissionDate || b.createdAt)) || a.id.localeCompare(b.id));
      siblingOrder = unique.findIndex((x) => x.id === s.id) + 1 || 1;
    }
    const admitted = new Date(s.admissionDate || s.createdAt);
    const newAdmission = academicYear ? admitted >= new Date(academicYear.startDate) && admitted <= new Date(academicYear.endDate) : null;
    out.set(s.id, { ...s, siblingOrder, newAdmission, custom: s.customFields && typeof s.customFields === 'object' ? s.customFields : {} });
  }
  return out;
};

const matches = (cond, ctx) => {
  if (!cond) return true;
  if (cond.quota && !inList(cond.quota, ctx.admissionQuota)) return false;
  if (cond.category && !inList(cond.category, ctx.category)) return false;
  if (cond.gender && !inList(cond.gender, ctx.gender)) return false;
  if (cond.newAdmission !== undefined && cond.newAdmission !== !!ctx.newAdmission) return false;
  if (cond.hostel !== undefined && cond.hostel !== !!ctx.hostelBed) return false;
  if (cond.transport !== undefined && cond.transport !== !!ctx.transport) return false;
  if (cond.routeIds && !(ctx.transport && cond.routeIds.includes(ctx.transport.routeId))) return false;
  if (cond.hostelIds && !(ctx.hostelBed && cond.hostelIds.includes(ctx.hostelBed.hostelId))) return false;
  if (cond.siblingOrderMin && ctx.siblingOrder < cond.siblingOrderMin) return false;
  if (cond.custom) {
    for (const [k, vals] of Object.entries(cond.custom)) {
      const v = ctx.custom[k];
      const values = Array.isArray(v) ? v : [v];
      if (!values.some((x) => inList(vals, x))) return false;
    }
  }
  return true;
};

/** One head's amount for this student → { amount, note } (amount 0 = not charged). */
const resolveItem = (item, ctx) => {
  const rule = item.rule && typeof item.rule === 'object' ? item.rule : null;
  if (!rule) return { amount: round2(item.amount), note: null };
  if (!matches(rule.when, ctx)) return { amount: 0, note: 'Does not apply' };
  if (rule.amountFrom === 'TRANSPORT_ROUTE') {
    if (!ctx.transport) return { amount: 0, note: 'No bus route' };
    const m = rule.months || 1;
    return { amount: round2(ctx.transport.route.monthlyFare * m), note: `${ctx.transport.route.routeName} fare ₹${ctx.transport.route.monthlyFare} × ${m} month${m > 1 ? 's' : ''}` };
  }
  if (rule.amountFrom === 'HOSTEL_BED') {
    if (!ctx.hostelBed) return { amount: 0, note: 'No hostel bed' };
    const m = rule.months || 1;
    return { amount: round2(ctx.hostelBed.monthlyFee * m), note: `${ctx.hostelBed.hostel?.name || 'Hostel'} room ${ctx.hostelBed.roomNumber} ₹${ctx.hostelBed.monthlyFee} × ${m} month${m > 1 ? 's' : ''}` };
  }
  const hit = (rule.amounts || []).find((a) => matches(a.when, ctx));
  if (hit) return { amount: round2(hit.amount), note: describe(hit.when) };
  return { amount: round2(item.amount), note: null };
};

/** Plain words for a condition (shown on the student's fee item). */
const describe = (c) => {
  if (!c) return null;
  const parts = [];
  if (c.quota) parts.push(`${c.quota.join('/')} quota`);
  if (c.category) parts.push(`${c.category.join('/')} category`);
  if (c.gender) parts.push(c.gender.join('/').toLowerCase());
  if (c.newAdmission !== undefined) parts.push(c.newAdmission ? 'new admission' : 'existing student');
  if (c.hostel !== undefined) parts.push(c.hostel ? 'hosteller' : 'day scholar');
  if (c.transport !== undefined) parts.push(c.transport ? 'bus user' : 'no bus');
  if (c.routeIds) parts.push('selected routes');
  if (c.hostelIds) parts.push('selected hostels');
  if (c.siblingOrderMin) parts.push(`${c.siblingOrderMin}${c.siblingOrderMin === 2 ? 'nd' : c.siblingOrderMin === 3 ? 'rd' : 'th'} child or later`);
  if (c.custom) Object.entries(c.custom).forEach(([k, v]) => parts.push(`${k}: ${v.join('/')}`));
  return parts.join(', ');
};

/** True when any item of the structure has a rule (its amounts can differ per student). */
const hasRules = (structure) => (structure.items || []).some((i) => i.rule);

/**
 * The heads one student pays for a structure → { items: [{ feeHeadId, feeHeadName, amount, note }], total }.
 * `ctx` may be passed in when resolving several structures for the same student.
 */
const resolveStructureForStudent = async (db, structure, studentId, ctx = null) => {
  let context = ctx;
  if (!context && hasRules(structure)) {
    const year = structure.academicYear || await db.academicYear.findUnique({ where: { id: structure.academicYearId }, select: { startDate: true, endDate: true } });
    context = await loadStudentContext(db, studentId, year);
  }
  const items = [];
  for (const it of [...structure.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
    const r = it.rule ? resolveItem(it, context) : { amount: round2(it.amount), note: null };
    items.push({ feeHeadId: it.feeHeadId, feeHeadName: it.feeHead?.name, amount: r.amount, note: r.note, ruled: !!it.rule });
  }
  return { items, total: round2(items.reduce((s, i) => s + i.amount, 0)) };
};

module.exports = { parseRule, parseCondition, loadStudentContext, loadStudentContexts, matches, resolveItem, resolveStructureForStudent, hasRules, describe };
