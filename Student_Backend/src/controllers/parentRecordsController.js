/**
 * Parent-only, read-only views of records the school keeps about the active child:
 *   GET /discipline      — conduct incidents (Institute Admin → Student Discipline)
 *   GET /health-records  — nurse / sick-room visits (Institute Admin → Health)
 *   GET /ptm-notes       — parent-teacher meeting notes (Staff → PTM)
 *
 * Parent-only by design: these are written for the family, not the student's own feed.
 * The child is req.user.studentId, already verified as this parent's by
 * resolveActiveChild; every query is also scoped to the caller's institution.
 * Internal fields (who reported it, staff ids) are reduced to a display name.
 */
const { prisma, sendSuccess, AuthorizationError, ROLES } = require('../../../shared');

const MAX_ROWS = 100;

const parentOnly = (req) => {
  if (req.user.role !== ROLES.PARENT) {
    throw new AuthorizationError('These records are shared with parents only.');
  }
};

const staffName = (s) => (s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || null : null);
const STAFF_SELECT = { select: { firstName: true, lastName: true, designation: true } };

const scope = (req) => {
  const institutionId = req.institutionId || req.user.institutionId;
  if (!req.user.studentId || !institutionId) throw new AuthorizationError('No active child selected.');
  return { studentId: req.user.studentId, institutionId };
};

const getDisciplineRecords = async (req, res, next) => {
  try {
    parentOnly(req);
    const rows = await prisma.disciplineRecord.findMany({
      where: scope(req),
      orderBy: { incidentDate: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true, incidentDate: true, category: true, description: true, actionTaken: true, status: true,
        reportedBy: STAFF_SELECT,
      },
    });
    const data = rows.map(({ reportedBy, ...r }) => ({
      ...r,
      reportedBy: staffName(reportedBy),
      reportedByDesignation: reportedBy?.designation ?? null,
    }));
    return sendSuccess(res, data, 'Discipline records retrieved');
  } catch (err) {
    next(err);
  }
};

const getHealthRecords = async (req, res, next) => {
  try {
    parentOnly(req);
    const rows = await prisma.healthRecord.findMany({
      where: scope(req),
      orderBy: { visitDate: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true, visitDate: true, symptoms: true, diagnosis: true, actionTaken: true,
        referredToHospital: true, parentNotified: true,
        recordedBy: STAFF_SELECT,
      },
    });
    const data = rows.map(({ recordedBy, ...r }) => ({ ...r, recordedBy: staffName(recordedBy) }));
    return sendSuccess(res, data, 'Health records retrieved');
  } catch (err) {
    next(err);
  }
};

const getPtmNotes = async (req, res, next) => {
  try {
    parentOnly(req);
    const rows = await prisma.parentMeetingNote.findMany({
      where: scope(req),
      orderBy: { meetingDate: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true, meetingDate: true, parentName: true, discussionNotes: true,
        staff: STAFF_SELECT,
      },
    });
    const data = rows.map(({ staff, ...r }) => ({
      ...r,
      teacher: staffName(staff),
      teacherDesignation: staff?.designation ?? null,
    }));
    return sendSuccess(res, data, 'Meeting notes retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDisciplineRecords, getHealthRecords, getPtmNotes };
