/**
 * Institute Admin — Placement Cell Controller
 *
 * Institute Admin posts real internship/placement openings and reviews applications —
 * the actual employer/job-posting side that was missing (Internships/Placements pages
 * were mock-only with no real listings behind them).
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_TYPES = ['INTERNSHIP', 'PLACEMENT'];

const getPostings = async (req, res, next) => {
  try {
    const postings = await prisma.jobPosting.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, postings, 'Job postings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createPosting = async (req, res, next) => {
  try {
    const { title, company, type, location, compensation, description, eligibility, applicationDeadline } = req.body;
    if (!title || !company) throw new ValidationError('title and company are required');
    if (type && !VALID_TYPES.includes(type)) throw new ValidationError(`type must be one of ${VALID_TYPES.join(', ')}`);

    const posting = await prisma.jobPosting.create({
      data: {
        institutionId: req.institutionId,
        title,
        company,
        type: type || 'INTERNSHIP',
        location,
        compensation,
        description,
        eligibility,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      },
    });

    return sendSuccess(res, posting, 'Job posting published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const closePosting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.jobPosting.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Job posting not found');

    const posting = await prisma.jobPosting.update({ where: { id }, data: { status: 'CLOSED' } });
    return sendSuccess(res, posting, 'Job posting closed');
  } catch (err) {
    next(err);
  }
};

const getApplications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posting = await prisma.jobPosting.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!posting) throw new NotFoundError('Job posting not found');

    const applications = await prisma.jobApplication.findMany({
      where: { jobPostingId: id },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, email: true } } },
      orderBy: { appliedAt: 'desc' },
    });

    return sendSuccess(res, { posting, applications }, 'Applications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // application id
    const { status } = req.body;
    const VALID_STATUSES = ['SHORTLISTED', 'SELECTED', 'REJECTED'];
    if (!VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const application = await prisma.jobApplication.findFirst({
      where: { id, jobPosting: { institutionId: req.institutionId } },
    });
    if (!application) throw new NotFoundError('Application not found or access denied');

    const updated = await prisma.jobApplication.update({ where: { id }, data: { status } });
    return sendSuccess(res, updated, `Application ${status.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPostings, createPosting, closePosting, getApplications, updateApplicationStatus };
