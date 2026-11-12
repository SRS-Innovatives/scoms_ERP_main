/**
 * Institute Admin — Official Circulars (reference number, signatory, PDF attachment).
 * Staff and Student/Parent portals read them through their own backends, filtered by
 * `audience`. The attachment is a base64 data URI (same convention as other uploads),
 * returned only by the single-circular endpoint so lists stay light.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const AUDIENCES = ['ALL', 'STAFF', 'STUDENTS', 'PARENTS'];
const ATTACHMENT_PATTERN = /^data:(application\/pdf|image\/(png|jpeg|jpg));base64,/;
const MAX_ATTACHMENT_CHARS = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 100; // ~5 MB file

const listSelect = {
  id: true, refNo: true, title: true, description: true, issuedBy: true, issueDate: true,
  audience: true, attachmentName: true, createdAt: true,
};

const validate = ({ refNo, title, issuedBy, audience, attachment, issueDate }, partial = false) => {
  if (!partial || refNo !== undefined) if (!refNo || !String(refNo).trim()) throw new ValidationError('Reference number is required');
  if (!partial || title !== undefined) if (!title || !String(title).trim()) throw new ValidationError('Title is required');
  if (!partial || issuedBy !== undefined) if (!issuedBy || !String(issuedBy).trim()) throw new ValidationError('Issued by (signatory) is required');
  if (audience !== undefined && !AUDIENCES.includes(audience)) throw new ValidationError(`Audience must be one of ${AUDIENCES.join(', ')}`);
  if (issueDate !== undefined && issueDate !== '' && Number.isNaN(new Date(issueDate).getTime())) throw new ValidationError('Issue date is not a valid date');
  if (attachment) {
    if (!ATTACHMENT_PATTERN.test(attachment)) throw new ValidationError('Attachment must be a PDF, PNG or JPEG file');
    if (attachment.length > MAX_ATTACHMENT_CHARS) throw new ValidationError('Attachment is too large — please keep it under 5 MB');
  }
};

const getCirculars = async (req, res, next) => {
  try {
    const circulars = await prisma.circular.findMany({
      where: { institutionId: req.institutionId },
      select: { ...listSelect, attachment: false },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return sendSuccess(res, circulars.map((c) => ({ ...c, hasAttachment: !!c.attachmentName })), 'Circulars retrieved');
  } catch (err) {
    next(err);
  }
};

const getCircular = async (req, res, next) => {
  try {
    const circular = await prisma.circular.findFirst({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!circular) throw new NotFoundError('Circular not found');
    return sendSuccess(res, circular, 'Circular retrieved');
  } catch (err) {
    next(err);
  }
};

const createCircular = async (req, res, next) => {
  try {
    const { refNo, title, description, issuedBy, issueDate, audience, attachment, attachmentName } = req.body;
    validate(req.body);
    const circular = await prisma.circular.create({
      data: {
        institutionId: req.institutionId,
        refNo: String(refNo).trim(),
        title: String(title).trim(),
        description: description || null,
        issuedBy: String(issuedBy).trim(),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        audience: audience || 'ALL',
        attachment: attachment || null,
        attachmentName: attachment ? (attachmentName || `${String(refNo).trim()}.pdf`) : null,
        createdById: req.user.id,
      },
      select: listSelect,
    });
    return sendSuccess(res, circular, 'Circular published', 201);
  } catch (err) {
    next(err);
  }
};

const updateCircular = async (req, res, next) => {
  try {
    const existing = await prisma.circular.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, select: { id: true } });
    if (!existing) throw new NotFoundError('Circular not found');
    validate(req.body, true);
    const { refNo, title, description, issuedBy, issueDate, audience, attachment, attachmentName, removeAttachment } = req.body;
    const circular = await prisma.circular.update({
      where: { id: existing.id },
      data: {
        ...(refNo !== undefined && { refNo: String(refNo).trim() }),
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(issuedBy !== undefined && { issuedBy: String(issuedBy).trim() }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(audience !== undefined && { audience }),
        ...(attachment && { attachment, attachmentName: attachmentName || 'circular.pdf' }),
        ...(removeAttachment && { attachment: null, attachmentName: null }),
      },
      select: listSelect,
    });
    return sendSuccess(res, circular, 'Circular updated');
  } catch (err) {
    next(err);
  }
};

const deleteCircular = async (req, res, next) => {
  try {
    const existing = await prisma.circular.findFirst({ where: { id: req.params.id, institutionId: req.institutionId }, select: { id: true } });
    if (!existing) throw new NotFoundError('Circular not found');
    await prisma.circular.delete({ where: { id: existing.id } });
    return sendSuccess(res, null, 'Circular deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCirculars, getCircular, createCircular, updateCircular, deleteCircular, AUDIENCES };
