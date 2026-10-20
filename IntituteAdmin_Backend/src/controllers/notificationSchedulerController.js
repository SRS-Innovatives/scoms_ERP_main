/**
 * Institute Admin — Notification Scheduler
 *
 * Queues an SMS/Email/WhatsApp broadcast for a future time instead of sending it now.
 * Dispatch reuses broadcastController's exact resolveRecipients/personalize/send
 * pipeline (imported, never duplicated) — a scheduled notification behaves identically
 * to an immediate one, just triggered later by runDueNotifications() instead of by a
 * request. The dispatch job sleeps until the next PENDING row is due (no idle polling)
 * and wakeNotificationScheduler() re-arms it when a row is created or cancelled.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, sendSMSNotification, sendEmailNotification, sendWhatsAppNotification } = require('../../../shared');
const { resolveRecipients, personalize, RECIPIENT_GROUPS } = require('./broadcastController');

const CHANNELS = ['SMS', 'EMAIL', 'WHATSAPP'];
const dispatchingIds = new Set();

const wakeScheduler = () => {
  // Lazy require: the job module loads this controller, so a top-level import would cycle.
  const { wakeNotificationScheduler } = require('../jobs/notificationSchedulerJob');
  wakeNotificationScheduler();
};

const getScheduled = async (req, res, next) => {
  try {
    const notifications = await prisma.scheduledNotification.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { scheduledFor: 'desc' },
      take: 100,
    });
    return sendSuccess(res, notifications, 'Scheduled notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createScheduled = async (req, res, next) => {
  try {
    const { channel, recipientGroup, courseId, subject, message, scheduledFor } = req.body;
    if (!channel || !CHANNELS.includes(channel)) throw new ValidationError(`channel must be one of ${CHANNELS.join(', ')}`);
    if (!recipientGroup || !RECIPIENT_GROUPS.includes(recipientGroup)) throw new ValidationError(`recipientGroup must be one of ${RECIPIENT_GROUPS.join(', ')}`);
    if (!message) throw new ValidationError('message is required');
    if (channel === 'EMAIL' && !subject) throw new ValidationError('subject is required for an EMAIL channel');
    if (!scheduledFor) throw new ValidationError('scheduledFor is required');
    const when = new Date(scheduledFor);
    if (Number.isNaN(when.getTime()) || when <= new Date()) throw new ValidationError('scheduledFor must be a valid future date/time');

    const scheduled = await prisma.scheduledNotification.create({
      data: {
        institutionId: req.institutionId,
        channel,
        recipientGroup,
        courseId: courseId || null,
        subject: subject || null,
        message,
        scheduledFor: when,
        createdById: req.user.id,
      },
    });
    wakeScheduler();
    return sendSuccess(res, scheduled, 'Notification scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
};

const cancelScheduled = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.scheduledNotification.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Scheduled notification not found');
    if (existing.status !== 'PENDING') throw new ValidationError('Only a PENDING scheduled notification can be cancelled');

    const cancelled = await prisma.scheduledNotification.update({ where: { id }, data: { status: 'CANCELLED' } });
    wakeScheduler();
    return sendSuccess(res, cancelled, 'Scheduled notification cancelled');
  } catch (err) {
    next(err);
  }
};

/** Sends one due ScheduledNotification for real (through the same simulated/live
 * gateway pipeline as an immediate broadcast) and marks it SENT/FAILED. Exported so the
 * dispatch job can call it without duplicating any send logic. */
const dispatchOne = async (scheduled) => {
  if (dispatchingIds.has(scheduled.id)) return;
  dispatchingIds.add(scheduled.id);
  try {
    const recipients = await resolveRecipients(scheduled.institutionId, scheduled.recipientGroup, scheduled.courseId);
    let sent = 0;
    let skipped = 0;

    for (const r of recipients) {
      if (scheduled.channel === 'SMS') {
        if (!r.phone) { skipped++; continue; }
        const ok = await sendSMSNotification({ to: r.phone, message: personalize(scheduled.message, r.name), institutionId: scheduled.institutionId, purpose: 'SCHEDULED_BROADCAST' });
        if (ok) sent++; else skipped++;
      } else if (scheduled.channel === 'EMAIL') {
        if (!r.email) { skipped++; continue; }
        const ok = await sendEmailNotification({ to: r.email, subject: personalize(scheduled.subject, r.name), text: personalize(scheduled.message, r.name), institutionId: scheduled.institutionId, purpose: 'SCHEDULED_BROADCAST' });
        if (ok) sent++; else skipped++;
      } else if (scheduled.channel === 'WHATSAPP') {
        if (!r.phone) { skipped++; continue; }
        const ok = await sendWhatsAppNotification({ to: r.phone, message: personalize(scheduled.message, r.name), institutionId: scheduled.institutionId, purpose: 'SCHEDULED_BROADCAST' });
        if (ok) sent++; else skipped++;
      }
    }

    await prisma.scheduledNotification.update({
      where: { id: scheduled.id },
      data: { status: 'SENT', sentAt: new Date(), resultSummary: { totalRecipients: recipients.length, sent, skipped } },
    });
  } catch (err) {
    await prisma.scheduledNotification.update({
      where: { id: scheduled.id },
      data: { status: 'FAILED', errorMessage: err.message },
    }).catch(() => {});
  } finally {
    dispatchingIds.delete(scheduled.id);
  }
};

/** Finds due PENDING notifications and dispatches them. Bounded so a large backlog
 * cannot load the whole table in one go; the job re-arms immediately when a full
 * batch is returned. dispatchOne() moves each row to SENT/FAILED before the next
 * tick can pick it up (single-process timer, plus an in-memory in-flight guard). */
const runDueNotifications = async (take = 50) => {
  const due = await prisma.scheduledNotification.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: 'asc' },
    take,
  });
  for (const scheduled of due) {
    await dispatchOne(scheduled);
  }
  return due.length;
};

module.exports = { getScheduled, createScheduled, cancelScheduled, runDueNotifications };
