/**
 * Staff Timetable Controller — this staff member's own schedule, plus substitute (cover)
 * requests: raise/cancel your own, see classes you cover, and (HOD and above) review.
 */
const { prisma, sendSuccess, NotFoundError, timetableRules } = require('../../../shared');

const getMyTimetable = async (req, res, next) => {
  try {
    const entries = await prisma.timetableEntry.findMany({
      where: { staffId: req.user.staffId, timetable: { institutionId: req.institutionId } },
      include: {
        subject: { select: { name: true, code: true } },
        timetable: { select: { section: { select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } } } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    });

    return sendSuccess(res, entries, 'Timetable retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createSubstituteRequest = async (req, res, next) => {
  try {
    const { timetableEntryId, date, reason } = req.body;
    const data = await timetableRules.createSubstituteRequest({
      institutionId: req.institutionId,
      userId: req.user.id,
      staffId: req.user.staffId,
      timetableEntryId,
      date,
      reason,
    });
    return sendSuccess(res, data, 'Substitute request submitted', 201);
  } catch (err) {
    next(err);
  }
};

const getMySubstituteRequests = async (req, res, next) => {
  try {
    const data = await timetableRules.listSubstituteRequests({ institutionId: req.institutionId, originalStaffId: req.user.staffId });
    return sendSuccess(res, data, 'Substitute requests retrieved');
  } catch (err) {
    next(err);
  }
};

const getMyCoverClasses = async (req, res, next) => {
  try {
    const data = await timetableRules.listSubstituteRequests({
      institutionId: req.institutionId,
      substituteStaffId: req.user.staffId,
      status: 'APPROVED',
      from: req.query.from || new Date(),
    });
    return sendSuccess(res, data, 'Cover classes retrieved');
  } catch (err) {
    next(err);
  }
};

const cancelSubstituteRequest = async (req, res, next) => {
  try {
    const data = await timetableRules.cancelSubstituteRequest({
      institutionId: req.institutionId,
      userId: req.user.id,
      staffId: req.user.staffId,
      requestId: req.params.id,
    });
    return sendSuccess(res, data, 'Substitute request cancelled');
  } catch (err) {
    next(err);
  }
};

/** HODs only see requests from their own department; Principal/VP see all. */
const reviewerDepartment = async (req) => {
  if (req.user.role !== 'HOD') return undefined;
  const me = await prisma.staff.findUnique({ where: { id: req.user.staffId }, select: { departmentId: true } });
  return me?.departmentId || '__none__';
};

const getPendingSubstituteRequests = async (req, res, next) => {
  try {
    const data = await timetableRules.listSubstituteRequests({
      institutionId: req.institutionId,
      status: req.query.status || 'PENDING',
      departmentId: await reviewerDepartment(req),
    });
    return sendSuccess(res, data, 'Substitute requests retrieved');
  } catch (err) {
    next(err);
  }
};

const assertInScope = async (req) => {
  const departmentId = await reviewerDepartment(req);
  if (!departmentId) return;
  const ok = await prisma.substituteRequest.count({ where: { id: req.params.id, institutionId: req.institutionId, originalStaff: { departmentId } } });
  if (!ok) throw new NotFoundError('Substitute request not found');
};

const getAvailableSubstitutes = async (req, res, next) => {
  try {
    await assertInScope(req);
    const data = await timetableRules.findAvailableSubstitutes({ institutionId: req.institutionId, requestId: req.params.id });
    return sendSuccess(res, data, 'Available teachers retrieved');
  } catch (err) {
    next(err);
  }
};

const reviewSubstituteRequest = async (req, res, next) => {
  try {
    await assertInScope(req);
    const { decision, substituteStaffId, remarks } = req.body;
    const data = await timetableRules.reviewSubstituteRequest({
      institutionId: req.institutionId,
      userId: req.user.id,
      requestId: req.params.id,
      decision,
      substituteStaffId,
      remarks,
    });
    return sendSuccess(res, data, `Substitute request ${data.status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTimetable,
  createSubstituteRequest,
  getMySubstituteRequests,
  getMyCoverClasses,
  cancelSubstituteRequest,
  getPendingSubstituteRequests,
  getAvailableSubstitutes,
  reviewSubstituteRequest,
};
