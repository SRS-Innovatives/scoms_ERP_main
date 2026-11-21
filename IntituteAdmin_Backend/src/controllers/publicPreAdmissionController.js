/**
 * Public Pre-Admission Submission Controller
 *
 * The one endpoint an institution's own external website integrates with — no SCOMS
 * login involved. Authenticated by that institution's own preAdmissionApiKey (sent as
 * either an X-Api-Key header or an apiKey field in the JSON body, so it works from a
 * plain HTML <form> POST or a JS fetch() equally easily), never by JWT.
 */
const net = require('net');
const { prisma, sendSuccess, ValidationError, AuthenticationError, NotFoundError, PaymentError, paymentGateway, ROLES, logger } = require('../../../shared');
const { pushNotificationToMany } = require('../../../shared/utils/notificationCenter');
const { isFeatureOn } = require('../../../shared/utils/featureFlags');
const { createApplicationWithNumber } = require('../services/preAdmissionCore');
const { checkStandardFields, checkCustomFields, throwIfErrors, CUSTOM_FIELD_SELECT } = require('../services/preAdmissionValidation');

// marks payment-order tokens minted for an application fee (shared/utils/paymentGateway.js)
const PRE_ADMISSION_KIND = 'PRE_ADMISSION';

const APPLICATIONS_LINK = '/admin/admissions/pre-admission';

/** In-app bell notification to the institution's active Institute Admins. Never blocks or
 * fails the applicant's request — a notification problem is only logged. */
const notifyAdmins = (institutionId, title, message) => {
  prisma.user.findMany({ where: { institutionId, role: ROLES.INSTITUTE_ADMIN, status: 'ACTIVE' }, select: { id: true } })
    .then((admins) => admins.length && pushNotificationToMany({
      userIds: admins.map((a) => a.id), institutionId, type: 'ADMISSION', link: APPLICATIONS_LINK, title, message,
    }))
    .catch((err) => logger.error('Pre-admission admin notification failed:', err));
};

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
      select: { fieldKey: true, label: true, fieldType: true, section: true, options: true, required: true, order: true, helpText: true, hidden: true, visibilityCondition: true },
    });
    // the field list changes rarely — let the school's site / browser reuse it for 5 minutes
    res.set('Cache-Control', 'private, max-age=300');
    return sendSuccess(res, {
      institutionName: institution.name,
      customFields: fields,
      applicationFeeAmount: institution.preAdmissionFeeAmount || null,
    }, 'Form schema retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** A custom field's value, however the website sent it: nested JSON `customFields: { key }`,
 * a form field named `customFields[key]`, or simply a field named `key`. */
const customFieldValue = (body, key) => {
  if (!body) return undefined;
  if (body.customFields && typeof body.customFields === 'object' && body.customFields[key] !== undefined) return body.customFields[key];
  if (body[`customFields[${key}]`] !== undefined) return body[`customFields[${key}]`];
  return body[key];
};

/** For a plain HTML form post: where to send the applicant back (only http/https pages). */
const formRedirectUrl = (req, which) => {
  if (!String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) return null;
  const raw = req.body?.[which];
  if (!raw) return null;
  try {
    const url = new URL(String(raw));
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
};

/** Who sent it. req.ip is the visitor's real address ('trust proxy' is set in app.js, so it is
 * read from Render's X-Forwarded-For safely — not the raw header, which anyone can fake).
 * When a school posts from its own server, req.ip is that server; it may pass the applicant's
 * address as `applicantIp`, stored as "applicant (via server)". */
const submittedFrom = (req) => {
  const ip = (req.ip || '').replace(/^::ffff:/, '') || null;
  const applicant = String(req.body?.applicantIp || '').trim();
  if (applicant && net.isIP(applicant) && applicant !== ip) return `${applicant} (via ${ip || 'unknown'})`.slice(0, 100);
  return ip;
};

const submitApplication = async (req, res, next) => {
  try {
    const result = await submitApplicationCore(req);
    const success = formRedirectUrl(req, 'successUrl');
    if (success) {
      success.searchParams.set('applicationNumber', result.data.applicationNumber);
      success.searchParams.set('applicationId', result.data.id);
      if (result.data.feeAmount && !result.data.feePaid) success.searchParams.set('feeDue', String(result.data.feeAmount));
      return res.redirect(303, success.toString());
    }
    return sendSuccess(res, result.data, result.message, result.status);
  } catch (err) {
    const failure = formRedirectUrl(req, 'errorUrl');
    if (failure) {
      failure.searchParams.set('error', err.message || 'Could not submit the application');
      return res.redirect(303, failure.toString());
    }
    next(err);
  }
};

const submitApplicationCore = async (req) => {
  {
    const institution = await resolveInstitutionByApiKey(req);

    const body = req.body || {};

    // Standard fields (phone, email, date of birth, gender, lengths) and every APPROVED custom
    // field by its type — all problems reported together. A key for an unapproved or unknown
    // field is silently dropped, not stored. services/preAdmissionValidation.js
    const standard = checkStandardFields(body);
    const approvedFields = await prisma.admissionCustomField.findMany({
      where: { institutionId: institution.id, entityType: 'ADMISSION', status: 'APPROVED' },
      select: CUSTOM_FIELD_SELECT,
    });
    const custom = checkCustomFields(approvedFields, (key) => customFieldValue(body, key));
    throwIfErrors([...standard.errors, ...custom.errors]);
    const customFields = custom.values;

    // next free number (highest used + 1, retried on a clash) — services/preAdmissionCore.js
    const { application, duplicate } = await createApplicationWithNumber({
      institutionId: institution.id,
      code: institution.code,
      data: {
        ...standard.data,
        source: 'WEBSITE',
        submittedFromIp: submittedFrom(req),
        // the full submission as received, minus the institution's API key
        rawPayload: Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => k !== 'apiKey')),
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        // Snapshotted at submission time — a later change to the institution's fee
        // amount never silently rewrites what this specific applicant already owes.
        feeAmount: institution.preAdmissionFeeAmount || null,
      },
    });

    const feeDue = application.feeAmount && !application.feePaid;
    if (!duplicate) {
      const name = [application.studentFirstName, application.studentLastName].filter(Boolean).join(' ');
      const forWhat = application.classAppliedFor || application.courseApplied;
      notifyAdmins(institution.id, 'New Website Application',
        `${name}${forWhat ? ` applied for ${forWhat}` : ' applied'} from your website — ${application.applicationNumber}.${feeDue ? ` Application fee ₹${application.feeAmount} not yet paid.` : ''}`);
    }
    return {
      // a repeat of an earlier submission → 200 with that same application, nothing new stored
      status: duplicate ? 200 : 201,
      data: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        feeAmount: application.feeAmount,
        feePaid: application.feePaid,
        duplicate,
      },
      message: `${duplicate ? 'This application was already received' : 'Application received'}. Your reference number is ${application.applicationNumber}.${feeDue ? ` An application fee of ₹${application.feeAmount} is due — call /pre-admission/${application.id}/fee/initiate next.` : ''}`,
    };
  }
};

/** The institution's website calls this once the applicant reaches the payment step —
 * creates a real Razorpay order for exactly this application's snapshotted fee amount.
 * Mirrors Student_Backend's own fee payment flow exactly (same shared paymentGateway). */
const initiateApplicationFeePayment = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    // Feature Flag "Online fee payments" (Super Admin) — no new online payments while off
    if (!(await isFeatureOn('online_payments'))) throw new PaymentError('Online payments are switched off right now. Please pay at the admission office.');
    const { id } = req.params;

    const application = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: institution.id } });
    if (!application) throw new NotFoundError('Application not found');
    if (!application.feeAmount) throw new ValidationError('This application has no fee due');
    if (application.feePaid) throw new ValidationError('This application fee has already been paid');

    const order = await paymentGateway.createOrder(application.feeAmount);
    // fixes WHICH application and HOW MUCH for this order — verify accepts only this token
    order.orderToken = paymentGateway.createOrderToken({
      orderId: order.orderId,
      studentId: null,
      assignmentId: application.id,
      amount: application.feeAmount,
      kind: PRE_ADMISSION_KIND,
    });
    order.applicationId = application.id;
    return sendSuccess(res, order, 'Payment order created successfully');
  } catch (err) {
    next(err);
  }
};

/** Marks the fee paid only when ALL of these hold:
 *  1. the orderToken from /fee/initiate is genuine, unexpired, and was made for THIS order,
 *     THIS application and THIS application's fee amount (so a ₹1 order, or another
 *     applicant's payment, can't mark it paid);
 *  2. the Razorpay signature proves the payment belongs to that order (same HMAC check as
 *     every other payment in SCOMS);
 *  3. the payment id hasn't already paid for some other application.
 * Confirming the same payment again (a retry) just returns the same answer. */
const verifyApplicationFeePayment = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const { id } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderToken } = req.body;

    const application = await prisma.preAdmissionApplication.findFirst({ where: { id, institutionId: institution.id } });
    if (!application) throw new NotFoundError('Application not found');
    if (!application.feeAmount) throw new ValidationError('This application has no fee due');
    if (application.feePaid) {
      if (razorpayPaymentId && application.feePaymentId === razorpayPaymentId) {
        return sendSuccess(res, { id: application.id, feePaid: true, duplicate: true }, 'This payment was already recorded');
      }
      throw new ValidationError('This application fee has already been paid');
    }

    const token = paymentGateway.readOrderToken(orderToken);
    if (!token || token.kind !== PRE_ADMISSION_KIND || token.orderId !== razorpayOrderId
      || token.assignmentId !== application.id || Number(token.amount) !== Number(application.feeAmount)) {
      throw new PaymentError('This payment could not be matched to the order started for this application. Please start the payment again.');
    }

    const validSignature = paymentGateway.verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!validSignature) {
      throw new PaymentError('Payment verification failed — signature mismatch. This payment was not confirmed by the gateway.');
    }

    const usedElsewhere = await prisma.preAdmissionApplication.findFirst({
      where: { feePaymentId: razorpayPaymentId, NOT: { id: application.id } }, select: { id: true },
    });
    if (usedElsewhere) throw new PaymentError('This payment has already been used for another application.');

    // only flips an UNPAID application — two confirms racing can't both "pay" it
    const { count } = await prisma.preAdmissionApplication.updateMany({
      where: { id: application.id, feePaid: false },
      data: { feePaid: true, feePaymentId: razorpayPaymentId, feePaidAt: new Date() },
    });
    if (count === 0) {
      const now = await prisma.preAdmissionApplication.findUnique({ where: { id: application.id }, select: { feePaymentId: true } });
      if (now?.feePaymentId === razorpayPaymentId) return sendSuccess(res, { id: application.id, feePaid: true, duplicate: true }, 'This payment was already recorded');
      throw new ValidationError('This application fee has already been paid');
    }

    notifyAdmins(institution.id, 'Application Fee Received',
      `₹${application.feeAmount} application fee paid online for ${application.studentFirstName}${application.studentLastName ? ` ${application.studentLastName}` : ''} — ${application.applicationNumber}.`);
    return sendSuccess(res, { id: application.id, feePaid: true, amountPaid: application.feeAmount }, 'Application fee payment verified successfully');
  } catch (err) {
    next(err);
  }
};

// what the applicant sees for each stage (internal review notes are never shown)
const STATUS_TEXT = {
  NEW: 'Application received',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  DOCUMENTS_VERIFIED: 'Documents verified',
  ENROLLED: 'Selected for admission',
  CONVERTED: 'Admitted',
  REJECTED: 'Not selected',
};

const lastTenDigits = (v) => String(v || '').replace(/\D/g, '').slice(-10);

/** "Check my application" — the parent gives the application number + the parent phone used
 * when applying, and gets back the stage and whether the fee is paid. A wrong number and a
 * wrong phone get the same answer, so the endpoint can't be used to discover applications. */
const getApplicationStatus = async (req, res, next) => {
  try {
    const institution = await resolveInstitutionByApiKey(req);
    const src = { ...(req.query || {}), ...(req.body || {}) };
    const applicationNumber = String(src.applicationNumber || '').trim();
    const phone = lastTenDigits(src.parentPhone);
    if (!applicationNumber || phone.length < 10) throw new ValidationError('applicationNumber and parentPhone are required');

    const application = await prisma.preAdmissionApplication.findFirst({
      where: { institutionId: institution.id, applicationNumber: { equals: applicationNumber, mode: 'insensitive' } },
      select: { id: true, applicationNumber: true, studentFirstName: true, studentLastName: true, classAppliedFor: true, courseApplied: true, parentPhone: true, status: true, feeAmount: true, feePaid: true, feePaidAt: true, createdAt: true, updatedAt: true },
    });
    if (!application || lastTenDigits(application.parentPhone) !== phone) {
      throw new NotFoundError('No application found with that application number and phone number.');
    }

    res.set('Cache-Control', 'no-store');
    return sendSuccess(res, {
      id: application.id,
      applicationNumber: application.applicationNumber,
      studentName: [application.studentFirstName, application.studentLastName].filter(Boolean).join(' '),
      appliedFor: application.classAppliedFor || application.courseApplied || null,
      status: application.status,
      statusText: STATUS_TEXT[application.status] || application.status,
      feeAmount: application.feeAmount,
      feePaid: application.feePaid,
      feeDue: Boolean(application.feeAmount && !application.feePaid),
      feePaidAt: application.feePaidAt,
      submittedAt: application.createdAt,
      lastUpdatedAt: application.updatedAt,
    }, 'Application status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getFormSchema, submitApplication, getApplicationStatus, initiateApplicationFeePayment, verifyApplicationFeePayment };
