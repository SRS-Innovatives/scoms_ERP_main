/**
 * Staff Question Bank & Automatic Question Paper Generator Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  BusinessRuleError,
} = require('../../../shared');

const createQuestion = async (req, res, next) => {
  try {
    const {
      subjectId,
      chapter,
      topic,
      type,
      difficulty,
      questionText,
      explanation,
      marks,
      options,
      correctAnswer,
    } = req.body;

    const question = await prisma.questionBank.create({
      data: {
        institutionId: req.institutionId,
        subjectId,
        chapter,
        topic,
        type: type || 'MCQ',
        difficulty: difficulty || 'MEDIUM',
        questionText,
        explanation,
        marks: Number(marks) || 1,
        options,
        correctAnswer,
        createdById: req.user.staffId,
      },
    });

    return sendSuccess(res, question, 'Question added to question bank', 201);
  } catch (err) {
    next(err);
  }
};

const generateQuestionPaper = async (req, res, next) => {
  try {
    const { subjectId, totalMarks = 100, easyCount = 5, mediumCount = 5, hardCount = 2 } = req.body;

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'EASY' },
        take: Number(easyCount),
      }),
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'MEDIUM' },
        take: Number(mediumCount),
      }),
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'HARD' },
        take: Number(hardCount),
      }),
    ]);

    const generatedPaper = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    if (generatedPaper.length === 0) {
      throw new BusinessRuleError('Not enough questions in Question Bank for the requested criteria');
    }

    return sendSuccess(res, {
      totalQuestions: generatedPaper.length,
      questions: generatedPaper,
    }, 'Question paper generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuestion,
  generateQuestionPaper,
};
