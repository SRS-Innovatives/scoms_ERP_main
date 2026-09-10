/**
 * Textbook Content Controller — the real material the AI Study Tutor grounds its answers
 * in. Upload once per class+subject+language; the Student portal's AI Tutor looks these
 * rows up live at question time (RAG), never "trains" anything.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const LANGUAGES = ['TAMIL', 'ENGLISH'];

const getTextbooks = async (req, res, next) => {
  try {
    const { classGrade, subject, language } = req.query;
    const contents = await prisma.textbookContent.findMany({
      where: {
        institutionId: req.institutionId,
        ...(classGrade && { classGrade: Number(classGrade) }),
        ...(subject && { subject: { contains: subject, mode: 'insensitive' } }),
        ...(language && { language }),
      },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
      orderBy: [{ classGrade: 'asc' }, { subject: 'asc' }],
    });
    return sendSuccess(res, contents, 'Textbook content retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createTextbook = async (req, res, next) => {
  try {
    const { classGrade, subject, language, chapterTitle, content } = req.body;
    if (!classGrade || !subject || !language || !chapterTitle || !content) {
      throw new ValidationError('classGrade, subject, language, chapterTitle and content are all required');
    }
    if (Number(classGrade) < 5 || Number(classGrade) > 12) {
      throw new ValidationError('classGrade must be between 5 and 12');
    }
    if (!LANGUAGES.includes(language)) {
      throw new ValidationError(`language must be one of: ${LANGUAGES.join(', ')}`);
    }

    const textbook = await prisma.textbookContent.create({
      data: {
        institutionId: req.institutionId,
        classGrade: Number(classGrade),
        subject,
        language,
        chapterTitle,
        content,
        uploadedById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, textbook, 'Textbook chapter added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateTextbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.textbookContent.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Textbook chapter not found');

    const { classGrade, subject, language, chapterTitle, content } = req.body;
    if (language && !LANGUAGES.includes(language)) {
      throw new ValidationError(`language must be one of: ${LANGUAGES.join(', ')}`);
    }

    const textbook = await prisma.textbookContent.update({
      where: { id },
      data: {
        ...(classGrade !== undefined && { classGrade: Number(classGrade) }),
        ...(subject !== undefined && { subject }),
        ...(language !== undefined && { language }),
        ...(chapterTitle !== undefined && { chapterTitle }),
        ...(content !== undefined && { content }),
      },
    });
    return sendSuccess(res, textbook, 'Textbook chapter updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteTextbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.textbookContent.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Textbook chapter not found');

    await prisma.textbookContent.delete({ where: { id } });
    return sendSuccess(res, null, 'Textbook chapter deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTextbooks,
  createTextbook,
  updateTextbook,
  deleteTextbook,
};
