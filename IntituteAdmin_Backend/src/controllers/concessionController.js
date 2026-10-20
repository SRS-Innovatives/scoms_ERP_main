/**
 * Fee concession & scholarship workflow.
 *
 * ConcessionScheme is the reusable rule (percent or fixed amount). A ConcessionApplication
 * ties a scheme to one StudentFeeAssignment; it only touches money once approved by someone
 * other than the requester, when its amount is added to the assignment's discountAmount and
 * dueAmount/status are recomputed exactly like applyScholarship does. Revoking reverses it.
 * The legacy direct "apply scholarship" endpoint is untouched.
 */
const {
  prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError, ConflictError, logger,
} = require('../../../shared');

const SCHEME_TYPES = ['SCHOLARSHIP', 'CONCESSION', 'WAIVER'];
const VALUE_TYPES = ['PERCENT', 'FIXED'];
const round2 = (n) => Math.round(n * 100) / 100;

const audit = (institutionId, userId, action, entityId, details) =>
  prisma.auditLog
    .create({
      data: { institutionId, userId, action, module: 'FEES', entity: 'ConcessionApplication', entityId, newValues: JSON.stringify(details) },
    })
    .catch((err) => logger.warn('[Concession] audit log write failed', { error: err.message }));

const dueAfter = (assignment, discount) => {
  const dueAmount = Math.max(0, round2(assignment.totalAmount - discount - assignment.paidAmount));
  const status = dueAmount <= 0 ? 'PAID' : assignment.paidAmount > 0 ? 'PARTIAL' : 'PENDING';
  return { dueAmount, status };
};

const schemeAmount = (scheme, assignment) => {
  const raw = scheme.valueType === 'PERCENT' ? (assignment.totalAmount * scheme.value) / 100 : scheme.value;
  const capped = scheme.maxAmount ? Math.min(raw, scheme.maxAmount) : raw;
  return round2(Math.min(capped, assignment.totalAmount));
};

const parseScheme = (body, partial = false) => {
  const data = {};
  if (!partial || body.code !== undefined) {
    if (!String(body.code || '').trim()) throw new ValidationError('code is required');
    data.code = String(body.code).trim().toUpperCase();
  }
  if (!partial || body.name !== undefined) {
    if (!String(body.name || '').trim()) throw new ValidationError('name is required');
    data.name = String(body.name).trim();
  }
  if (body.type !== undefined) {
    if (!SCHEME_TYPES.includes(body.type)) throw new ValidationError(`type must be one of ${SCHEME_TYPES.join(', ')}`);
    data.type = body.type;
  }
  if (body.valueType !== undefined) {
    if (!VALUE_TYPES.includes(body.valueType)) throw new ValidationError(`valueType must be one of ${VALUE_TYPES.join(', ')}`);
    data.valueType = body.valueType;
  }
  if (!partial || body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) throw new ValidationError('value must be a positive number');
    data.value = value;
  }
  if (body.maxAmount !== undefined) {
    data.maxAmount = body.maxAmount === null || body.maxAmount === '' ? null : Number(body.maxAmount);
    if (data.maxAmount !== null && !(Number.isFinite(data.maxAmount) && data.maxAmount > 0)) throw new ValidationError('maxAmount must be a positive number');
  }
  if (body.description !== undefined) data.description = body.description || null;
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';
  return data;
};

const assertPercent = (valueType, value) => {
  if (valueType === 'PERCENT' && value > 100) throw new ValidationError('A percentage scheme cannot exceed 100%');
};

// ---------------- Schemes ----------------

const getSchemes = async (req, res, next) => {
  try {
    const schemes = await prisma.concessionScheme.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { applications: true } } },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, schemes, 'Concession schemes retrieved');
  } catch (err) {
    next(err);
  }
};

const createScheme = async (req, res, next) => {
  try {
    const data = parseScheme(req.body);
    assertPercent(data.valueType || 'PERCENT', data.value);
    const dup = await prisma.concessionScheme.findFirst({ where: { institutionId: req.institutionId, code: data.code } });
    if (dup) throw new ConflictError(`A scheme with code ${data.code} already exists`);
    const scheme = await prisma.concessionScheme.create({ data: { ...data, institutionId: req.institutionId } });
    return sendSuccess(res, scheme, 'Concession scheme created', 201);
  } catch (err) {
    next(err);
  }
};

const updateScheme = async (req, res, next) => {
  try {
    const existing = await prisma.concessionScheme.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Concession scheme not found');
    const data = parseScheme(req.body, true);
    assertPercent(data.valueType || existing.valueType, data.value ?? existing.value);
    if (data.code && data.code !== existing.code) {
      const dup = await prisma.concessionScheme.findFirst({ where: { institutionId: req.institutionId, code: data.code } });
      if (dup) throw new ConflictError(`A scheme with code ${data.code} already exists`);
    }
    const scheme = await prisma.concessionScheme.update({ where: { id: existing.id }, data });
    return sendSuccess(res, scheme, 'Concession scheme updated');
  } catch (err) {
    next(err);
  }
};

const deleteScheme = async (req, res, next) => {
  try {
    const existing = await prisma.concessionScheme.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      include: { _count: { select: { applications: true } } },
    });
    if (!existing) throw new NotFoundError('Concession scheme not found');
    if (existing._count.applications > 0) throw new BusinessRuleError('This scheme has applications on record — deactivate it instead of deleting');
    await prisma.concessionScheme.delete({ where: { id: existing.id } });
    return sendSuccess(res, null, 'Concession scheme deleted');
  } catch (err) {
    next(err);
  }
};

// ---------------- Applications ----------------

const getApplications = async (req, res, next) => {
  try {
    const { status, studentId } = req.query;
    const applications = await prisma.concessionApplication.findMany({
      where: { institutionId: req.institutionId, ...(status && { status }), ...(studentId && { studentId }) },
      include: {
        scheme: { select: { name: true, code: true, type: true, valueType: true, value: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true, admissionNumber: true } },
        feeAssignment: { select: { totalAmount: true, discountAmount: true, paidAmount: true, dueAmount: true, feeStructure: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, applications, 'Concession applications retrieved');
  } catch (err) {
    next(err);
  }
};

const loadAssignment = (id, institutionId, db = prisma) =>
  db.studentFeeAssignment.findFirst({ where: { id, feeStructure: { institutionId } } });

const createApplication = async (req, res, next) => {
  try {
    const { schemeId, feeAssignmentId, reason, referenceNo, amount } = req.body;
    if (!String(reason || '').trim()) throw new ValidationError('A reason is required');

    const scheme = await prisma.concessionScheme.findFirst({ where: { id: schemeId, institutionId: req.institutionId } });
    if (!scheme) throw new NotFoundError('Concession scheme not found');
    if (!scheme.isActive) throw new BusinessRuleError('This scheme is inactive');

    const assignment = await loadAssignment(feeAssignmentId, req.institutionId);
    if (!assignment) throw new NotFoundError('Fee assignment not found');

    const pendingSame = await prisma.concessionApplication.findFirst({
      where: { feeAssignmentId, schemeId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (pendingSame) throw new ConflictError(`This scheme is already ${pendingSame.status.toLowerCase()} for this fee assignment`);

    const maxForScheme = schemeAmount(scheme, assignment);
    const finalAmount = amount === undefined || amount === null || amount === '' ? maxForScheme : round2(Number(amount));
    if (!(finalAmount > 0)) throw new ValidationError('Concession amount must be greater than zero');
    if (finalAmount > maxForScheme) throw new ValidationError(`Amount exceeds what this scheme allows (₹${maxForScheme})`);
    const headroom = round2(assignment.totalAmount - assignment.discountAmount);
    if (finalAmount > headroom) throw new BusinessRuleError(`Only ₹${headroom} of this fee is left to concede`);

    const application = await prisma.concessionApplication.create({
      data: {
        institutionId: req.institutionId,
        schemeId,
        studentId: assignment.studentId,
        feeAssignmentId,
        requestedById: req.user.id,
        amount: finalAmount,
        reason: String(reason).trim(),
        referenceNo: referenceNo || null,
      },
    });
    await audit(req.institutionId, req.user.id, 'CONCESSION_REQUESTED', application.id, { schemeId, feeAssignmentId, amount: finalAmount });
    return sendSuccess(res, application, 'Concession request submitted for approval', 201);
  } catch (err) {
    next(err);
  }
};

const reviewApplication = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new ValidationError('decision must be APPROVE or REJECT');
    const application = await prisma.concessionApplication.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      include: { scheme: true },
    });
    if (!application) throw new NotFoundError('Concession application not found');
    if (application.status !== 'PENDING') throw new BusinessRuleError(`This application was already ${application.status.toLowerCase()}`);
    if (application.requestedById === req.user.id) throw new BusinessRuleError('A concession must be approved by someone other than the requester');
    if (decision === 'REJECT' && !String(remarks || '').trim()) throw new ValidationError('A reason is required when rejecting');

    const reviewed = { reviewedById: req.user.id, reviewedAt: new Date(), reviewRemarks: remarks ? String(remarks).trim() : null };

    if (decision === 'REJECT') {
      const updated = await prisma.concessionApplication.update({ where: { id: application.id }, data: { status: 'REJECTED', ...reviewed } });
      await audit(req.institutionId, req.user.id, 'CONCESSION_REJECTED', application.id, { remarks: reviewed.reviewRemarks });
      return sendSuccess(res, updated, 'Concession rejected');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await loadAssignment(application.feeAssignmentId, req.institutionId, tx);
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
      return tx.concessionApplication.update({ where: { id: application.id }, data: { status: 'APPROVED', ...reviewed } });
    });
    await audit(req.institutionId, req.user.id, 'CONCESSION_APPROVED', application.id, { amount: application.amount, feeAssignmentId: application.feeAssignmentId });
    return sendSuccess(res, updated, 'Concession approved and applied to the fee');
  } catch (err) {
    next(err);
  }
};

const revokeApplication = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    if (!String(remarks || '').trim()) throw new ValidationError('A reason is required to revoke a concession');
    const application = await prisma.concessionApplication.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      include: { scheme: true },
    });
    if (!application) throw new NotFoundError('Concession application not found');
    if (application.status !== 'APPROVED') throw new BusinessRuleError('Only an approved concession can be revoked');

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await loadAssignment(application.feeAssignmentId, req.institutionId, tx);
      const newDiscount = Math.max(0, round2(assignment.discountAmount - application.amount));
      const stillApproved = await tx.concessionApplication.findMany({
        where: { feeAssignmentId: assignment.id, status: 'APPROVED', id: { not: application.id } },
        include: { scheme: { select: { name: true } } },
      });
      const names = new Set((assignment.scholarshipName || '').split(',').map((n) => n.trim()).filter(Boolean));
      if (!stillApproved.some((a) => a.scheme.name === application.scheme.name)) names.delete(application.scheme.name);
      const refs = new Set((assignment.scholarshipRef || '').split(',').map((n) => n.trim()).filter(Boolean));
      if (application.referenceNo && !stillApproved.some((a) => a.referenceNo === application.referenceNo)) refs.delete(application.referenceNo);
      await tx.studentFeeAssignment.update({
        where: { id: assignment.id },
        data: {
          discountAmount: newDiscount,
          ...dueAfter(assignment, newDiscount),
          scholarshipName: names.size ? [...names].join(', ') : null,
          scholarshipRef: refs.size ? [...refs].join(', ') : null,
        },
      });
      return tx.concessionApplication.update({
        where: { id: application.id },
        data: { status: 'REVOKED', reviewedById: req.user.id, reviewedAt: new Date(), reviewRemarks: String(remarks).trim() },
      });
    });
    await audit(req.institutionId, req.user.id, 'CONCESSION_REVOKED', application.id, { amount: application.amount, remarks });
    return sendSuccess(res, updated, 'Concession revoked');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchemes,
  createScheme,
  updateScheme,
  deleteScheme,
  getApplications,
  createApplication,
  reviewApplication,
  revokeApplication,
};
