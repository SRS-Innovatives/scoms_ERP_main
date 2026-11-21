/**
 * Student — SMS & WhatsApp preferences (Settings → Notifications)
 *
 * Which school messages the student / parent wants by SMS and by WhatsApp: attendance alerts,
 * fee reminders, announcements. Login details, password / OTP and platform notices are always
 * sent. Enforced for every message in shared/utils/notificationPreferences.js. Either the student
 * or the parent (for the child they are viewing) can change it — the phone it applies to is
 * usually the parent's.
 */
const { Prisma } = require('@prisma/client');
const { prisma, sendSuccess, ValidationError, NotFoundError } = require('../../../shared');
const { normalizePrefs, clearPrefsCache, CHANNELS, CATEGORIES } = require('../../../shared/utils/notificationPreferences');

/** Where messages for this student go today — shown so the parent knows which number is meant. */
const recipientPhones = (s) => {
  const mask = (p) => (p && String(p).replace(/\D/g, '').length >= 10 ? `••••••${String(p).replace(/\D/g, '').slice(-4)}` : null);
  const list = [
    ...(s.parents || []).flatMap((ps) => [['Father', ps.parent?.fatherPhone], ['Mother', ps.parent?.motherPhone], ['Guardian', ps.parent?.guardianPhone]]),
    ['Student', s.phone],
  ].map(([who, p]) => ({ who, phone: mask(p) })).filter((x) => x.phone);
  const seen = new Set();
  return list.filter((x) => (seen.has(x.phone) ? false : seen.add(x.phone)));
};

const load = (req) => prisma.student.findFirst({
  where: { id: req.user.studentId, institutionId: req.institutionId },
  select: { notificationPrefs: true, phone: true, parents: { select: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } } },
});

const getPrefs = async (req, res, next) => {
  try {
    const s = await load(req);
    if (!s) throw new NotFoundError('Student not found');
    return sendSuccess(res, { prefs: normalizePrefs(s.notificationPrefs), phones: recipientPhones(s) }, 'Notification preferences retrieved');
  } catch (err) {
    next(err);
  }
};

const updatePrefs = async (req, res, next) => {
  try {
    const body = req.body?.prefs || req.body || {};
    const prefs = {};
    for (const ch of CHANNELS) {
      prefs[ch] = {};
      for (const cat of CATEGORIES) {
        const v = body?.[ch]?.[cat];
        if (v !== undefined && typeof v !== 'boolean') throw new ValidationError(`${ch}.${cat} must be true or false`);
        prefs[ch][cat] = v !== false;
      }
    }
    const allOn = CHANNELS.every((ch) => CATEGORIES.every((cat) => prefs[ch][cat]));
    const s = await prisma.student.update({
      where: { id: req.user.studentId },
      data: { notificationPrefs: allOn ? Prisma.DbNull : prefs }, // all on = the default, nothing stored
      select: { institutionId: true },
    });
    clearPrefsCache(s.institutionId);
    return sendSuccess(res, { prefs }, 'Notification preferences saved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPrefs, updatePrefs };
