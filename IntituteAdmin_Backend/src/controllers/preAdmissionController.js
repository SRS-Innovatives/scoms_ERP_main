/**
 * Institute Admin — Pre-Admission Application Management
 *
 * Real workflow: NEW → (review) → SHORTLISTED → ENROLLED (accepted, gets a formal
 * receipt) → CONVERTED (the "Admit" action actually creates the real Student record,
 * reusing the exact same admission transaction the manual/bulk admission flows use —
 * one applicant is never entered into the system twice) — or REJECTED at any point.
 */
const {
  prisma, sendSuccess, NotFoundError, ValidationError,
  generatePreAdmissionNumber, generateReceiptNumber, generateApiKey, findList } = require('../../../shared');
const { admitStudentWithinTx, sendStudentCredentials } = require('./studentController');
const { assignStructureWithinTx } = require('./feeEngineController');
const { findMatchingStructures } = require('../../../shared/fees/feeSync');
const { createApplicationWithNumber } = require('../services/preAdmissionCore');
const { checkStandardFields, checkCustomFields, throwIfErrors, CUSTOM_FIELD_SELECT } = require('../services/preAdmissionValidation');

const VALID_STATUSES = ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'DOCUMENTS_VERIFIED', 'ENROLLED', 'REJECTED', 'CONVERTED'];

/** Next free numeric roll number in a section (non-numeric roll numbers are ignored). */
const nextRollNumber = async (tx, sectionId) => {
  const rolls = await tx.student.findMany({ where: { sectionId }, select: { rollNumber: true } });
  const max = rolls.reduce((m, r) => (/^\d+$/.test(r.rollNumber || '') ? Math.max(m, Number(r.rollNumber)) : m), 0);
  return String(max + 1);
};

// PUBLISHED structures for the current academic year that apply to this student's class —
// newest version of each (shared/fees/feeSync.js)
const findMatchingFeeStructures = (tx, institutionId, courseId, sectionId) => findMatchingStructures(tx, institutionId, courseId, sectionId);

/** "Verify Documents" — records the checklist; moves the application to DOCUMENTS_VERIFIED once every item is verified. */
const verifyDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checklist, reviewNotes } = req.body;
    if (!Array.isArray(checklist) || checklist.length === 0 || checklist.some((d) => !d || !String(d.name || '').trim())) {
      throw new ValidationError('checklist must be a non-empty array of { name, verified }');
    }
    const existing = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Application not found');
    if (['CONVERTED', 'REJECTED'].includes(existing.status)) throw new ValidationError(`Documents can't be verified for a ${existing.status.toLowerCase()} application`);

    const clean = checklist.map((d) => ({ name: String(d.name).trim(), verified: d.verified === true }));
    const allVerified = clean.every((d) => d.verified);
    const promote = allVerified && ['NEW', 'UNDER_REVIEW', 'SHORTLISTED'].includes(existing.status);

    const application = await prisma.preAdmissionApplication.update({
      where: { id },
      data: {
        documentChecklist: clean,
        ...(reviewNotes !== undefined && { reviewNotes }),
        documentsVerifiedAt: allVerified ? new Date() : null,
        documentsVerifiedById: allVerified ? req.user.id : null,
        ...(promote && { status: 'DOCUMENTS_VERIFIED' }),
      },
    });
    return sendSuccess(res, application, allVerified ? 'All documents verified' : 'Document checklist saved');
  } catch (err) {
    next(err);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const { status, academicYear, search } = req.query;
    const { rows: applications, meta: listMeta } = await findList(prisma.preAdmissionApplication, {
      where: {
        institutionId: req.institutionId,
        ...(status && status !== 'ALL' && { status }),
        ...(academicYear && { academicYear }),
        ...(search && {
          OR: [
            { studentFirstName: { contains: search, mode: 'insensitive' } },
            { studentLastName: { contains: search, mode: 'insensitive' } },
            { applicationNumber: { contains: search, mode: 'insensitive' } },
            { parentPhone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { reviewedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }, req);
    return sendSuccess(res, applications, 'Applications retrieved successfully', 200, listMeta);
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await prisma.preAdmissionApplication.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { reviewedBy: { select: { firstName: true, lastName: true } } },
    });
    if (!application) throw new NotFoundError('Application not found');
    return sendSuccess(res, application, 'Application retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** "Add New" — front-office staff logging a walk-in/phone applicant manually, same
 * shape as a website submission but source: MANUAL. */
const createApplication = async (req, res, next) => {
  try {
    const body = req.body || {};
    const institution = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });

    // Same checks as the website path (services/preAdmissionValidation.js) — except that staff
    // logging a walk-in may leave required custom fields for later; values given are type-checked.
    const standard = checkStandardFields(body);
    let custom = { values: {}, errors: [] };
    if (body.customFields && typeof body.customFields === 'object') {
      const approvedFields = await prisma.admissionCustomField.findMany({
        where: { institutionId: req.institutionId, entityType: 'ADMISSION', status: 'APPROVED' }, select: CUSTOM_FIELD_SELECT,
      });
      custom = checkCustomFields(approvedFields, (key) => body.customFields[key], { enforceRequired: false });
    }
    throwIfErrors([...standard.errors, ...custom.errors]);
    const cleanCustomFields = custom.values;

    // next free number (highest used + 1, retried on a clash) — services/preAdmissionCore.js
    // same student + phone logged moments ago (a double-click), or the same reference number
    // → that application is returned, not a second copy
    const { application, duplicate } = await createApplicationWithNumber({
      institutionId: req.institutionId,
      code: institution?.code,
      data: {
        ...standard.data,
        source: 'MANUAL',
        customFields: cleanCustomFields && Object.keys(cleanCustomFields).length > 0 ? cleanCustomFields : undefined,
      },
    });
    if (duplicate) return sendSuccess(res, { ...application, duplicate: true }, `Already logged as ${application.applicationNumber}`, 200);
    return sendSuccess(res, application, 'Application logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    if (status && !VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const existing = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Application not found');
    if (existing.status === 'CONVERTED') throw new ValidationError('This application has already been admitted as a student and can no longer be changed');

    const application = await prisma.preAdmissionApplication.update({
      where: { id },
      data: {
        ...(status && { status, ...(status === 'ENROLLED' && !existing.enrolledAt && { enrolledAt: new Date() }) }),
        ...(reviewNotes !== undefined && { reviewNotes }),
        reviewedById: req.user.staffId || existing.reviewedById,
      },
    });
    return sendSuccess(res, application, 'Application updated successfully');
  } catch (err) {
    next(err);
  }
};

/** "Generate Receipt" — a real, sequential, institution-scoped receipt number, the same
 * numbering convention every other receipt in SCOMS uses. */
const generateReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Application not found');
    if (existing.receiptNumber) throw new ValidationError('A receipt has already been generated for this application');

    const institution = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { code: true } });
    const count = await prisma.preAdmissionApplication.count({ where: { institutionId: req.institutionId, receiptNumber: { not: null } } });
    const receiptNumber = generateReceiptNumber(institution?.code, count + 1);

    const application = await prisma.preAdmissionApplication.update({ where: { id }, data: { receiptNumber } });
    return sendSuccess(res, application, 'Receipt generated successfully');
  } catch (err) {
    next(err);
  }
};

/** "Admit" — the real conversion. Runs the exact same admission transaction the manual
 * and bulk admission flows use, so a pre-admission applicant becomes a real, fully
 * formed Student record (with their own real login) — never a second, parallel copy. */
const admitApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!application) throw new NotFoundError('Application not found');
    if (application.status === 'CONVERTED') throw new ValidationError('This application has already been admitted');
    if (application.status === 'REJECTED') throw new ValidationError('A rejected application cannot be admitted — change its status first if this was a mistake');

    const { email, sectionId, courseId, assignFees, autoRollNumber, sendCredentials, ...rest } = req.body;
    if (!email) throw new ValidationError('email is required to create the student\'s real login account');
    if (!sectionId) throw new ValidationError('sectionId is required — pick the real class/section to admit this student into');

    const admissionData = {
      firstName: application.studentFirstName,
      lastName: application.studentLastName || '',
      dob: application.dob,
      gender: application.gender,
      email,
      // Not `phone: application.parentPhone` — admitStudentWithinTx already creates a
      // separate real Parent account using parentPhone below; setting it here too would
      // make the student's own User row collide on that same unique mobile number.
      fatherName: application.parentName,
      parentPhone: application.parentPhone,
      parentEmail: application.parentEmail,
      address: application.address,
      city: application.city,
      state: application.state,
      pincode: application.pincode,
      previousSchoolName: application.previousSchool,
      courseId: courseId || null,
      sectionId,
      ...rest, // admin can override/fill in anything else (rollNumber, password, etc.) at admit time
      // Whatever custom field values the applicant (or admin, manually) already supplied
      // carry straight through — admitStudentWithinTx only persists them if non-empty.
      // Placed after `...rest` so it always wins over a same-named key inside rest.
      customFields: { ...(application.customFields || {}), ...(rest.customFields || {}) },
    };

    const result = await prisma.$transaction(async (tx) => {
      if (autoRollNumber === true && !admissionData.rollNumber) admissionData.rollNumber = await nextRollNumber(tx, sectionId);
      const admission = await admitStudentWithinTx(tx, req.institutionId, req.user.id, admissionData);
      const updated = await tx.preAdmissionApplication.update({
        where: { id },
        data: { status: 'CONVERTED', convertedStudentId: admission.student.id, reviewedById: req.user.staffId || null },
      });

      const feesAssigned = [];
      if (assignFees === true) {
        const structures = await findMatchingFeeStructures(tx, req.institutionId, admission.student.courseId, sectionId);
        for (const structure of structures) {
          // each head at what the fee rules give this student (quota, hostel, bus, …)
          const a = await assignStructureWithinTx(tx, structure, admission.student.id);
          if (a) feesAssigned.push({ id: structure.id, name: structure.name, totalAmount: a.totalAmount });
        }
      }
      return { ...admission, application: updated, provisioning: { rollNumber: admission.student.rollNumber, feesAssigned } };
    }, { timeout: 20000 });

    const credentialsSent = sendCredentials === true;
    if (credentialsSent) {
      sendStudentCredentials({
        institutionId: req.institutionId,
        firstName: result.student.firstName,
        lastName: result.student.lastName,
        email,
        phone: result.student.phone,
        password: rest.password,
        admissionNumber: result.student.admissionNumber,
      });
    }
    result.provisioning.credentialsSent = credentialsSent;
    if (result.user) delete result.user.password;

    return sendSuccess(res, result, `${application.studentFirstName} admitted successfully as ${result.student.admissionNumber}`, 201);
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Application not found');
    if (existing.status === 'CONVERTED') throw new ValidationError('Cannot delete an application that has already been admitted as a student');
    await prisma.preAdmissionApplication.delete({ where: { id } });
    return sendSuccess(res, null, 'Application deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Integration Settings — the API key an institution's own website uses
// ============================================================

const getApiKeySettings = async (req, res, next) => {
  try {
    const institution = await prisma.institution.findUnique({ where: { id: req.institutionId }, select: { preAdmissionApiKey: true, preAdmissionFeeAmount: true } });
    return sendSuccess(res, { apiKey: institution?.preAdmissionApiKey || null, feeAmount: institution?.preAdmissionFeeAmount || null }, 'API key settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const regenerateApiKey = async (req, res, next) => {
  try {
    const apiKey = generateApiKey();
    await prisma.institution.update({ where: { id: req.institutionId }, data: { preAdmissionApiKey: apiKey } });
    return sendSuccess(res, { apiKey }, 'A new API key was generated. The previous key is now invalid — update any live integration with this new one.');
  } catch (err) {
    next(err);
  }
};

/** Sets (or clears) the application fee every new submission must pay before it's
 * accepted. Only ever applies going forward — existing applications keep the fee amount
 * they were submitted under (see PreAdmissionApplication.feeAmount). */
const updateFeeAmount = async (req, res, next) => {
  try {
    const { feeAmount } = req.body;
    if (feeAmount !== null && feeAmount !== undefined && (isNaN(feeAmount) || Number(feeAmount) < 0)) {
      throw new ValidationError('feeAmount must be a non-negative number, or null to remove the fee');
    }
    const value = feeAmount === null || feeAmount === undefined || Number(feeAmount) === 0 ? null : Number(feeAmount);
    await prisma.institution.update({ where: { id: req.institutionId }, data: { preAdmissionFeeAmount: value } });
    return sendSuccess(res, { feeAmount: value }, value ? `Application fee set to ₹${value}` : 'Application fee removed — new applications will no longer require payment');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateStatus,
  generateReceipt,
  admitApplication,
  verifyDocuments,
  deleteApplication,
  getApiKeySettings,
  updateFeeAmount,
  regenerateApiKey,
};
