/**
 * Institute Admin — Student Documents
 *
 * Real documents attached to a student's record (birth certificate, TC from a previous
 * school, ID proof, ...). Stored as a base64 data URI — same convention as
 * GalleryPhoto.imageData/Institution.logo, since no external file storage is wired up
 * in this codebase yet (STORAGE_* env vars are placeholders). Unlike a gallery photo,
 * a document can be a PDF, not just an image, so the data-URI prefix check is broader.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const DOCUMENT_TYPES = ['BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'MARKSHEET', 'ID_PROOF', 'ADDRESS_PROOF', 'MEDICAL_RECORD', 'OTHER'];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // ~8MB decoded, comfortably under the JSON body limit

const validateFileData = (fileData) => {
  if (!fileData || typeof fileData !== 'string' || !/^data:(image\/|application\/pdf)/.test(fileData)) {
    throw new ValidationError('fileData must be a base64 image or PDF data URI');
  }
  const approxBytes = (fileData.length * 3) / 4;
  if (approxBytes > MAX_FILE_BYTES) throw new ValidationError('File is too large — please use a document under 8MB');
};

const getStudentDocuments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const documents = await prisma.studentDocument.findMany({
      where: { studentId, institutionId: req.institutionId },
      select: { id: true, documentType: true, title: true, fileName: true, mimeType: true, uploadedAt: true }, // fileData omitted from the list — fetched one at a time below
      orderBy: { uploadedAt: 'desc' },
    });
    return sendSuccess(res, documents, 'Student documents retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await prisma.studentDocument.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!document) throw new NotFoundError('Document not found');
    return sendSuccess(res, document, 'Document retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { documentType = 'OTHER', title, fileData, fileName, mimeType } = req.body;
    if (!title) throw new ValidationError('title is required');
    if (!DOCUMENT_TYPES.includes(documentType)) throw new ValidationError(`documentType must be one of ${DOCUMENT_TYPES.join(', ')}`);
    validateFileData(fileData);

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const document = await prisma.studentDocument.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        documentType,
        title,
        fileData,
        fileName: fileName || null,
        mimeType: mimeType || null,
        uploadedById: req.user.staffId || req.user.id || null,
      },
      select: { id: true, documentType: true, title: true, fileName: true, mimeType: true, uploadedAt: true },
    });
    return sendSuccess(res, document, 'Document uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studentDocument.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Document not found');
    await prisma.studentDocument.delete({ where: { id } });
    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStudentDocuments, getDocumentById, uploadDocument, deleteDocument };
