/**
 * Staff — Parent-Teacher Meeting (PTM) Notes Controller
 *
 * A staff member may only log/view meeting notes for students in a section they actually
 * teach (via SubjectTeacherMapping), never for the whole institution.
 */
const { prisma, sendSuccess, ValidationError, BusinessRuleError } = require('../../../shared');

const getMySectionIds = async (staffId) => {
  const mappings = await prisma.subjectTeacherMapping.findMany({
    where: { staffId, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  });
  return mappings.map((m) => m.sectionId);
};

/** Meeting notes this staff member has personally logged, most recent first. */
const getMyNotes = async (req, res, next) => {
  try {
    const notes = await prisma.parentMeetingNote.findMany({
      where: { staffId: req.user.staffId, institutionId: req.institutionId },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } } },
      orderBy: { meetingDate: 'desc' },
    });
    return sendSuccess(res, notes, 'Parent meeting notes retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { studentId, parentName, discussionNotes, meetingDate } = req.body;
    if (!studentId || !discussionNotes) throw new ValidationError('studentId and discussionNotes are required');

    const sectionIds = await getMySectionIds(req.user.staffId);
    const student = await prisma.student.findFirst({ where: { id: studentId, sectionId: { in: sectionIds } } });
    if (!student) throw new BusinessRuleError('You may only log meeting notes for students in your own assigned classes');

    const note = await prisma.parentMeetingNote.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        staffId: req.user.staffId,
        parentName: parentName || null,
        discussionNotes,
        meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
      },
    });

    return sendSuccess(res, note, 'Parent-Teacher Meeting notes recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotes, createNote };
