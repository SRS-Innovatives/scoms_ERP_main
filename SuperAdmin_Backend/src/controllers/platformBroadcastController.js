/**
 * Super Admin — Notification Center: platform-wide broadcasts.
 *
 * Sends one message to chosen people across all (or chosen) institutions:
 *   audiences   any of INSTITUTE_ADMINS, STAFF, STUDENTS, PARENTS
 *   channels    in-app bell + phone push (always), email and/or SMS (optional)
 * In-app notifications are written straight away; email and SMS go out in the background
 * (each through shared/utils/notifications.js — real when configured, simulated + logged
 * otherwise; platform broadcasts are not charged to any institution's SMS credits).
 *
 * Every broadcast is recorded as an AuditLog row (action PLATFORM_BROADCAST, module
 * COMMUNICATION) with its audience and real delivery counts — that is the history the page
 * shows. No separate table.
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');
const { pushNotificationToMany } = require('../../../shared/utils/notificationCenter');
const { sendEmailNotification, sendSMSNotification } = require('../../../shared/utils/notifications');
const logger = require('../../../shared/utils/logger');

const AUDIENCE_ROLES = {
  INSTITUTE_ADMINS: ['INSTITUTE_ADMIN'],
  STAFF: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STAFF', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HOSTEL_WARDEN', 'EXAM_ADMIN', 'PLACEMENT_OFFICER'],
  STUDENTS: ['STUDENT'],
  PARENTS: ['PARENT'],
};
const AUDIENCE_LABEL = { INSTITUTE_ADMINS: 'Institute Admins', STAFF: 'Staff', STUDENTS: 'Students', PARENTS: 'Parents' };
const ACTION = 'PLATFORM_BROADCAST';
const MAX_EXTERNAL = 5000; // email / SMS per broadcast — a safety cap on cost and time

const phoneOf = (raw) => {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : null;
};

/** Validates audiences + institutions → the Prisma `where` for the recipients. */
const audienceWhere = async ({ audiences, institutionIds }) => {
  const list = Array.isArray(audiences) ? [...new Set(audiences)] : [];
  if (!list.length) throw new ValidationError('Choose at least one audience');
  const bad = list.filter((a) => !AUDIENCE_ROLES[a]);
  if (bad.length) throw new ValidationError(`Unknown audience: ${bad.join(', ')}`);
  let ids = null;
  if (Array.isArray(institutionIds) && institutionIds.length) {
    const found = await prisma.institution.findMany({ where: { id: { in: institutionIds } }, select: { id: true } });
    if (found.length !== new Set(institutionIds).size) throw new ValidationError('One or more institutions were not found');
    ids = found.map((f) => f.id);
  }
  return {
    audiences: list,
    institutionIds: ids,
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      role: { in: list.flatMap((a) => AUDIENCE_ROLES[a]) },
      institution: { status: 'ACTIVE', ...(ids && { id: { in: ids } }) },
    },
  };
};

/** POST /broadcasts/preview { audiences, institutionIds? } — how many people it would reach. */
const previewBroadcast = async (req, res, next) => {
  try {
    const { where } = await audienceWhere(req.body);
    const users = await prisma.user.findMany({ where, select: { email: true, mobile: true } });
    return sendSuccess(res, {
      recipients: users.length,
      withEmail: users.filter((u) => u.email).length,
      withPhone: users.filter((u) => phoneOf(u.mobile)).length,
      maxExternal: MAX_EXTERNAL,
    }, 'Audience counted');
  } catch (err) {
    next(err);
  }
};

/** POST /broadcasts { audiences, institutionIds?, title, message, channels: { email, sms } } */
const sendBroadcast = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    if (!title) throw new ValidationError('A headline is required');
    if (!message) throw new ValidationError('A message is required');
    if (title.length > 150) throw new ValidationError('The headline must be at most 150 characters');
    if (message.length > 2000) throw new ValidationError('The message must be at most 2000 characters');
    const email = req.body.channels?.email === true;
    const sms = req.body.channels?.sms === true;
    const { audiences, institutionIds, where } = await audienceWhere(req.body);

    const users = await prisma.user.findMany({ where, select: { id: true, institutionId: true, email: true, mobile: true } });
    if (!users.length) throw new ValidationError('Nobody matches this audience');

    // in-app (bell + phone push): one insert per institution, in chunks
    const byInst = new Map();
    users.forEach((u) => { if (!byInst.has(u.institutionId)) byInst.set(u.institutionId, []); byInst.get(u.institutionId).push(u.id); });
    let inApp = 0;
    for (const [institutionId, ids] of byInst) {
      for (let i = 0; i < ids.length; i += 5000) {
        const r = await pushNotificationToMany({ userIds: ids.slice(i, i + 5000), institutionId, title, message, type: 'PLATFORM_BROADCAST', link: null });
        inApp += r?.count || 0;
      }
    }

    const emailTo = email ? [...new Set(users.map((u) => u.email).filter(Boolean))].slice(0, MAX_EXTERNAL) : [];
    const smsTo = sms ? [...new Set(users.map((u) => phoneOf(u.mobile)).filter(Boolean))].slice(0, MAX_EXTERNAL) : [];
    const record = {
      title,
      message,
      audiences,
      institutionIds: institutionIds || 'ALL',
      institutions: byInst.size,
      recipients: users.length,
      channels: ['IN_APP', ...(email ? ['EMAIL'] : []), ...(sms ? ['SMS'] : [])],
      inApp,
      email: email ? { queued: emailTo.length, sent: 0, failed: 0, done: emailTo.length === 0 } : null,
      sms: sms ? { queued: smsTo.length, sent: 0, failed: 0, done: smsTo.length === 0 } : null,
    };
    const log = await prisma.auditLog.create({
      data: { userId: req.user.id, action: ACTION, module: 'COMMUNICATION', entity: 'Broadcast', newValues: JSON.stringify(record), ipAddress: req.ip || '', userAgent: req.get('user-agent') || '' },
    });

    // email / SMS in the background — the counts on the history row are updated when done
    if (emailTo.length || smsTo.length) {
      setImmediate(async () => {
        try {
          for (const to of emailTo) {
            const ok = await sendEmailNotification({ to, subject: title, text: message, html: `<p>${message.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</p>`, institutionId: null, purpose: 'PLATFORM_BROADCAST' });
            record.email[ok ? 'sent' : 'failed'] += 1;
          }
          if (record.email) record.email.done = true;
          const text = `${title}: ${message}`.slice(0, 300);
          for (const to of smsTo) {
            const ok = await sendSMSNotification({ to, message: text, institutionId: null, purpose: 'PLATFORM_BROADCAST' });
            record.sms[ok ? 'sent' : 'failed'] += 1;
          }
          if (record.sms) record.sms.done = true;
        } catch (err) {
          logger.error(`Platform broadcast ${log.id} external delivery stopped: ${err.message}`);
        } finally {
          await prisma.auditLog.update({ where: { id: log.id }, data: { newValues: JSON.stringify(record) } }).catch(() => {});
        }
      });
    }

    const extra = [email && `${emailTo.length} email(s)`, sms && `${smsTo.length} SMS`].filter(Boolean).join(' and ');
    return sendSuccess(res, { id: log.id, ...record }, `Sent to ${inApp} people in-app${extra ? `; ${extra} going out now` : ''}`, 201);
  } catch (err) {
    next(err);
  }
};

/** GET /broadcasts?page= — the history (newest first). */
const getBroadcasts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 20;
    const where = { action: ACTION, module: 'COMMUNICATION' };
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { user: { select: { email: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    const ids = [...new Set(rows.flatMap((r) => {
      try { const v = JSON.parse(r.newValues || '{}'); return Array.isArray(v.institutionIds) ? v.institutionIds : []; } catch { return []; }
    }))];
    const insts = ids.length ? await prisma.institution.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
    const instName = new Map(insts.map((i) => [i.id, i.name]));
    const data = rows.map((r) => {
      let v = {};
      try { v = JSON.parse(r.newValues || '{}'); } catch { /* keep {} */ }
      return {
        id: r.id,
        sentAt: r.createdAt,
        sentBy: r.user?.email || null,
        title: v.title,
        message: v.message,
        audiences: (v.audiences || []).map((a) => AUDIENCE_LABEL[a] || a),
        institutions: v.institutionIds === 'ALL' ? 'All institutions' : (v.institutionIds || []).map((id) => instName.get(id) || 'Removed institution').join(', '),
        recipients: v.recipients || 0,
        channels: v.channels || [],
        inApp: v.inApp || 0,
        email: v.email || null,
        sms: v.sms || null,
      };
    });
    return res.status(200).json({ success: true, message: 'Broadcasts retrieved', data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
  } catch (err) {
    next(err);
  }
};

module.exports = { previewBroadcast, sendBroadcast, getBroadcasts, AUDIENCE_ROLES };
