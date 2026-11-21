/**
 * Staff — My Documents (Profile → Documents Upload)
 *
 * A staff member's own documents: ID / address proof, degree certificates, experience letters,
 * bank proof, a photo... Stored as a base64 data URI (the same convention as StudentDocument —
 * no external file storage is wired up), and never returned inside a list: each row carries a
 * signed link (/api/v1/media/staffdoc/:id) that serves the real file, cached.
 *
 * Only ever the signed-in staff member's own documents — there is no staffId parameter.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');
const { attachFileLinks } = require('../../../shared/media/mediaUrl');

const DOCUMENT_TYPES = ['ID_PROOF', 'ADDRESS_PROOF', 'EDUCATION', 'EXPERIENCE', 'BANK', 'PHOTO', 'OTHER'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // decoded; keeps the base64 body under the 8mb JSON limit
const MAX_DOCUMENTS = 30;
// PDF, images, Word — what HR offices actually exchange
const ALLOWED = /^data:(application\/pdf|image\/(png|jpe?g|webp)|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,/i;

const LIST_SELECT = { id: true, documentType: true, title: true, fileName: true, mimeType: true, fileSize: true, uploadedAt: true };

const requireStaff = (req) => {
  if (!req.user?.staffId) throw new BusinessRuleError('Only staff accounts have staff documents');
  return req.user.staffId;
};

const listMyDocuments = async (req, res, next) => {
  try {
    const staffId = requireStaff(req);
    const documents = await prisma.staffDocument.findMany({
      where: { staffId, institutionId: req.institutionId },
      select: LIST_SELECT,
      orderBy: { uploadedAt: 'desc' },
    });
    await attachFileLinks(prisma, req, 'staffdoc', documents, 'fileUrl');
    return sendSuccess(res, documents, 'Documents retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const uploadMyDocument = async (req, res, next) => {
  try {
    const staffId = requireStaff(req);
    const { documentType = 'OTHER', title, fileData, fileName } = req.body || {};
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) throw new ValidationError('title is required');
    if (cleanTitle.length > 150) throw new ValidationError('title is too long (max 150 characters)');
    if (!DOCUMENT_TYPES.includes(documentType)) throw new ValidationError(`documentType must be one of ${DOCUMENT_TYPES.join(', ')}`);
    const match = typeof fileData === 'string' && fileData.match(ALLOWED);
    if (!match) throw new ValidationError('Please upload a PDF, image (PNG / JPG / WEBP) or Word document');
    const b64 = fileData.slice(match[0].length);
    const fileSize = Math.floor(b64.length * 3 / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
    if (fileSize > MAX_FILE_BYTES) throw new ValidationError('File is too large — please use a document under 5 MB');

    const count = await prisma.staffDocument.count({ where: { staffId } });
    if (count >= MAX_DOCUMENTS) throw new BusinessRuleError(`You can keep up to ${MAX_DOCUMENTS} documents — delete an old one first`);

    const document = await prisma.staffDocument.create({
      data: {
        institutionId: req.institutionId,
        staffId,
        documentType,
        title: cleanTitle,
        fileData,
        fileName: fileName ? String(fileName).slice(0, 200) : null,
        mimeType: match[1].toLowerCase(),
        fileSize,
      },
      select: LIST_SELECT,
    });
    await attachFileLinks(prisma, req, 'staffdoc', [document], 'fileUrl');
    return sendSuccess(res, document, 'Document uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteMyDocument = async (req, res, next) => {
  try {
    const staffId = requireStaff(req);
    const { count } = await prisma.staffDocument.deleteMany({ where: { id: req.params.id, staffId, institutionId: req.institutionId } });
    if (count === 0) throw new NotFoundError('Document not found');
    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { listMyDocuments, uploadMyDocument, deleteMyDocument, DOCUMENT_TYPES };
