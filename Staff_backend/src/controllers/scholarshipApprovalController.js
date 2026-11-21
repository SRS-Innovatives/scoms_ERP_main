/**
 * Staff — Scholarship / concession approvals by the CLASS TEACHER.
 *
 * A student's (or parent's) own scholarship application is decided by the student's
 * class teacher. Approving applies the concession to the fee straight away — the same
 * decision logic the Institute Admin uses (shared/fees/concession.js decideConcession).
 * The Institute Admin is informed and follows it read-only. Applications the Fee Office
 * raises itself are not shown here; those stay with the admin.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, AuthorizationError, teachingScope } = require('../../../shared');
const { decideConcession, studentInitiatedIds } = require('../../../shared/fees/concession');

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'];

/** GET /scholarship-approvals?status=PENDING — applications from students of my class(es). */
const getApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) throw new ValidationError(`status must be one of ${STATUSES.join(', ')}`);
    const scope = await teachingScope.getStaffScope(req.user, req.institutionId);
    if (scope.classTeacherSectionIds.length === 0) return sendSuccess(res, [], 'You are not the class teacher of any class');

    const applications = await prisma.concessionApplication.findMany({
      where: {
        institutionId: req.institutionId,
        student: { sectionId: { in: scope.classTeacherSectionIds } },
        ...(status && { status }),
      },
      include: {
        scheme: { select: { name: true, code: true, type: true, valueType: true, value: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true, section: { select: { name: true } } } },
        feeAssignment: { select: { totalAmount: true, discountAmount: true, paidAmount: true, dueAmount: true, feeStructure: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const fromStudent = await studentInitiatedIds(applications);
    return sendSuccess(res, applications.filter((a) => fromStudent.has(a.id)), 'Scholarship applications retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /scholarship-approvals/:id/review  { decision: APPROVE | REJECT, remarks } */
const reviewApplication = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;
    const application = await prisma.concessionApplication.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      select: { id: true, requestedById: true, student: { select: { sectionId: true } } },
    });
    if (!application) throw new NotFoundError('Scholarship application not found');

    const scope = await teachingScope.getStaffScope(req.user, req.institutionId);
    if (!scope.classTeacherSectionIds.includes(application.student?.sectionId)) {
      throw new AuthorizationError("Only the student's class teacher can approve or reject this application");
    }
    if (!(await studentInitiatedIds([application])).has(application.id)) {
      throw new AuthorizationError('This request was raised by the fee office — it is decided there');
    }

    const updated = await decideConcession({
      applicationId: application.id,
      institutionId: req.institutionId,
      reviewerId: req.user.id,
      decision,
      remarks,
      decidedBy: 'your class teacher',
    });
    return sendSuccess(res, updated, decision === 'APPROVE' ? 'Scholarship approved and applied to the fee' : 'Scholarship application rejected');
  } catch (err) {
    next(err);
  }
};

module.exports = { getApprovals, reviewApplication };
