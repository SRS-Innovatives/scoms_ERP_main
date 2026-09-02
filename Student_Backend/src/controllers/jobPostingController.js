/**
 * Student — Internships & Placements Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getPostings = async (req, res, next) => {
  try {
    const { type } = req.query;
    const postings = await prisma.jobPosting.findMany({
      where: { institutionId: req.institutionId, status: 'OPEN', ...(type && { type }) },
      include: { applications: { where: { studentId: req.user.studentId } } },
      orderBy: { createdAt: 'desc' },
    });

    const withStatus = postings.map((p) => ({ ...p, myApplication: p.applications[0] || null, applications: undefined }));
    return sendSuccess(res, withStatus, 'Job postings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const applyToPosting = async (req, res, next) => {
  try {
    const { jobPostingId } = req.body;
    if (!jobPostingId) throw new ValidationError('jobPostingId is required');

    const posting = await prisma.jobPosting.findFirst({ where: { id: jobPostingId, institutionId: req.institutionId, status: 'OPEN' } });
    if (!posting) throw new NotFoundError('Job posting not found or no longer open');

    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostingId_studentId: { jobPostingId, studentId: req.user.studentId } },
    });
    if (existing) return sendSuccess(res, existing, 'Already applied to this posting');

    const application = await prisma.jobApplication.create({
      data: { jobPostingId, studentId: req.user.studentId },
    });

    return sendSuccess(res, application, `Application submitted for ${posting.title} at ${posting.company}`, 201);
  } catch (err) {
    next(err);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { studentId: req.user.studentId },
      include: { jobPosting: { select: { title: true, company: true, type: true } } },
      orderBy: { appliedAt: 'desc' },
    });
    return sendSuccess(res, applications, 'Applications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPostings, applyToPosting, getMyApplications };
