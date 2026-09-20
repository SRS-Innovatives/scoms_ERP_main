/**
 * Named application events — the vocabulary every emitEvent() call and AutomationRule
 * triggerEvent must draw from. A plain constants object (not an enum in the DB) since
 * new event types should be cheap to add without a migration.
 */
const EVENT_TYPES = {
  STUDENT_ADMITTED: 'STUDENT_ADMITTED',
  STUDENT_PROMOTED: 'STUDENT_PROMOTED',
  FEE_PAID: 'FEE_PAID',
  FEE_OVERDUE: 'FEE_OVERDUE',
  EXAM_RESULT_PUBLISHED: 'EXAM_RESULT_PUBLISHED',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  STAFF_CREATED: 'STAFF_CREATED',
};

module.exports = { EVENT_TYPES };
