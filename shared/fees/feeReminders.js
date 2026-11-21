/**
 * Fee reminders — in-app (bell + push) messages and SMS to the student and/or their parents,
 * on the schedule in the institution's Fee Policy:
 *   BEFORE  once, from `reminderBeforeDays` days before the due date
 *   DUE     once, on the due date (or the first run after it, while not yet AFTER)
 *   AFTER   every `reminderAfterEveryDays` days overdue, at most `reminderAfterMaxTimes`
 *   MANUAL  "Send reminder now" from the admin — at most once a day per fee
 * Each fee's due dates are its open instalments (or the fee's own due date without
 * instalments). FeeReminderLog makes each reminder go out once even if the job runs often
 * or catches up after the server was asleep. A fee whose structure overrides
 * remindersEnabled to false is skipped entirely.
 *
 * SMS (smsRemindersEnabled) goes only to people with unpaid fees: by default only once a due
 * date has passed (smsOn OVERDUE — the AFTER reminders), only when at least smsMinDue is
 * unpaid, to the parent's / student's phone (smsRecipients). Each SMS uses the
 * institution's SMS credits (shared/utils/notifications.js) and is logged in SmsLog with
 * purpose FEE_REMINDER. SMS and in-app reminders can be switched on independently.
 */
const prisma = require('../database/client');
const logger = require('../utils/logger');
const { pushNotificationsBatch } = require('../utils/notificationCenter');
const { sendSMSNotification } = require('../utils/notifications');
const { getFeePolicy, effectivePolicy, round2, inr } = require('./feePolicy');
const { lateFeeSummary } = require('./lateFee');

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const ymd = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const dateLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const DEFAULT_MESSAGE = 'Dear {name}, {fee}: {amount} {when}.{lateFee} Please pay at the fee office or online.';
const DEFAULT_SMS = '{institution}: Fee of {amount} for {name} {when}. Please pay at the earliest.';

const render = (template, v, fallback = DEFAULT_MESSAGE) => (template || fallback).replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? String(v[k]) : m));

/** A usable mobile number (last 10 digits), or null. */
const phoneOf = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
};

/** Whom to notify for many students in one query → Map(studentId → { userIds (in-app), phones (SMS) }). */
const recipientsForMany = async (studentIds, who, smsWho = 'PARENT') => {
  const rows = await prisma.student.findMany({
    where: { id: { in: [...new Set(studentIds)] } },
    select: {
      id: true,
      userId: true, phone: true, user: { select: { mobile: true } },
      parents: { select: { parent: { select: { userId: true, guardianPhone: true, fatherPhone: true, motherPhone: true, user: { select: { mobile: true } } } } } },
    },
  });
  return new Map(rows.map((s) => [s.id, recipientsOf(s, who, smsWho)]));
};

const recipientsOf = (s, who, smsWho) => {
  const ids = [];
  if (who !== 'PARENT') ids.push(s.userId);
  if (who !== 'STUDENT') s.parents.forEach((p) => ids.push(p.parent?.userId));
  const phones = [];
  if (smsWho !== 'PARENT') phones.push(phoneOf(s.phone) || phoneOf(s.user?.mobile));
  if (smsWho !== 'STUDENT') {
    // one number per parent: guardian first, then father, mother, their login mobile
    s.parents.forEach(({ parent: p }) => phones.push(phoneOf(p?.guardianPhone) || phoneOf(p?.fatherPhone) || phoneOf(p?.motherPhone) || phoneOf(p?.user?.mobile)));
  }
  return { userIds: [...new Set(ids.filter(Boolean))], phones: [...new Set(phones.filter(Boolean))] };
};

/** The open due dates of one fee: [{ key, amount, dueDate, label }]. */
const openTargets = (a) => {
  if (a.installments.length) {
    return a.installments
      .filter((i) => i.status !== 'PAID' && round2(i.amount - i.paidAmount) > 0)
      .map((i) => ({ key: i.id, amount: round2(i.amount - i.paidAmount), dueDate: i.dueDate, label: `Instalment ${i.installmentNumber}` }));
  }
  return a.dueAmount > 0 ? [{ key: a.id, amount: round2(a.dueAmount), dueDate: a.feeStructure.dueDate, label: null }] : [];
};

/** Which scheduled reminder (if any) is due for one target today. */
const scheduledKind = (policy, dueDate, today) => {
  const days = Math.floor((startOfDay(today) - startOfDay(dueDate)) / DAY); // < 0 before, 0 on the day
  if (days < 0) return policy.reminderBeforeDays > 0 && -days <= policy.reminderBeforeDays ? { kind: 'BEFORE', seq: 0, days } : null;
  const every = policy.reminderAfterEveryDays;
  if (every > 0 && days >= every) {
    const seq = Math.floor(days / every);
    return seq <= policy.reminderAfterMaxTimes ? { kind: 'AFTER', seq, days } : null;
  }
  return policy.reminderOnDueDate ? { kind: 'DUE', seq: 0, days } : null;
};

/** Whether this reminder also goes by SMS under the policy. */
const smsWanted = (policy, kind, dueAmount) => policy.smsRemindersEnabled
  && (policy.smsOn === 'ALL' || kind === 'AFTER')
  && dueAmount > 0 && dueAmount >= (policy.smsMinDue || 0);

/** The in-app title/message and the SMS text for one reminder. */
const buildTexts = ({ policy, a, target, days, institution }) => {
  const lf = lateFeeSummary(a);
  const when = days < 0 ? `is due on ${dateLabel(target.dueDate)}`
    : days === 0 ? 'is due today'
      : `was due on ${dateLabel(target.dueDate)} (${days} day${days === 1 ? '' : 's'} overdue)`;
  const vars = {
    name: `${a.student.firstName} ${a.student.lastName}`.trim(),
    fee: target.label ? `${a.feeStructure.name} — ${target.label}` : a.feeStructure.name,
    amount: inr(target.amount),
    dueDate: dateLabel(target.dueDate),
    daysOverdue: Math.max(0, days),
    when,
    lateFee: lf.due > 0 ? ` A late fee of ${inr(lf.due)} also applies.` : '',
    institution: institution?.name || '',
  };
  return {
    title: days > 0 ? 'Fee overdue' : 'Fee reminder',
    message: render(policy.reminderMessage, vars).slice(0, 1000),
    // SMS stays short: plain amount (₹ is fine on Indian gateways), no late-fee sentence by default
    smsText: render(policy.smsMessage, { ...vars, when: days > 0 ? `is overdue since ${vars.dueDate}` : days === 0 ? 'is due today' : `is due on ${vars.dueDate}` }, DEFAULT_SMS).slice(0, 300),
  };
};

// one run per institution at a time in this process (the job and "Send today's reminders now")
const RUNNING = '__scomsFeeRemindersRunning';
if (!global[RUNNING]) global[RUNNING] = new Set();

/**
 * Sends a list of reminders [{ policy, a, target, kind, seq, days, push, sms }] with a few
 * queries in all: one read of which were already sent, one insert claiming the rest (the
 * unique key still guards every row), one insert for all their in-app notifications, then
 * the SMS one by one (each is a call to the SMS provider) and a log update only for rows
 * whose counts differ from what was claimed. Returns { sent, skipped, sms: Map(key → n) }.
 */
const sendMany = async (list, { people, institution, today }) => {
  const k = (x) => `${x.target.key}|${x.kind}|${x.seq}`;
  const existing = new Set();
  const keys = [...new Set(list.map((x) => x.target.key))];
  for (let i = 0; i < keys.length; i += 2000) {
    (await prisma.feeReminderLog.findMany({ where: { targetKey: { in: keys.slice(i, i + 2000) } }, select: { targetKey: true, kind: true, seq: true } }))
      .forEach((r) => existing.add(`${r.targetKey}|${r.kind}|${r.seq}`));
  }
  const seen = new Set();
  const fresh = list.filter((x) => { const key = k(x); if (existing.has(key) || seen.has(key)) return false; seen.add(key); return true; });
  const rcpt = (x) => people.get(x.a.studentId) || { userIds: [], phones: [] };
  if (fresh.length) {
    const rows = fresh.map((x) => ({
      institutionId: x.a.feeStructure.institutionId, assignmentId: x.a.id, targetKey: x.target.key, kind: x.kind, seq: x.seq, sentOn: ymd(today),
      recipients: x.push ? rcpt(x).userIds.length : 0,
    }));
    for (let i = 0; i < rows.length; i += 2000) await prisma.feeReminderLog.createMany({ data: rows.slice(i, i + 2000), skipDuplicates: true });
  }
  const texts = fresh.map((x) => buildTexts({ ...x, institution }));
  const pushing = fresh.map((x, i) => ({ x, i })).filter(({ x }) => x.push);
  const counts = await pushNotificationsBatch(pushing.map(({ x, i }) => ({
    userIds: rcpt(x).userIds, institutionId: x.a.feeStructure.institutionId, title: texts[i].title, message: texts[i].message, type: 'FEE_REMINDER', link: '/student/fees',
  })));
  const pushed = new Map(pushing.map(({ i }, j) => [i, counts[j]]));
  const smsByKey = new Map();
  for (let i = 0; i < fresh.length; i += 1) {
    const x = fresh[i];
    const expected = x.push ? rcpt(x).userIds.length : 0;
    const recipients = x.push ? pushed.get(i) : 0;
    let smsSent = 0;
    if (x.sms) {
      for (const to of rcpt(x).phones) {
        if (await sendSMSNotification({ to, message: texts[i].smsText, institutionId: x.a.feeStructure.institutionId, purpose: 'FEE_REMINDER' })) smsSent += 1;
      }
    }
    smsByKey.set(k(x), smsSent);
    if (recipients !== expected || smsSent > 0) {
      await prisma.feeReminderLog.updateMany({ where: { targetKey: x.target.key, kind: x.kind, seq: x.seq }, data: { recipients, smsSent } });
    }
  }
  return { sent: fresh.length, skipped: list.length - fresh.length, sms: smsByKey };
};

const loadFees = (institutionId, where = {}) => prisma.studentFeeAssignment.findMany({
  where: { feeStructure: { institutionId }, dueAmount: { gt: 0 }, student: { status: 'ACTIVE' }, ...where },
  select: {
    id: true, studentId: true, dueAmount: true, lateFeeCharged: true, lateFeeWaived: true, lateFeePaid: true,
    student: { select: { firstName: true, lastName: true } },
    feeStructure: { select: { institutionId: true, name: true, dueDate: true, policyOverride: true } },
    installments: { select: { id: true, installmentNumber: true, amount: true, paidAmount: true, dueDate: true, status: true }, orderBy: { installmentNumber: 'asc' } },
  },
});

/** Runs the scheduled reminders for one institution. Returns how many were sent. */
const runInstitutionReminders = async (institutionId, today = new Date()) => {
  const policy = await getFeePolicy(prisma, institutionId);
  if (!policy.remindersEnabled && !policy.smsRemindersEnabled) return 0;
  const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { name: true } });
  const fees = await loadFees(institutionId);
  // everyone's in-app recipients and phone numbers in one query
  const people = await recipientsForMany(fees.map((a) => a.studentId), policy.reminderRecipients, policy.smsRecipients);
  const list = [];
  for (const a of fees) {
    if (a.feeStructure.policyOverride?.remindersEnabled === false) continue; // this fee never reminds
    const p = effectivePolicy(policy, a.feeStructure);
    for (const target of openTargets(a)) {
      const k = scheduledKind(p, target.dueDate, today);
      if (!k) continue;
      const push = !!p.remindersEnabled;
      const sms = smsWanted(p, k.kind, a.dueAmount);
      if (!push && !sms) continue;
      list.push({ policy: p, a, target, ...k, push, sms });
    }
  }
  if (!list.length) return 0;
  if (global[RUNNING].has(institutionId)) return 0; // a run for this institution is already sending
  global[RUNNING].add(institutionId);
  try {
    return (await sendMany(list, { people, institution, today })).sent;
  } finally {
    global[RUNNING].delete(institutionId);
  }
};

/** Every institution with in-app or SMS reminders on. */
const runAllFeeReminders = async (today = new Date()) => {
  const rows = await prisma.feePolicy.findMany({ where: { OR: [{ remindersEnabled: true }, { smsRemindersEnabled: true }] }, select: { institutionId: true } });
  let sent = 0;
  for (const r of rows) {
    try {
      sent += await runInstitutionReminders(r.institutionId, today);
    } catch (err) {
      logger.error(`Fee reminders failed for institution ${r.institutionId}: ${err.message}`);
    }
  }
  return sent;
};

/**
 * "Send reminder now" for chosen fees (once a day each). Works even when scheduled reminders
 * are off. `sms: true` also texts the parent / student (uses SMS credits).
 */
const sendManualReminders = async (institutionId, assignmentIds, { sms = false, today = new Date() } = {}) => {
  const policy = await getFeePolicy(prisma, institutionId);
  const institution = await prisma.institution.findUnique({ where: { id: institutionId }, select: { name: true } });
  const daySeq = Math.floor(startOfDay(today).getTime() / DAY);
  const fees = await loadFees(institutionId, { id: { in: assignmentIds } });
  const people = await recipientsForMany(fees.map((a) => a.studentId), policy.reminderRecipients, policy.smsRecipients);
  const list = [];
  for (const a of fees) {
    const targets = openTargets(a);
    if (!targets.length) continue;
    // one message about the earliest open due date, for the whole amount still owed
    const first = targets.sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate))[0];
    const days = Math.floor((startOfDay(today) - startOfDay(first.dueDate)) / DAY);
    list.push({ policy, a, target: { ...first, key: a.id, amount: round2(a.dueAmount), label: null }, kind: 'MANUAL', seq: daySeq, days, push: true, sms });
  }
  const r = await sendMany(list, { people, institution, today });
  return { sent: r.sent, skipped: r.skipped, smsSent: [...r.sms.values()].reduce((t, n) => t + n, 0) };
};

module.exports = { runAllFeeReminders, runInstitutionReminders, sendManualReminders, scheduledKind, smsWanted, render, phoneOf, DEFAULT_MESSAGE, DEFAULT_SMS };
