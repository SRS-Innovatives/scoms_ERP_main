/**
 * Concession / scholarship rules — one source for the Institute Admin's concession
 * workflow, the student's own application and the class teacher's approval, so every
 * path computes amounts and applies decisions the same way.
 *
 * Who decides an application:
 *   - raised by the Fee Office (Institute Admin)      → an Institute Admin reviews it
 *   - raised by the student / parent (Student portal) → the student's CLASS TEACHER decides
 *     (Staff portal); the Institute Admin is informed and sees it read-only — unless the
 *     class has no class teacher, then the admin may decide it.
 */
const prisma = require('../database/client');
const logger = require('../utils/logger');
const { pushNotification } = require('../utils/notificationCenter');
const { ROLES } = require('../constants/roles');
const { NotFoundError, ValidationError, BusinessRuleError } = require('../errors/customErrors');
const { recomputeItems } = require('./feeItems');

const round2 = (n) => Math.round(n * 100) / 100;

/** What a scheme is worth on one fee assignment: percent of the total or a fixed amount,
 * capped by the scheme's maxAmount and never more than the fee itself. */
const schemeAmount = (scheme, assignment) => {
  const raw = scheme.valueType === 'PERCENT' ? (assignment.totalAmount * scheme.value) / 100 : scheme.value;
  const capped = scheme.maxAmount ? Math.min(raw, scheme.maxAmount) : raw;
  return round2(Math.min(capped, assignment.totalAmount));
};

/** How much of this fee can still be conceded (total minus discounts already applied). */
const concessionHeadroom = (assignment) => round2(assignment.totalAmount - assignment.discountAmount);

/** dueAmount / status of a fee assignment after its discount changes. */
const dueAfter = (assignment, discount) => {
  const dueAmount = Math.max(0, round2(assignment.totalAmount - discount - assignment.paidAmount));
  const status = dueAmount <= 0 ? 'PAID' : assignment.paidAmount > 0 ? 'PARTIAL' : 'PENDING';
  return { dueAmount, status };
};

const STUDENT_SIDE_ROLES = [ROLES.STUDENT, ROLES.PARENT];

/** ids of applications (from the list) that a student or parent raised themselves. */
const studentInitiatedIds = async (applications) => {
  const requesterIds = [...new Set(applications.map((a) => a.requestedById).filter(Boolean))];
  if (requesterIds.length === 0) return new Set();
  const users = await prisma.user.findMany({ where: { id: { in: requesterIds } }, select: { id: true, role: true } });
  const studentSide = new Set(users.filter((u) => STUDENT_SIDE_ROLES.includes(u.role)).map((u) => u.id));
  return new Set(applications.filter((a) => studentSide.has(a.requestedById)).map((a) => a.id));
};

const audit = (institutionId, userId, action, entityId, details) =>
  prisma.auditLog
    .create({
      data: { institutionId, userId, action, module: 'FEES', entity: 'ConcessionApplication', entityId, newValues: JSON.stringify(details) },
    })
    .catch((err) => logger.warn('[Concession] audit log write failed', { error: err.message }));

const loadAssignment = (id, institutionId, db = prisma) =>
  db.studentFeeAssignment.findFirst({ where: { id, feeStructure: { institutionId } } });

/**
 * Approve or reject a PENDING application. On approve its amount is added to the fee
 * assignment's discount (dueAmount/status recomputed, scheme name + reference recorded).
 * The student is notified either way. `decidedBy` is shown to the student, e.g.
 * "your class teacher" / "the fee office". Callers check WHO may decide before this.
 */
const decideConcession = async ({ applicationId, institutionId, reviewerId, decision, remarks, decidedBy }) => {
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');
  const application = await prisma.concessionApplication.findFirst({
    where: { id: applicationId, institutionId },
    include: { scheme: true },
  });
  if (!application) throw new NotFoundError('Concession application not found');
  if (application.status !== 'PENDING') throw new BusinessRuleError(`This application was already ${application.status.toLowerCase()}`);
  if (application.requestedById === reviewerId) throw new BusinessRuleError('A concession must be approved by someone other than the requester');
  if (decision === 'REJECT' && !String(remarks || '').trim()) throw new ValidationError('A reason is required when rejecting');

  const reviewed = { reviewedById: reviewerId, reviewedAt: new Date(), reviewRemarks: remarks ? String(remarks).trim() : null };
  let updated;
  if (decision === 'REJECT') {
    updated = await prisma.concessionApplication.update({ where: { id: application.id }, data: { status: 'REJECTED', ...reviewed } });
    await audit(institutionId, reviewerId, 'CONCESSION_REJECTED', application.id, { remarks: reviewed.reviewRemarks, decidedBy });
  } else {
    updated = await prisma.$transaction(async (tx) => {
      const assignment = await loadAssignment(application.feeAssignmentId, institutionId, tx);
      if (!assignment) throw new NotFoundError('Fee assignment not found');
      const newDiscount = round2(assignment.discountAmount + application.amount);
      if (newDiscount > assignment.totalAmount) {
        throw new BusinessRuleError(`Approving would concede more than the total fee (only ₹${round2(assignment.totalAmount - assignment.discountAmount)} left)`);
      }
      const names = new Set((assignment.scholarshipName || '').split(',').map((n) => n.trim()).filter(Boolean));
      names.add(application.scheme.name);
      const refs = new Set((assignment.scholarshipRef || '').split(',').map((n) => n.trim()).filter(Boolean));
      if (application.referenceNo) refs.add(application.referenceNo);
      await tx.studentFeeAssignment.update({
        where: { id: assignment.id },
        data: {
          discountAmount: newDiscount,
          ...dueAfter(assignment, newDiscount),
          scholarshipName: [...names].join(', '),
          scholarshipRef: refs.size ? [...refs].join(', ') : null,
        },
      });
      // reflect the new discount on the per-head breakdown too (shared/fees/feeItems.js)
      await recomputeItems(tx, assignment.id);
      return tx.concessionApplication.update({ where: { id: application.id }, data: { status: 'APPROVED', ...reviewed } });
    });
    await audit(institutionId, reviewerId, 'CONCESSION_APPROVED', application.id, { amount: application.amount, feeAssignmentId: application.feeAssignmentId, decidedBy });
  }

  // Tell the student (best-effort — never blocks or fails the decision)
  prisma.student.findUnique({ where: { id: application.studentId }, select: { userId: true } })
    .then((s) => pushNotification({
      userId: s?.userId,
      institutionId,
      title: decision === 'APPROVE' ? 'Scholarship Approved' : 'Scholarship Not Approved',
      message: decision === 'APPROVE'
        ? `Your ${application.scheme.name} application was approved by ${decidedBy} — ₹${application.amount} has been applied to your fee.`
        : `Your ${application.scheme.name} application was not approved by ${decidedBy}${reviewed.reviewRemarks ? `: ${reviewed.reviewRemarks}` : '.'}`,
      type: 'FEE',
      link: '/student/scholarships',
    }))
    .catch(() => {});

  return updated;
};

module.exports = {
  round2, schemeAmount, concessionHeadroom, dueAfter, studentInitiatedIds, loadAssignment, decideConcession, STUDENT_SIDE_ROLES,
};
