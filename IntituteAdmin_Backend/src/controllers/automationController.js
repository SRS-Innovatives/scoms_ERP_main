/**
 * Institute Admin — Event/Automation Engine (Phase 9)
 *
 * Institute Admin configures "when X event fires, send this notification" rules.
 * Events themselves are emitted from real actions elsewhere in the app (see
 * shared/events/dispatcher.js and its one real call site so far, studentController's
 * STUDENT_ADMITTED). This controller is the management surface: CRUD on AutomationRule,
 * EventLog history for visibility into what actually happened, and a manual test-fire
 * endpoint so an admin can verify a rule works without waiting for the real event.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, emitEvent, EVENT_TYPES } = require('../../../shared');

const ACTION_TYPES = ['SEND_SMS', 'SEND_EMAIL', 'SEND_WHATSAPP'];
const VALID_EVENT_TYPES = Object.values(EVENT_TYPES);

const getRules = async (req, res, next) => {
  try {
    const rules = await prisma.automationRule.findMany({
      where: { institutionId: req.institutionId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, rules, 'Automation rules retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getEventTypes = async (req, res, next) => {
  try {
    return sendSuccess(res, VALID_EVENT_TYPES, 'Event types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createRule = async (req, res, next) => {
  try {
    const { name, triggerEvent, actionType, messageTemplate } = req.body;
    if (!name || !triggerEvent || !actionType || !messageTemplate) {
      throw new ValidationError('name, triggerEvent, actionType and messageTemplate are required');
    }
    if (!VALID_EVENT_TYPES.includes(triggerEvent)) throw new ValidationError(`triggerEvent must be one of ${VALID_EVENT_TYPES.join(', ')}`);
    if (!ACTION_TYPES.includes(actionType)) throw new ValidationError(`actionType must be one of ${ACTION_TYPES.join(', ')}`);

    const rule = await prisma.automationRule.create({
      data: { institutionId: req.institutionId, name, triggerEvent, actionType, messageTemplate, createdById: req.user.id },
    });
    return sendSuccess(res, rule, 'Automation rule created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.automationRule.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Automation rule not found');

    const { name, messageTemplate, isActive } = req.body;
    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(messageTemplate !== undefined && { messageTemplate }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    return sendSuccess(res, rule, 'Automation rule updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.automationRule.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Automation rule not found');
    await prisma.automationRule.delete({ where: { id } });
    return sendSuccess(res, null, 'Automation rule deleted');
  } catch (err) {
    next(err);
  }
};

const getEventHistory = async (req, res, next) => {
  try {
    const { eventType } = req.query;
    const logs = await prisma.eventLog.findMany({
      where: { institutionId: req.institutionId, ...(eventType && { eventType }) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return sendSuccess(res, logs, 'Event history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Manually fires a real event with an admin-supplied test payload — the exact same
 * dispatcher path a real STUDENT_ADMITTED (etc.) would go through, logged to EventLog
 * and matched against real active AutomationRule rows, so "does my rule actually work"
 * can be answered without waiting for (or faking) the real triggering action. */
const testFireEvent = async (req, res, next) => {
  try {
    const { eventType, payload } = req.body;
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) throw new ValidationError(`eventType must be one of ${VALID_EVENT_TYPES.join(', ')}`);
    emitEvent(req.institutionId, eventType, { ...(payload || {}), _testFired: true });
    return sendSuccess(res, null, `Test event "${eventType}" fired — check Event History shortly`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRules, getEventTypes, createRule, updateRule, deleteRule, getEventHistory, testFireEvent };
