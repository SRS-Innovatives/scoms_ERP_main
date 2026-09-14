/**
 * Public Pre-Admission Submission Controller
 *
 * The one endpoint an institution's own external website integrates with — no SCOMS
 * login involved. Authenticated by that institution's own preAdmissionApiKey (sent as
 * either an X-Api-Key header or an apiKey field in the JSON body, so it works from a
 * plain HTML <form> POST or a JS fetch() equally easily), never by JWT.
 */
const { prisma, sendSuccess, ValidationError, AuthenticationError, generatePreAdmissionNumber } = require('../../../shared');

const resolveInstitutionByApiKey = async (req) => {
  const apiKey = req.headers['x-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey) throw new AuthenticationError('Missing API key — send it as an X-Api-Key header or an apiKey field/query param.');
  const institution = await prisma.institution.findUnique({ where: { preAdmissionApiKey: apiKey }, select: { id: true, code: true, name: true } });
  if (!institution) throw new AuthenticationError('Invalid API key.');
  return institution;
};

/** The institution's own website calls this first to know which extra fields (beyond
 * the standard ones) to render on its admission form — only ever the SuperAdmin-approved
 * ones, so nothing an institution added unilaterally can appear on a live public form. */
const getFormSchema = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const fields = await prisma.admissionCustomField.findMany({
      where: { institutionId: institution.id, entityType: 'ADMISSION', status: 'APPROVED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { fieldKey: true, label: true, fieldType: true, section: true, options: true, required: true, order: true },
    });
    return sendSuccess(res, { institutionName: institution.name, customFields: fields }, 'Form schema retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const submitApplication = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);

    const {
      studentFirstName, studentLastName, dob, gender, classAppliedFor, courseApplied, academicYear,
      parentName, parentPhone, parentEmail, address, city, state, pincode, previousSchool, previousClass,
      referenceNumber,
    } = req.body;

    if (!studentFirstName) throw new ValidationError('studentFirstName is required');
    if (!parentPhone) throw new ValidationError('parentPhone is required');

    // Only ever accept values for fields that are actually APPROVED right now — a
    // stray/forged key in the submitted body for an unapproved or unknown field is
    // silently dropped, not stored.
    const approvedFields = await prisma.admissionCustomField.findMany({
      where: { institutionId: institution.id, entityType: 'ADMISSION', status: 'APPROVED' },
      select: { fieldKey: true, required: true, label: true },
    });
    const customFields = {};
    for (const f of approvedFields) {
      const val = req.body?.customFields?.[f.fieldKey];
      if (f.required && (val === undefined || val === null || val === '')) {
        throw new ValidationError(`${f.label} is required`);
      }
      if (val !== undefined) customFields[f.fieldKey] = val;
    }

    const count = await prisma.preAdmissionApplication.count({ where: { institutionId: institution.id } });
    const applicationNumber = generatePreAdmissionNumber(institution.code, count + 1);

    const application = await prisma.preAdmissionApplication.create({
      data: {
        institutionId: institution.id,
        applicationNumber,
        referenceNumber: referenceNumber || null,
        studentFirstName,
        studentLastName: studentLastName || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        classAppliedFor: classAppliedFor || null,
        courseApplied: courseApplied || null,
        academicYear: academicYear || null,
        parentName: parentName || null,
        parentPhone,
        parentEmail: parentEmail || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        previousSchool: previousSchool || null,
        previousClass: previousClass || null,
        source: 'WEBSITE',
        submittedFromIp: req.ip || req.headers['x-forwarded-for'] || null,
        rawPayload: req.body,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      },
    });

    return sendSuccess(
      res,
      { applicationNumber: application.applicationNumber, status: application.status },
      `Application received. Your reference number is ${application.applicationNumber}.`,
      201
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getFormSchema, submitApplication };
