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
  prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError, ConflictError, logger, findList } = require('../../../shared');

// amount + decision rules shared with the student's application and the class teacher's
// approval (shared/fees/concession.js)
const {
  round2, schemeAmount, dueAfter, loadAssignment, decideConcession, studentInitiatedIds,
} = require('../../../shared/fees/concession');
const { recomputeItems } = require('../../../shared/fees/feeItems');

const SCHEME_TYPES = ['SCHOLARSHIP', 'CONCESSION', 'WAIVER'];
const VALUE_TYPES = ['PERCENT', 'FIXED'];

const audit = (institutionId, userId, action, entityId, details) =>
  prisma.auditLog
    .create({
      data: { institutionId, userId, action, module: 'FEES', entity: 'ConcessionApplication', entityId, newValues: JSON.stringify(details) },
    })
    .catch((err) => logger.warn('[Concession] audit log write failed', { error: err.message }));


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
    const { rows: applications, meta: listMeta } = await findList(prisma.concessionApplication, {
      where: { institutionId: req.institutionId, ...(status && { status }), ...(studentId && { studentId }) },
      include: {
        scheme: { select: { name: true, code: true, type: true, valueType: true, value: true } },
        student: {
          select: {
            firstName: true, lastName: true, rollNumber: true, admissionNumber: true,
            section: { select: { name: true, classTeacherId: true, classTeacher: { select: { firstName: true, lastName: true } } } },
          },
        },
        feeAssignment: { select: { totalAmount: true, discountAmount: true, paidAmount: true, dueAmount: true, feeStructure: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }, req);

    // Who decides each row: a student's own application → their class teacher (the admin
    // is informed, read-only) unless the class has no class teacher; office requests → admin.
    const fromStudent = await studentInitiatedIds(applications);
    const rows = applications.map((a) => {
      const teacher = a.student?.section?.classTeacher;
      const byClassTeacher = fromStudent.has(a.id) && !!a.student?.section?.classTeacherId;
      return {
        ...a,
        appliedByStudent: fromStudent.has(a.id),
        decidedBy: byClassTeacher ? 'CLASS_TEACHER' : 'ADMIN',
        classTeacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : null,
        canReview: !byClassTeacher,
      };
    });
    return sendSuccess(res, rows, 'Concession applications retrieved', 200, listMeta);
  } catch (err) {
    next(err);
  }
};

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
    const application = await prisma.concessionApplication.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      select: { id: true, requestedById: true, student: { select: { section: { select: { classTeacherId: true } } } } },
    });
    if (!application) throw new NotFoundError('Concession application not found');

    // A student's own application is decided by their class teacher (Staff portal); the
    // admin only sees it — except when the class has no class teacher to decide it.
    const fromStudent = (await studentInitiatedIds([application])).has(application.id);
    if (fromStudent && application.student?.section?.classTeacherId) {
      throw new BusinessRuleError("This application was made by the student — their class teacher approves it in the Staff portal. You can follow its status here.");
    }

    const updated = await decideConcession({
      applicationId: application.id,
      institutionId: req.institutionId,
      reviewerId: req.user.id,
      decision,
      remarks,
      decidedBy: 'the fee office',
    });
    return sendSuccess(res, updated, decision === 'APPROVE' ? 'Concession approved and applied to the fee' : 'Concession rejected');
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
      // give the revoked discount back to the per-head breakdown too
      await recomputeItems(tx, assignment.id);
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
