/**
 * Student / parent SMS & WhatsApp preferences (Student portal → Settings), enforced for every
 * message in one place: sendSMSNotification / sendWhatsAppNotification (./notifications.js) ask
 * isOptedOut() before spending a credit.
 *
 * What can be switched off, by the message's `purpose`:
 *   attendance     ATTENDANCE_ALERT                      (absent / late alerts)
 *   fees           FEE_REMINDER                          (due / overdue reminders)
 *   announcements  BULK_BROADCAST, SCHEDULED_BROADCAST,  (circulars, school messages,
 *                  STAFF_BROADCAST, AUTOMATION            automated messages)
 * Everything else — login details, password / OTP, platform notices — is always sent.
 *
 * Stored on Student.notificationPrefs; null / missing = everything on. A message goes to a phone,
 * not to a student, and one phone can belong to several students (siblings share a parent): the
 * phone is skipped only when EVERY student of this institution linked to it has switched that
 * message off — one child's choice never silences the other child's alerts.
 */
const { Prisma } = require('@prisma/client');
const prisma = require('../database/client');

const CHANNELS = ['sms', 'whatsapp'];
const CATEGORIES = ['attendance', 'fees', 'announcements'];
const CATEGORY_OF_PURPOSE = {
  ATTENDANCE_ALERT: 'attendance',
  FEE_REMINDER: 'fees',
  BULK_BROADCAST: 'announcements',
  SCHEDULED_BROADCAST: 'announcements',
  STAFF_BROADCAST: 'announcements',
  AUTOMATION: 'announcements',
};

/** Always a full { sms: {...}, whatsapp: {...} } of booleans (missing = true). */
const normalizePrefs = (raw) => {
  const out = {};
  for (const ch of CHANNELS) {
    out[ch] = {};
    for (const cat of CATEGORIES) out[ch][cat] = raw?.[ch]?.[cat] !== false;
  }
  return out;
};

const last10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);

const phonesOf = (s) => [
  s.phone, s.alternatePhone, s.user?.mobile,
  ...(s.parents || []).flatMap((ps) => [ps.parent?.fatherPhone, ps.parent?.motherPhone, ps.parent?.guardianPhone]),
].map(last10).filter((p) => p.length === 10);

const PHONE_SELECT = {
  id: true, phone: true, alternatePhone: true, user: { select: { mobile: true } },
  parents: { select: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
};

// per institution: the students who switched something off, with their phones (60 s)
const TTL_MS = 60 * 1000;
const cache = new Map();
const optedOutStudents = async (institutionId) => {
  const hit = cache.get(institutionId);
  if (hit && hit.at > Date.now() - TTL_MS) return hit.rows;
  const students = await prisma.student.findMany({
    where: { institutionId, NOT: { notificationPrefs: { equals: Prisma.DbNull } } },
    select: { ...PHONE_SELECT, notificationPrefs: true },
  });
  const rows = students
    .map((s) => ({ id: s.id, prefs: normalizePrefs(s.notificationPrefs), phones: new Set(phonesOf(s)) }))
    .filter((r) => CHANNELS.some((ch) => CATEGORIES.some((cat) => r.prefs[ch][cat] === false)));
  cache.set(institutionId, { at: Date.now(), rows });
  return rows;
};
const clearPrefsCache = (institutionId) => { if (institutionId) cache.delete(institutionId); else cache.clear(); };

/** Should this message NOT be sent to this phone? (never throws — on any problem: send) */
const isOptedOut = async ({ institutionId, to, channel, purpose }) => {
  try {
    const category = CATEGORY_OF_PURPOSE[purpose];
    const phone = last10(to);
    if (!category || !institutionId || phone.length !== 10 || !CHANNELS.includes(channel)) return false;

    const rows = await optedOutStudents(institutionId);
    const off = rows.filter((r) => r.phones.has(phone) && r.prefs[channel][category] === false);
    if (off.length === 0) return false;

    // every student of the institution reachable on this phone — all must have switched it off
    const linked = await prisma.student.findMany({
      where: {
        institutionId,
        OR: [
          { phone: { endsWith: phone } },
          { alternatePhone: { endsWith: phone } },
          { user: { mobile: { endsWith: phone } } },
          { parents: { some: { parent: { OR: [{ fatherPhone: { endsWith: phone } }, { motherPhone: { endsWith: phone } }, { guardianPhone: { endsWith: phone } }] } } } },
        ],
      },
      select: { id: true },
    });
    const offIds = new Set(off.map((r) => r.id));
    return linked.length > 0 ? linked.every((s) => offIds.has(s.id)) : true;
  } catch {
    return false;
  }
};

module.exports = { isOptedOut, normalizePrefs, clearPrefsCache, CATEGORY_OF_PURPOSE, CHANNELS, CATEGORIES };
