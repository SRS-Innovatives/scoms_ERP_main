/**
 * Institute Admin — Custom Fields (Admission form, Staff Profile, ...)
 *
 * An institution can add extra fields on top of a standard form (the form's own core
 * fields stay fixed in code). These custom fields go through a real approval lifecycle:
 * DRAFT (free to edit) -> PENDING_APPROVAL (locked, waiting on SuperAdmin) -> APPROVED
 * (now live on the real form) | REJECTED. Editing an already-APPROVED field re-queues it
 * for approval — an institution can never silently change what SuperAdmin already signed
 * off on. `entityType` picks which form a field belongs to (ADMISSION, STAFF_PROFILE, ...)
 * — same lifecycle, same endpoints, just scoped per form.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'CHECKBOX'];
const ENTITY_TYPES = ['ADMISSION', 'STAFF_PROFILE'];

const toFieldKey = (label) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const resolveEntityType = (req) => {
  const entityType = req.query.entityType || req.body.entityType || 'ADMISSION';
  if (!ENTITY_TYPES.includes(entityType)) throw new ValidationError(`entityType must be one of ${ENTITY_TYPES.join(', ')}`);
  return entityType;
};

const getFields = async (req, res, next) => {
  try {
    const entityType = resolveEntityType(req);
    const fields = await prisma.admissionCustomField.findMany({
      where: { institutionId: req.institutionId, entityType },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return sendSuccess(res, fields, 'Custom fields retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Only what a live form is allowed to render — APPROVED fields for the requested
 * entity type only. */
const getApprovedFields = async (req, res, next) => {
  try {
    const entityType = resolveEntityType(req);
    const fields = await prisma.admissionCustomField.findMany({
      where: { institutionId: req.institutionId, entityType, status: 'APPROVED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, fieldKey: true, label: true, fieldType: true, section: true, options: true, required: true, order: true },
    });
    return sendSuccess(res, fields, 'Approved fields retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createField = async (req, res, next) => {
  try {
    const entityType = resolveEntityType(req);
    const { label, fieldType = 'TEXT', section, options, required, order } = req.body;
    if (!label) throw new ValidationError('label is required');
    if (!FIELD_TYPES.includes(fieldType)) throw new ValidationError(`fieldType must be one of ${FIELD_TYPES.join(', ')}`);
    if (fieldType === 'SELECT' && (!Array.isArray(options) || options.length === 0)) {
      throw new ValidationError('options (a non-empty array of choices) is required for a SELECT field');
    }

    const fieldKey = toFieldKey(label);
    if (!fieldKey) throw new ValidationError('label must contain at least one letter or number');

    const existing = await prisma.admissionCustomField.findUnique({ where: { institutionId_entityType_fieldKey: { institutionId: req.institutionId, entityType, fieldKey } } });
    if (existing) throw new ValidationError('A field with this label (or a very similar one) already exists');

    const count = await prisma.admissionCustomField.count({ where: { institutionId: req.institutionId, entityType } });
    const field = await prisma.admissionCustomField.create({
      data: {
        institutionId: req.institutionId,
        entityType,
        fieldKey,
        label,
        fieldType,
        section: section || 'Additional Information',
        options: fieldType === 'SELECT' ? options : undefined,
        required: !!required,
        order: Number.isInteger(order) ? order : count,
        status: 'DRAFT',
      },
    });
    return sendSuccess(res, field, 'Custom field created as a draft', 201);
  } catch (err) {
    next(err);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.admissionCustomField.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Custom field not found');
    if (existing.status === 'PENDING_APPROVAL') throw new ValidationError('This field is currently awaiting SuperAdmin review and cannot be edited until that review completes');

    const { label, fieldType, section, options, required, order } = req.body;
    if (fieldType && !FIELD_TYPES.includes(fieldType)) throw new ValidationError(`fieldType must be one of ${FIELD_TYPES.join(', ')}`);
    const nextType = fieldType || existing.fieldType;
    if (nextType === 'SELECT' && options !== undefined && (!Array.isArray(options) || options.length === 0)) {
      throw new ValidationError('options (a non-empty array of choices) is required for a SELECT field');
    }

    // Editing a previously-APPROVED field re-queues it — SuperAdmin must sign off on
    // the change too, so a field can never quietly drift after approval.
    const wasApproved = existing.status === 'APPROVED';

    const field = await prisma.admissionCustomField.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(fieldType !== undefined && { fieldType }),
        ...(section !== undefined && { section }),
        ...(options !== undefined && { options }),
        ...(required !== undefined && { required: !!required }),
        ...(order !== undefined && { order }),
        ...(wasApproved && { status: 'PENDING_APPROVAL', submittedAt: new Date(), reviewedById: null, reviewedAt: null, rejectionReason: null }),
      },
    });
    return sendSuccess(res, field, wasApproved ? 'Field updated and re-submitted for approval' : 'Custom field updated');
  } catch (err) {
    next(err);
  }
};

const deleteField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.admissionCustomField.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Custom field not found');
    await prisma.admissionCustomField.delete({ where: { id } });
    return sendSuccess(res, null, 'Custom field deleted');
  } catch (err) {
    next(err);
  }
};

/** Submits every DRAFT (and REJECTED, letting an institution retry after fixing
 * feedback) field of the given entity type for SuperAdmin review in one action. */
const submitForApproval = async (req, res, next) => {
  try {
    const entityType = resolveEntityType(req);
    const { fieldIds } = req.body; // optional — omit to submit every eligible draft/rejected field of this entity type
    const where = {
      institutionId: req.institutionId,
      entityType,
      status: { in: ['DRAFT', 'REJECTED'] },
      ...(Array.isArray(fieldIds) && fieldIds.length > 0 && { id: { in: fieldIds } }),
    };
    const eligible = await prisma.admissionCustomField.findMany({ where, select: { id: true } });
    if (eligible.length === 0) throw new ValidationError('No draft or rejected fields to submit');

    const result = await prisma.admissionCustomField.updateMany({
      where: { id: { in: eligible.map((f) => f.id) } },
      data: { status: 'PENDING_APPROVAL', submittedAt: new Date(), reviewedById: null, reviewedAt: null, rejectionReason: null },
    });
    return sendSuccess(res, { submitted: result.count }, `${result.count} field(s) submitted for SuperAdmin approval`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFields, getApprovedFields, createField, updateField, deleteField, submitForApproval };
