/**
 * Event dispatcher (Phase 9) — the one listener on the event bus. Every emitted event
 * is logged (EventLog, for audit/history) and matched against that institution's active
 * AutomationRule rows; a match sends a real notification through the exact same
 * sendSMSNotification/sendEmailNotification/sendWhatsAppNotification pipeline every
 * other notification path in this app already uses — never duplicated.
 *
 * Registered once, at module load time, so requiring this file anywhere (shared/index.js
 * does it once) wires it up for that process — no per-backend server.js changes needed.
 * A failure here is always swallowed and logged, never thrown back at the code that
 * emitted the event — emitting must never risk breaking the real action that triggered it.
 */
const eventBus = require('./eventBus');
const prisma = require('../database/client');
const logger = require('../utils/logger');
const { sendSMSNotification, sendEmailNotification, sendWhatsAppNotification } = require('../utils/notifications');

const EVENT_NAME = 'scoms:event';

/** Same {{name}}-style placeholder convention broadcastController's personalize() uses —
 * resolved from the event's own payload instead of a recipient list. */
const applyTemplate = (template, payload) =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => (payload?.[key] !== undefined ? String(payload[key]) : match));

const runRule = async (rule, payload, institutionId) => {
  const message = applyTemplate(rule.messageTemplate, payload);
  try {
    if (rule.actionType === 'SEND_SMS' && payload?.phone) {
      await sendSMSNotification({ to: payload.phone, message, institutionId, purpose: 'AUTOMATION' });
    } else if (rule.actionType === 'SEND_EMAIL' && payload?.email) {
      await sendEmailNotification({ to: payload.email, subject: rule.name, text: message, institutionId, purpose: 'AUTOMATION' });
    } else if (rule.actionType === 'SEND_WHATSAPP' && payload?.phone) {
      await sendWhatsAppNotification({ to: payload.phone, message, institutionId, purpose: 'AUTOMATION' });
    } else {
      logger.warn(`[Automation] rule "${rule.name}" skipped — payload missing the contact field its actionType needs`);
    }
  } catch (err) {
    logger.warn(`[Automation] rule "${rule.name}" failed to send`, { error: err.message });
  }
};

eventBus.on(EVENT_NAME, async ({ institutionId, eventType, payload }) => {
  try {
    await prisma.eventLog.create({ data: { institutionId, eventType, payload: payload || undefined } });

    const rules = await prisma.automationRule.findMany({
      where: { institutionId, triggerEvent: eventType, isActive: true },
    });
    for (const rule of rules) {
      await runRule(rule, payload, institutionId);
    }
  } catch (err) {
    logger.warn('[Event Dispatcher] failed to process event', { eventType, error: err.message });
  }
});

/** The one function the rest of the app calls — fire-and-forget, never awaited by the
 * caller, never throws back into the caller's own request handling. */
const emitEvent = (institutionId, eventType, payload = {}) => {
  if (!institutionId || !eventType) return;
  eventBus.emit(EVENT_NAME, { institutionId, eventType, payload });
};

module.exports = { emitEvent };
