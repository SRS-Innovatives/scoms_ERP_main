/**
 * Student — Scholarship / Concession applications.
 *
 * A student (or a parent, for their selected child) applies under one of the
 * institution's active ConcessionSchemes against one of their OWN fee assignments. It
 * creates a PENDING ConcessionApplication (the same record the Fee Office creates). The
 * student's CLASS TEACHER decides it in the Staff portal (Scholarship Approvals), and
 * approval applies the discount to the fee; the Institute Admin is informed and follows
 * it read-only (or decides it when the class has no class teacher).
 *
 * The amount is never typed by the applicant: it is the scheme's value on that fee
 * (shared/fees/concession.js — same rule the admin side uses), limited to what is still
 * left to concede.
 */
const {
  prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError, ConflictError,
  pushNotificationToMany, ROLES, logger,
} = require('../../../shared');
const { schemeAmount, concessionHeadroom } = require('../../../shared/fees/concession');

/** GET /fees/concession-schemes — the institution's ACTIVE schemes a student can apply for. */
const getSchemes = async (req, res, next) => {
  try {
    const schemes = await prisma.concessionScheme.findMany({
      where: { institutionId: req.institutionId, isActive: true },
      select: { id: true, code: true, name: true, type: true, valueType: true, value: true, maxAmount: true, description: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, schemes, 'Scholarship schemes retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /fees/concessions — this student's own applications, newest first. */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.concessionApplication.findMany({
      where: { institutionId: req.institutionId, studentId: req.user.studentId },
      select: {
        id: true, amount: true, reason: true, referenceNo: true, status: true, reviewRemarks: true, reviewedAt: true, createdAt: true,
        scheme: { select: { name: true, code: true, type: true } },
        feeAssignment: { select: { totalAmount: true, feeStructure: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, applications, 'Your scholarship applications retrieved');
  } catch (err) {
    next(err);
  }
};

/** POST /fees/concessions  { schemeId, feeAssignmentId, reason, referenceNo? } */
const applyForConcession = async (req, res, next) => {
  try {
    const { schemeId, feeAssignmentId, referenceNo } = req.body;
    const reason = String(req.body.reason || '').trim();
    if (!schemeId || !feeAssignmentId) throw new ValidationError('Choose a scheme and the fee it applies to');
    if (!reason) throw new ValidationError('Please explain why you are eligible (reason is required)');
    if (reason.length > 1000) throw new ValidationError('Reason must be 1000 characters or fewer');
    const ref = referenceNo ? String(referenceNo).trim().slice(0, 100) : null;

    const scheme = await prisma.concessionScheme.findFirst({ where: { id: schemeId, institutionId: req.institutionId } });
    if (!scheme) throw new NotFoundError('Scholarship scheme not found');
    if (!scheme.isActive) throw new BusinessRuleError('This scheme is no longer open for applications');

    // Only the student's OWN fee, in this institution
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { id: feeAssignmentId, studentId: req.user.studentId, feeStructure: { institutionId: req.institutionId } },
      include: { feeStructure: { select: { name: true } } },
    });
    if (!assignment) throw new NotFoundError('Fee not found on your account');

    const existing = await prisma.concessionApplication.findFirst({
      where: { feeAssignmentId, schemeId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existing) {
      throw new ConflictError(existing.status === 'PENDING'
        ? 'You already have a pending application for this scheme on this fee'
        : 'This scheme is already applied to this fee');
    }

    const headroom = concessionHeadroom(assignment);
    if (!(headroom > 0)) throw new BusinessRuleError('This fee has no amount left that a concession could cover');
    const amount = Math.min(schemeAmount(scheme, assignment), headroom);
    if (!(amount > 0)) throw new BusinessRuleError('This scheme gives no concession on this fee');

    const application = await prisma.concessionApplication.create({
      data: {
        institutionId: req.institutionId,
        schemeId,
        studentId: req.user.studentId,
        feeAssignmentId,
        requestedById: req.user.id, // the student's (or parent's) own account — any admin may review it
        amount,
        reason,
        referenceNo: ref,
      },
    });

    prisma.auditLog.create({
      data: {
        institutionId: req.institutionId, userId: req.user.id, action: 'CONCESSION_REQUESTED', module: 'FEES',
        entity: 'ConcessionApplication', entityId: application.id,
        newValues: JSON.stringify({ schemeId, feeAssignmentId, amount, source: req.user.role }),
      },
    }).catch((err) => logger.warn('[Scholarship] audit log write failed', { error: err.message }));

    notifyFeeOffice(req.institutionId, req.user.studentId, scheme, assignment, amount).catch(() => {});

    return sendSuccess(res, application, 'Application submitted — your class teacher will review it', 201);
  } catch (err) {
    next(err);
  }
};

/** New application → the CLASS TEACHER is asked to decide it (Staff portal); every active
 * Institute Admin is informed. With no class teacher assigned, the admins decide it. */
const notifyFeeOffice = async (institutionId, studentId, scheme, assignment, amount) => {
  const [student, admins] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true, admissionNumber: true, section: { select: { classTeacher: { select: { userId: true } } } } },
    }),
    prisma.user.findMany({ where: { institutionId, role: ROLES.INSTITUTE_ADMIN, status: 'ACTIVE' }, select: { id: true } }),
  ]);
  const who = `${student?.firstName || ''} ${student?.lastName || ''} (${student?.admissionNumber || '—'})`.trim();
  const what = `${scheme.name} on ${assignment.feeStructure?.name || 'a fee'} — ₹${amount}`;
  const classTeacherUserId = student?.section?.classTeacher?.userId;

  await Promise.all([
    classTeacherUserId && pushNotificationToMany({
      userIds: [classTeacherUserId], institutionId, type: 'FEE', link: '/staff/scholarship-approvals',
      title: 'Scholarship Application to Review',
      message: `${who} applied for ${what}. As class teacher, please approve or reject it.`,
    }),
    admins.length && pushNotificationToMany({
      userIds: admins.map((a) => a.id).filter((id) => id !== classTeacherUserId), institutionId, type: 'FEE', link: '/admin/fee/scholarship',
      title: classTeacherUserId ? 'Scholarship Application (for information)' : 'Scholarship Application to Review',
      message: classTeacherUserId
        ? `${who} applied for ${what}. Their class teacher will decide it.`
        : `${who} applied for ${what}. Their class has no class teacher, so please review it.`,
    }),
  ]);
};

module.exports = { getSchemes, getMyApplications, applyForConcession };
