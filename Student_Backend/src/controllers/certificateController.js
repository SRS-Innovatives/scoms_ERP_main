/**
 * Student — Issued Certificates & Documents Controller (read-only)
 *
 * Certificates are issued by the Institute Admin (bonafide, TC, conduct, completion,
 * fee-paid, etc.) — a student can only view what has actually been issued to them.
 */
const { prisma, sendSuccess, ValidationError, certificateEngine } = require('../../../shared');

/** Certificate types this student's institution has enabled — drives the request form. */
const getRequestableTypes = async (req, res, next) => {
  try {
    const types = await certificateEngine.getRequestableCertificateTypes(req.institutionId);
    return sendSuccess(res, types, 'Requestable certificate types retrieved');
  } catch (err) {
    next(err);
  }
};

const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, certificates, 'Certificates retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getMyCertificateRequests = async (req, res, next) => {
  try {
    const requests = await prisma.certificateRequest.findMany({
      where: { studentId: req.user.studentId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, requests, 'Certificate requests retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const requestCertificate = async (req, res, next) => {
  try {
    const { type, reason } = req.body;
    // Only types the institution has actually enabled (a disabled template can't be issued)
    const allowed = (await certificateEngine.getRequestableCertificateTypes(req.institutionId)).map((t) => t.value);
    if (!type || !allowed.includes(type)) {
      throw new ValidationError(allowed.length ? `type must be one of ${allowed.join(', ')}` : 'Certificate requests are not available for your institution');
    }

    const request = await prisma.certificateRequest.create({
      data: { studentId: req.user.studentId, type, reason },
    });

    return sendSuccess(res, request, 'Certificate request submitted to Admin office', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyCertificates, getMyCertificateRequests, requestCertificate, getRequestableTypes };
