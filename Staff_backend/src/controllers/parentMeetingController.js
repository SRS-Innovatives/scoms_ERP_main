/**
 * Staff — Parent-Teacher Meeting (PTM) Notes Controller
 *
 * A staff member may only log/view meeting notes for students in a section they actually
 * teach (via SubjectTeacherMapping), never for the whole institution. A logged note shows
 * in the parent app's Parent Corner (Student_Backend parentRecordsController), and the
 * child's linked parents get a notification.
 */
const { prisma, sendSuccess, ValidationError, BusinessRuleError, pushNotificationToMany } = require('../../../shared');
const { getTaughtSectionIds } = require('../../../shared/academic/taughtSections');

const MAX_NOTES = 4000;

// cached; dropped when SubjectTeacherMapping changes (shared/academic/taughtSections.js)
const getMySectionIds = getTaughtSectionIds;

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

/** GET /parent-meetings/students — the students I may log a note for (same rule as createNote). */
const getMyStudents = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'Students retrieved');
    const students = await prisma.student.findMany({
      where: { institutionId: req.institutionId, sectionId: { in: sectionIds }, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { select: { id: true, name: true } } },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return sendSuccess(res, students, 'Students retrieved');
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { studentId, parentName, meetingDate } = req.body;
    const discussionNotes = typeof req.body.discussionNotes === 'string' ? req.body.discussionNotes.trim() : '';
    if (!studentId || !discussionNotes) throw new ValidationError('studentId and discussionNotes are required');
    if (discussionNotes.length > MAX_NOTES) throw new ValidationError(`discussionNotes can be at most ${MAX_NOTES} characters`);
    let when = new Date();
    if (meetingDate) {
      when = new Date(meetingDate);
      if (Number.isNaN(when.getTime())) throw new ValidationError('meetingDate must be a valid date');
      if (when.getTime() > Date.now() + 86_400_000) throw new ValidationError('meetingDate cannot be in the future');
    }

    const sectionIds = await getMySectionIds(req.user.staffId);
    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId: req.institutionId, sectionId: { in: sectionIds } },
      select: { id: true, firstName: true, parents: { select: { parent: { select: { userId: true } } } } },
    });
    if (!student) throw new BusinessRuleError('You may only log meeting notes for students in your own assigned classes');

    const note = await prisma.parentMeetingNote.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        staffId: req.user.staffId,
        parentName: (typeof parentName === 'string' && parentName.trim()) || null,
        discussionNotes,
        meetingDate: when,
      },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } } },
    });

    // Parent Corner → PTM Notes. Best-effort; never blocks saving the note.
    const parentUserIds = [...new Set(student.parents.map((p) => p.parent?.userId).filter(Boolean))];
    if (parentUserIds.length) {
      pushNotificationToMany({
        userIds: parentUserIds,
        institutionId: req.institutionId,
        title: 'Parent-teacher meeting notes',
        message: `Notes from your meeting about ${student.firstName} on ${when.toLocaleDateString('en-IN')} are now available.`,
        type: 'PTM',
        link: '/student/ptm-notes',
      }).catch(() => {});
    }

    return sendSuccess(res, note, 'Parent-Teacher Meeting notes recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotes, getMyStudents, createNote };
