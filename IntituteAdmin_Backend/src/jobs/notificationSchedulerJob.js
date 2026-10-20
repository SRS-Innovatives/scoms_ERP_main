/**
 * Notification Scheduler dispatch loop.
 *
 * "Start simple" per the platform architecture rules — no new infra (Redis/Kafka/etc).
 * Sleeps until the next PENDING ScheduledNotification is due, then sends it through the
 * same gateway pipeline as an immediate broadcast. Does not poll the database while
 * idle (nothing PENDING) or while waiting for a future send time.
 *
 * createScheduled / cancelScheduled call wakeNotificationScheduler() so a newly queued
 * (or cancelled) row is picked up immediately instead of waiting for a stale timer.
 *
 * A single Express process already handles all of an institution's traffic here, so an
 * in-process timer is a correct foundation; if this ever needs to scale across multiple
 * processes, this is the one place that would need a real job queue.
 */
const { prisma } = require('../../../shared');
const { runDueNotifications } = require('../controllers/notificationSchedulerController');
const logger = require('../../../shared/utils/logger');

const BATCH_SIZE = 50;
const STUCK_BACKOFF_MS = 30 * 1000;
const MAX_TIMER_MS = 6 * 60 * 60 * 1000; // setTimeout is 32-bit; also recover from clock skew
const STATE_KEY = '__scomsNotificationScheduler';

const getState = () => {
  if (!global[STATE_KEY]) {
    global[STATE_KEY] = { timer: null, running: false, started: false, dirty: false };
  }
  return global[STATE_KEY];
};

const clearTimer = () => {
  const state = getState();
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
};

const armTimer = (delayMs) => {
  const state = getState();
  clearTimer();
  const wait = Math.max(0, Math.min(delayMs, MAX_TIMER_MS));
  state.timer = setTimeout(() => { void tick(); }, wait);
  state.timer.unref?.();
};

const findNextPending = () => prisma.scheduledNotification.findFirst({
  where: { status: 'PENDING' },
  orderBy: { scheduledFor: 'asc' },
  select: { scheduledFor: true },
});

const scheduleNext = async ({ justDispatchedBatch = false } = {}) => {
  if (justDispatchedBatch) {
    armTimer(0);
    return;
  }

  const next = await findNextPending();
  if (!next) return; // idle until wakeNotificationScheduler()

  const delay = next.scheduledFor.getTime() - Date.now();
  // After a pass that found nothing to send, a still-due row would busy-loop. Back off.
  armTimer(delay <= 0 ? STUCK_BACKOFF_MS : delay);
};

const tick = async () => {
  const state = getState();
  if (state.running) {
    state.dirty = true;
    return;
  }
  state.running = true;
  clearTimer();
  try {
    for (;;) {
      state.dirty = false;
      let count;
      try {
        count = await runDueNotifications(BATCH_SIZE);
        if (count > 0) logger.info(`[Notification Scheduler] dispatched ${count} due notification(s)`);
      } catch (err) {
        logger.warn('[Notification Scheduler] dispatch loop failed', { error: err.message });
        if (state.dirty) continue;
        armTimer(STUCK_BACKOFF_MS);
        return;
      }
      if (state.dirty) continue;
      await scheduleNext({ justDispatchedBatch: count >= BATCH_SIZE });
      if (!state.dirty) return;
      clearTimer();
    }
  } finally {
    state.running = false;
  }
};

const startNotificationSchedulerJob = () => {
  const state = getState();
  if (state.started) return;
  state.started = true;
  void tick();
};

/** Re-arm after a schedule/cancel so we don't wait out a stale timer. */
const wakeNotificationScheduler = () => {
  const state = getState();
  if (!state.started) return;
  if (state.running) {
    state.dirty = true;
    return;
  }
  void tick();
};

module.exports = { startNotificationSchedulerJob, wakeNotificationScheduler };
