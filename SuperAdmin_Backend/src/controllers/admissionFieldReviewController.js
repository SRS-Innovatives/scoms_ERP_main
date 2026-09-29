/**
 * SuperAdmin — Custom Field Review (Admission form, Staff Profile, ...)
 *
 * Every institution-defined extra field (see AdmissionCustomField — entityType picks
 * which form it belongs to) has to pass through here before it can render on any real
 * form. This controller only ever touches fields already in PENDING_APPROVAL — an
 * institution's DRAFT edits are its own business until it explicitly submits them.
 * Deliberately entityType-agnostic: the same queue and the same approve/reject actions
 * serve every form that opts into custom fields, so this file never needs to change
 * again when a new entity type is added.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

/** The review queue — every field across every institution currently awaiting a
 * decision, newest submission first. */
const getPendingFields = async (req, res, next) => {
  try {
    const fields = await prisma.admissionCustomField.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: { institution: { select: { id: true, name: true, code: true } } },
      orderBy: { submittedAt: 'asc' },
    });
    return sendSuccess(res, fields, 'Pending fields retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Full picture for one institution — every field regardless of status, so SuperAdmin
 * can see what's already live alongside what's newly requested. */
const getFieldsForInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const fields = await prisma.admissionCustomField.findMany({
      where: { institutionId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return sendSuccess(res, fields, 'Institution fields retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const approveField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.admissionCustomField.findUnique({ where: { id }, include: { institution: { select: { name: true } } } });
    if (!existing) throw new NotFoundError('Field not found');
    if (existing.status !== 'PENDING_APPROVAL') throw new ValidationError('Only a field awaiting approval can be approved');

    const field = await prisma.admissionCustomField.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: req.user.id, reviewedAt: new Date(), rejectionReason: null },
    });
    const FORM_LABELS = { STAFF_PROFILE: 'Staff Registration form', TRANSPORT_ENROLLMENT: 'Transport Enrollment form', HOSTEL_ALLOCATION: 'Hostel Allocation form', FEE_ASSIGNMENT: 'Fee Assignment form', LIBRARY_MEMBERSHIP: 'Library Membership form', ADMISSION: 'admission form' };
    const formLabel = FORM_LABELS[field.entityType] || 'admission form';
    return sendSuccess(res, field, `"${field.label}" approved — it is now live on ${existing.institution.name}'s ${formLabel}`);
  } catch (err) {
    next(err);
  }
};

const rejectField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ValidationError('A rejection reason is required so the institution knows what to fix');

    const existing = await prisma.admissionCustomField.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Field not found');
    if (existing.status !== 'PENDING_APPROVAL') throw new ValidationError('Only a field awaiting approval can be rejected');

    const field = await prisma.admissionCustomField.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: req.user.id, reviewedAt: new Date(), rejectionReason: reason },
    });
    return sendSuccess(res, field, `"${field.label}" rejected`);
  } catch (err) {
    next(err);
  }
};

/** Bulk decision — approve or reject several queued fields at once with one shared
 * reason (used for "approve all from this institution" / "reject all"). */
const bulkReview = async (req, res, next) => {
  try {
    const { fieldIds, decision, reason } = req.body;
    if (!Array.isArray(fieldIds) || fieldIds.length === 0) throw new ValidationError('fieldIds must be a non-empty array');
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new ValidationError('decision must be APPROVED or REJECTED');
    if (decision === 'REJECTED' && !reason) throw new ValidationError('A rejection reason is required');

    const result = await prisma.admissionCustomField.updateMany({
      where: { id: { in: fieldIds }, status: 'PENDING_APPROVAL' },
      data: {
        status: decision,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: decision === 'REJECTED' ? reason : null,
      },
    });
    return sendSuccess(res, { updated: result.count }, `${result.count} field(s) ${decision === 'APPROVED' ? 'approved' : 'rejected'}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPendingFields, getFieldsForInstitution, approveField, rejectField, bulkReview };
