/**
 * Institute Admin Homework Oversight Controller — read-only, institution-wide visibility
 * into every homework/assignment staff have posted (the actual posting stays a Staff-side
 * action per subject/section, same division as attendance oversight).
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

/** Every homework post in this institution, most recent first, with real submission
 * counts computed from AssignmentSubmission — never a fabricated completion rate. */
const getHomeworkList = async (req, res, next) => {
  try {
    const { sectionId, subjectName, staffId } = req.query;

    const assignments = await prisma.assignment.findMany({
      where: {
        institutionId: req.institutionId,
        ...(subjectName && { subjectName }),
        ...(staffId && { staffId }),
      },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // className is a formatted label (not a real FK), so section-size and section-filter
    // are resolved by matching that label against real Section→Semester→Course records.
    const sections = await prisma.section.findMany({
      where: { semester: { course: { institutionId: req.institutionId } }, ...(sectionId && { id: sectionId }) },
      select: { id: true, name: true, semester: { select: { course: { select: { name: true } } } }, _count: { select: { students: true } } },
    });
    const sizeByClassName = {};
    const nameById = {};
    sections.forEach((s) => {
      const label = `${s.semester.course.name} - ${s.name}`;
      sizeByClassName[label] = s._count.students;
      nameById[s.id] = label;
    });

    const filtered = sectionId
      ? assignments.filter((a) => a.className === nameById[sectionId])
      : assignments;

    const withStats = filtered.map((a) => ({
      ...a,
      totalStudents: sizeByClassName[a.className] ?? null,
      submissionCount: a._count.submissions,
      hasAttachment: !!a.attachmentUrl,
      _count: undefined,
    }));

    return sendSuccess(res, withStats, 'Homework list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** One homework post's full detail — description, attachment, and every student's
 * submission/marks status for that class (submitted students shown with their real
 * record; everyone else in the class shown as "Not Submitted", never omitted). */
const getHomeworkById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findFirst({
      where: { id, institutionId: req.institutionId },
      include: {
        staff: { select: { firstName: true, lastName: true, user: { select: { email: true } } } },
        submissions: {
          include: { student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } } },
        },
      },
    });
    if (!assignment) throw new NotFoundError('Homework post not found');

    const section = await prisma.section.findFirst({
      where: {
        name: assignment.className.split(' - ').pop(),
        semester: { course: { institutionId: req.institutionId, name: assignment.className.split(' - ')[0] } },
      },
      include: { students: { where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, rollNumber: true }, orderBy: { rollNumber: 'asc' } } },
    });

    const submittedByStudentId = Object.fromEntries(assignment.submissions.map((s) => [s.studentId, s]));
    const roster = (section?.students || []).map((st) => ({
      studentId: st.id,
      name: `${st.firstName} ${st.lastName}`,
      rollNumber: st.rollNumber,
      submission: submittedByStudentId[st.id]
        ? {
            submittedAt: submittedByStudentId[st.id].submittedAt,
            status: submittedByStudentId[st.id].status,
            marksObtained: submittedByStudentId[st.id].marksObtained,
          }
        : null,
    }));

    return sendSuccess(res, { ...assignment, roster }, 'Homework detail retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHomeworkList,
  getHomeworkById,
};
