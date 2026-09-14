/**
 * Institute Admin — Bulk SMS & Email Broadcast Controller
 *
 * Reuses the real sendSMSNotification/sendEmailNotification pipeline (real gateway when
 * configured, honestly-logged SIMULATED otherwise, institution wallet credit enforcement)
 * — this controller's only job is resolving a recipient group into real contacts and
 * looping the real send, then returning genuine sent/failed/skipped counts.
 */
const { prisma, sendSuccess, ValidationError, sendSMSNotification, sendEmailNotification, sendWhatsAppNotification } = require('../../../shared');

const RECIPIENT_GROUPS = ['absentees', 'pending_fees', 'course', 'all_students', 'staff', 'pre_admission'];

// The one placeholder we can honestly auto-fill — every other {{token}} in a template
// (otp, amount, dueDate, ...) is left for the sender to fill in by hand, since the
// compose flow has no real per-recipient value for those.
const personalize = (text, recipientName) => text.replace(/\{\{\s*name\s*\}\}/gi, recipientName);

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const parentContact = (student) => {
  const p = student.parents?.[0]?.parent;
  return { phone: p?.fatherPhone || p?.motherPhone || p?.guardianPhone || student.phone || null, email: p?.fatherEmail || p?.motherEmail || student.email || null };
};

/** Resolves a recipient group into { id, name, phone, email } contacts. */
const resolveRecipients = async (institutionId, group, courseId) => {
  if (group === 'absentees') {
    const today = new Date();
    const records = await prisma.attendanceRecord.findMany({
      where: { status: 'ABSENT', session: { institutionId, date: { gte: startOfDay(today), lte: endOfDay(today) } } },
      select: {
        student: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true, fatherEmail: true, motherEmail: true } } } } },
        },
      },
      distinct: ['studentId'],
    });
    return records.map((r) => ({ id: r.student.id, name: `${r.student.firstName} ${r.student.lastName}`, ...parentContact(r.student) }));
  }

  if (group === 'pending_fees') {
    const assignments = await prisma.studentFeeAssignment.findMany({
      where: { institutionId, dueAmount: { gt: 0 } },
      select: {
        student: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true, fatherEmail: true, motherEmail: true } } } } },
        },
      },
      distinct: ['studentId'],
    });
    return assignments.map((a) => ({ id: a.student.id, name: `${a.student.firstName} ${a.student.lastName}`, ...parentContact(a.student) }));
  }

  if (group === 'course') {
    if (!courseId) throw new ValidationError('courseId is required for the "course" recipient group');
    const students = await prisma.student.findMany({
      where: { institutionId, courseId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true, fatherEmail: true, motherEmail: true } } } } },
    });
    return students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, ...parentContact(s) }));
  }

  if (group === 'all_students') {
    const students = await prisma.student.findMany({
      where: { institutionId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true, fatherEmail: true, motherEmail: true } } } } },
    });
    return students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, ...parentContact(s) }));
  }

  if (group === 'pre_admission') {
    const applications = await prisma.preAdmissionApplication.findMany({
      where: { institutionId, status: { notIn: ['REJECTED', 'CONVERTED'] } },
      select: { id: true, studentFirstName: true, studentLastName: true, parentPhone: true, parentEmail: true },
    });
    return applications.map((a) => ({ id: a.id, name: `${a.studentFirstName} ${a.studentLastName || ''}`.trim(), phone: a.parentPhone, email: a.parentEmail }));
  }

  if (group === 'staff') {
    const staff = await prisma.staff.findMany({
      where: { institutionId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, user: { select: { mobile: true, email: true } } },
    });
    return staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, phone: s.user?.mobile || null, email: s.user?.email || null }));
  }

  throw new ValidationError(`recipientGroup must be one of ${RECIPIENT_GROUPS.join(', ')}`);
};

const broadcastSms = async (req, res, next) => {
  try {
    const { recipientGroup, courseId, message } = req.body;
    if (!message) throw new ValidationError('message is required');

    const recipients = await resolveRecipients(req.institutionId, recipientGroup, courseId);
    let sent = 0;
    let skipped = 0;
    for (const r of recipients) {
      if (!r.phone) { skipped++; continue; }
      const ok = await sendSMSNotification({ to: r.phone, message: personalize(message, r.name), institutionId: req.institutionId, purpose: 'BULK_BROADCAST', sentByStaffId: req.user.staffId || null });
      if (ok) sent++; else skipped++;
    }
    return sendSuccess(res, { totalRecipients: recipients.length, sent, skipped }, `SMS sent to ${sent} of ${recipients.length} recipients`);
  } catch (err) {
    next(err);
  }
};

const broadcastEmail = async (req, res, next) => {
  try {
    const { recipientGroup, courseId, subject, message } = req.body;
    if (!subject || !message) throw new ValidationError('subject and message are required');

    const recipients = await resolveRecipients(req.institutionId, recipientGroup, courseId);
    let sent = 0;
    let skipped = 0;
    for (const r of recipients) {
      if (!r.email) { skipped++; continue; }
      const ok = await sendEmailNotification({ to: r.email, subject: personalize(subject, r.name), text: personalize(message, r.name), institutionId: req.institutionId, purpose: 'BULK_BROADCAST' });
      if (ok) sent++; else skipped++;
    }
    return sendSuccess(res, { totalRecipients: recipients.length, sent, skipped }, `Email sent to ${sent} of ${recipients.length} recipients`);
  } catch (err) {
    next(err);
  }
};

const broadcastWhatsapp = async (req, res, next) => {
  try {
    const { recipientGroup, courseId, message } = req.body;
    if (!message) throw new ValidationError('message is required');

    const recipients = await resolveRecipients(req.institutionId, recipientGroup, courseId);
    let sent = 0;
    let skipped = 0;
    for (const r of recipients) {
      if (!r.phone) { skipped++; continue; }
      const ok = await sendWhatsAppNotification({ to: r.phone, message: personalize(message, r.name), institutionId: req.institutionId, purpose: 'BULK_BROADCAST' });
      if (ok) sent++; else skipped++;
    }
    return sendSuccess(res, { totalRecipients: recipients.length, sent, skipped }, `WhatsApp sent to ${sent} of ${recipients.length} recipients`);
  } catch (err) {
    next(err);
  }
};

const getWhatsappLogs = async (req, res, next) => {
  try {
    const logs = await prisma.whatsappLog.findMany({ where: { institutionId: req.institutionId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return sendSuccess(res, logs, 'WhatsApp logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getSmsLogs = async (req, res, next) => {
  try {
    const logs = await prisma.smsLog.findMany({ where: { institutionId: req.institutionId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return sendSuccess(res, logs, 'SMS logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getEmailLogs = async (req, res, next) => {
  try {
    const logs = await prisma.emailLog.findMany({ where: { institutionId: req.institutionId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return sendSuccess(res, logs, 'Email logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { broadcastSms, broadcastEmail, broadcastWhatsapp, getSmsLogs, getEmailLogs, getWhatsappLogs };
