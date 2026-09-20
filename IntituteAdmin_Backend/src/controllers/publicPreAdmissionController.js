/**
 * Public Pre-Admission Submission Controller
 *
 * The one endpoint an institution's own external website integrates with — no SCOMS
 * login involved. Authenticated by that institution's own preAdmissionApiKey (sent as
 * either an X-Api-Key header or an apiKey field in the JSON body, so it works from a
 * plain HTML <form> POST or a JS fetch() equally easily), never by JWT.
 */
const { prisma, sendSuccess, ValidationError, AuthenticationError, NotFoundError, PaymentError, generatePreAdmissionNumber, paymentGateway } = require('../../../shared');

const resolveInstitutionByApiKey = async (req) => {
  const apiKey = req.headers['x-api-key'] || req.body?.apiKey || req.query?.apiKey;
  if (!apiKey) throw new AuthenticationError('Missing API key — send it as an X-Api-Key header or an apiKey field/query param.');
  const institution = await prisma.institution.findUnique({
    where: { preAdmissionApiKey: apiKey },
    select: { id: true, code: true, name: true, preAdmissionFeeAmount: true },
  });
  if (!institution) throw new AuthenticationError('Invalid API key.');
  return institution;
};

/** The institution's own website calls this first to know which extra fields (beyond
 * the standard ones) to render on its admission form — only ever the SuperAdmin-approved
 * ones, so nothing an institution added unilaterally can appear on a live public form.
 * Also tells it up front whether an application fee is required, and how much, so the
 * form can decide whether to render a payment step at all. */
const getFormSchema = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const fields = await prisma.admissionCustomField.findMany({
      where: { institutionId: institution.id, entityType: 'ADMISSION', status: 'APPROVED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { fieldKey: true, label: true, fieldType: true, section: true, options: true, required: true, order: true },
    });
    return sendSuccess(res, {
      institutionName: institution.name,
      customFields: fields,
      applicationFeeAmount: institution.preAdmissionFeeAmount || null,
    }, 'Form schema retrieved successfully');
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
        // Snapshotted at submission time — a later change to the institution's fee
        // amount never silently rewrites what this specific applicant already owes.
        feeAmount: institution.preAdmissionFeeAmount || null,
      },
    });

    return sendSuccess(
      res,
      {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        feeAmount: application.feeAmount,
        feePaid: application.feePaid,
      },
      application.feeAmount
        ? `Application received. Your reference number is ${application.applicationNumber}. An application fee of ₹${application.feeAmount} is due — call /pre-admission/${application.id}/fee/initiate next.`
        : `Application received. Your reference number is ${application.applicationNumber}.`,
      201
    );
  } catch (err) {
    next(err);
  }
};

/** The institution's website calls this once the applicant reaches the payment step —
 * creates a real Razorpay order for exactly this application's snapshotted fee amount.
 * Mirrors Student_Backend's own fee payment flow exactly (same shared paymentGateway). */
const initiateApplicationFeePayment = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const { id } = req.params;

    const application = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: institution.id } });
    if (!application) throw new NotFoundError('Application not found');
    if (!application.feeAmount) throw new ValidationError('This application has no fee due');
    if (application.feePaid) throw new ValidationError('This application fee has already been paid');

    const order = await paymentGateway.createOrder(application.feeAmount);
    return sendSuccess(res, order, 'Payment order created successfully');
  } catch (err) {
    next(err);
  }
};

/** Verifies the real Razorpay signature server-side — exactly the same HMAC check every
 * other payment in SCOMS uses — before ever marking the fee paid. A forged payment id
 * with no matching signature is rejected, same as it would be for a real fee payment. */
const verifyApplicationFeePayment = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const { id } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const application = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: institution.id } });
    if (!application) throw new NotFoundError('Application not found');
    if (!application.feeAmount) throw new ValidationError('This application has no fee due');
    if (application.feePaid) throw new ValidationError('This application fee has already been paid');

    const validSignature = paymentGateway.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!validSignature) {
      throw new PaymentError('Payment verification failed — signature mismatch. This payment was not confirmed by the gateway.');
    }

    const updated = await prisma.preAdmissionApplication.update({
      where: { id },
      data: { feePaid: true, feePaymentId: razorpayPaymentId, feePaidAt: new Date() },
    });

    return sendSuccess(res, { id: updated.id, feePaid: updated.feePaid }, 'Application fee payment verified successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getFormSchema, submitApplication, initiateApplicationFeePayment, verifyApplicationFeePayment };
