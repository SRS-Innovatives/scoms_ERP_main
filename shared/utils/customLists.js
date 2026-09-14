/**
 * Institution Custom Lists — self-service picklists (Leave Types, Discipline Categories,
 * Exam Types). No SuperAdmin approval needed here, unlike AdmissionCustomField: these are
 * just labels on fields that are already free-form strings in the schema
 * (LeaveRequest.type, DisciplineRecord.category, Exam.examType), never new
 * data-collection surfaces — so Institute Admin manages them directly.
 *
 * Same "real institution config, sensible default until they customize" pattern used
 * everywhere else in SCOMS (GradeScale, MessageTemplate, ...): an institution that has
 * never touched a list still gets the values every existing form has always offered.
 */
const prisma = require('../database/client');

const DEFAULT_LISTS = {
  LEAVE_TYPE: [
    { code: 'CASUAL', label: 'Casual Leave (CL)' },
    { code: 'EARNED', label: 'Earned Leave (EL)' },
    { code: 'MEDICAL', label: 'Medical Leave (ML)' },
    { code: 'DUTY', label: 'On Duty (OD)' },
  ],
  DISCIPLINE_CATEGORY: [
    { code: 'MINOR', label: 'Minor' },
    { code: 'MAJOR', label: 'Major' },
    { code: 'SEVERE', label: 'Severe' },
  ],
  EXAM_TYPE: [
    { code: 'UNIT_TEST', label: 'Unit Test' },
    { code: 'MID_TERM', label: 'Mid Term' },
    { code: 'FINAL', label: 'Final' },
  ],
};

const LIST_TYPES = Object.keys(DEFAULT_LISTS);

/** The active entries a real form should offer right now — an institution's own
 * customized list if they have one, the sensible default otherwise. */
const getActiveList = async (institutionId, listType) => {
  if (!LIST_TYPES.includes(listType)) return [];
  const rows = await prisma.institutionCustomList.findMany({
    where: { institutionId, listType, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { code: true, label: true },
  });
  return rows.length > 0 ? rows : DEFAULT_LISTS[listType];
};

module.exports = { DEFAULT_LISTS, LIST_TYPES, getActiveList };
