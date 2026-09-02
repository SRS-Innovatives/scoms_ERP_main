/**
 * Institute Admin — Anonymous Feedback Aggregates Controller
 *
 * Only ever returns aggregates (average rating, response count) grouped by subject —
 * never a per-student row, preserving the anonymity promised to students.
 */
const { prisma, sendSuccess } = require('../../../shared');

const getFeedbackSummary = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { course: { institutionId: req.institutionId } },
      select: {
        id: true,
        name: true,
        course: { select: { name: true } },
        courseFeedback: { select: { rating: true } },
      },
    });

    const summary = subjects
      .filter((s) => s.courseFeedback.length > 0)
      .map((s) => {
        const total = s.courseFeedback.reduce((sum, f) => sum + f.rating, 0);
        return {
          subjectId: s.id,
          subjectName: s.name,
          courseName: s.course.name,
          responseCount: s.courseFeedback.length,
          averageRating: Number((total / s.courseFeedback.length).toFixed(2)),
        };
      })
      .sort((a, b) => b.responseCount - a.responseCount);

    return sendSuccess(res, summary, 'Feedback summary retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeedbackSummary };
