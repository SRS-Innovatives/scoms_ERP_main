/**
 * Institute Admin — HR Recruitment
 *
 * JobOpening (institution hiring staff) -> CandidateApplication (pipeline: APPLIED ->
 * SHORTLISTED -> INTERVIEW_SCHEDULED -> SELECTED|REJECTED -> HIRED). Deliberately the
 * mirror image of the existing Placement module's JobPosting/JobApplication (students
 * applying to outside employers) — same shape, opposite direction, kept as separate
 * models since the two mean different things.
 *
 * A HIRED candidate is NOT auto-converted into a real Staff record — onboarding still
 * goes through the existing staffController registration flow by hand (salary
 * structure, qualifications, etc.), same as Pre-Admission requires an explicit "Admit"
 * rather than a silent auto-create.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];
const APPLICATION_STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'HIRED'];

// ============================================================
// Job Openings
// ============================================================
const getJobOpenings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const openings = await prisma.jobOpening.findMany({
      where: { institutionId: req.institutionId, ...(status && { status }) },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, openings, 'Job openings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createJobOpening = async (req, res, next) => {
  try {
    const { title, department, employmentType = 'FULL_TIME', description, requirements, openings = 1 } = req.body;
    if (!title) throw new ValidationError('title is required');
    if (!EMPLOYMENT_TYPES.includes(employmentType)) throw new ValidationError(`employmentType must be one of ${EMPLOYMENT_TYPES.join(', ')}`);
    if (openings < 1) throw new ValidationError('openings must be at least 1');

    const opening = await prisma.jobOpening.create({
      data: {
        institutionId: req.institutionId,
        title,
        department: department || null,
        employmentType,
        description: description || null,
        requirements: requirements || null,
        openings,
        postedById: req.user.id,
      },
    });
    return sendSuccess(res, opening, 'Job opening created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const closeJobOpening = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.jobOpening.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Job opening not found');

    const opening = await prisma.jobOpening.update({ where: { id }, data: { status: 'CLOSED' } });
    return sendSuccess(res, opening, 'Job opening closed');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Candidate Applications
// ============================================================
const getApplications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opening = await prisma.jobOpening.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!opening) throw new NotFoundError('Job opening not found');

    const applications = await prisma.candidateApplication.findMany({
      where: { jobOpeningId: id },
      orderBy: { appliedAt: 'desc' },
    });
    return sendSuccess(res, applications, 'Applications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Logging a candidate application manually (Institute Admin entering a walk-in/email
 * candidate) — there is no public-facing apply form yet, same starting point
 * Pre-Admission had before its public API was built. */
const addApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { candidateName, email, phone, resumeData, notes } = req.body;
    if (!candidateName || !email || !phone) throw new ValidationError('candidateName, email and phone are required');

    const opening = await prisma.jobOpening.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!opening) throw new NotFoundError('Job opening not found');
    if (opening.status === 'CLOSED') throw new BusinessRuleError('This job opening is closed');

    const application = await prisma.candidateApplication.create({
      data: { jobOpeningId: id, candidateName, email, phone, resumeData: resumeData || null, notes: notes || null },
    });
    return sendSuccess(res, application, 'Application logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, interviewDate, notes } = req.body;
    if (!status || !APPLICATION_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${APPLICATION_STATUSES.join(', ')}`);

    const existing = await prisma.candidateApplication.findFirst({
      where: { id: applicationId, jobOpening: { institutionId: req.institutionId } },
    });
    if (!existing) throw new NotFoundError('Application not found');
    if (status === 'INTERVIEW_SCHEDULED' && !interviewDate) throw new ValidationError('interviewDate is required when scheduling an interview');

    const application = await prisma.candidateApplication.update({
      where: { id: applicationId },
      data: {
        status,
        ...(interviewDate !== undefined && { interviewDate: interviewDate ? new Date(interviewDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    });
    return sendSuccess(res, application, `Application status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getJobOpenings, createJobOpening, closeJobOpening, getApplications, addApplication, updateApplicationStatus };
