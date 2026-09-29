/**
 * Notification Scheduler dispatch loop.
 *
 * "Start simple" per the platform architecture rules — no new infra (Redis/Kafka/etc),
 * just an in-process interval that checks for due ScheduledNotification rows and sends
 * them through the same real (or honestly-simulated) gateway pipeline as an immediate
 * broadcast. A single Express process already handles all of an institution's traffic
 * here, so a plain setInterval is a correct foundation; if this ever needs to scale
 * across multiple processes, this is the one place that would need a real job queue.
 */
const { runDueNotifications } = require('../controllers/notificationSchedulerController');
const logger = require('../../../shared/utils/logger');

const CHECK_INTERVAL_MS = 60 * 1000;
let intervalHandle = null;

const startNotificationSchedulerJob = () => {
  if (intervalHandle) return; // never double-start
  intervalHandle = setInterval(async () => {
    try {
      const count = await runDueNotifications();
      if (count > 0) logger.info(`[Notification Scheduler] dispatched ${count} due notification(s)`);
    } catch (err) {
      logger.warn('[Notification Scheduler] dispatch loop failed', { error: err.message });
    }
  }, CHECK_INTERVAL_MS);
  intervalHandle.unref?.(); // never keeps the process alive on its own
};

module.exports = { startNotificationSchedulerJob };
