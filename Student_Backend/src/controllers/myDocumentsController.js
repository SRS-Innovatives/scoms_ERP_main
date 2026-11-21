/**
 * Student — My Documents (Campus Services → My Documents)
 *
 * The documents the institution keeps on the student's record — birth certificate, transfer
 * certificate, marksheets, ID / address proof, medical records — uploaded by the Institute Admin
 * (Students → profile → Documents, IntituteAdmin_Backend studentDocumentController). Read-only
 * here: the student (or their parent) can open / download them, never change them.
 *
 * Files are never sent inside the list: each row carries a signed link
 * (/api/v1/media/studentdoc/:id) that serves the real file, cached.
 */
const { prisma, sendSuccess } = require('../../../shared');
const { attachFileLinks } = require('../../../shared/media/mediaUrl');

const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await prisma.studentDocument.findMany({
      // only what the office marked visible — an office-only document (visibleToStudent false) never appears
      where: { studentId: req.user.studentId, institutionId: req.institutionId, visibleToStudent: true },
      select: { id: true, documentType: true, title: true, fileName: true, mimeType: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });
    await attachFileLinks(prisma, req, 'studentdoc', documents, 'fileUrl');
    return sendSuccess(res, documents, 'Documents retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyDocuments };
