/**
 * Fee reminder job — runs the Fee Policy reminders (shared/fees/feeReminders.js) a couple of
 * minutes after start-up and then every few hours. Each reminder is logged once
 * (FeeReminderLog), so running often — or catching up after the server was asleep — never
 * sends a duplicate. Set FEE_REMINDERS_JOB=off to disable it (e.g. on a second instance).
 */
const logger = require('../../../shared/utils/logger');
const { runAllFeeReminders } = require('../../../shared/fees/feeReminders');

const FIRST_RUN_MS = 2 * 60 * 1000;
const EVERY_MS = 4 * 60 * 60 * 1000;
const STATE_KEY = '__scomsFeeReminderJob';

const tick = async () => {
  const state = global[STATE_KEY];
  if (state.running) return;
  state.running = true;
  try {
    const sent = await runAllFeeReminders();
    if (sent > 0) logger.info(`Fee reminders: ${sent} sent`);
  } catch (err) {
    logger.error(`Fee reminder job failed: ${err.message}`);
  } finally {
    state.running = false;
  }
};

const startFeeReminderJob = () => {
  if (String(process.env.FEE_REMINDERS_JOB || '').toLowerCase() === 'off') return;
  if (global[STATE_KEY]?.started) return;
  global[STATE_KEY] = { started: true, running: false };
  setTimeout(() => { void tick(); }, FIRST_RUN_MS).unref?.();
  setInterval(() => { void tick(); }, EVERY_MS).unref?.();
};

module.exports = { startFeeReminderJob };
