/**
 * Student — Teacher Messaging Controller
 *
 * A student can only message staff who actually teach their own section (resolved via
 * real SubjectTeacherMapping), and can only ever see conversations they are a party to.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getMyTeachers = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { sectionId: true } });
    if (!student?.sectionId) return sendSuccess(res, [], 'Teachers retrieved');

    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { sectionId: student.sectionId },
      include: { staff: { select: { userId: true, firstName: true, lastName: true, designation: true } }, subject: { select: { name: true } } },
      distinct: ['staffId'],
    });

    const teachers = mappings.map((m) => ({
      userId: m.staff.userId,
      name: `${m.staff.firstName} ${m.staff.lastName}`,
      designation: m.staff.designation,
      subject: m.subject.name,
    }));

    return sendSuccess(res, teachers, 'Teachers retrieved');
  } catch (err) {
    next(err);
  }
};

const isMyTeacher = async (studentSectionId, teacherUserId) => {
  const mapping = await prisma.subjectTeacherMapping.findFirst({
    where: { sectionId: studentSectionId, staff: { userId: teacherUserId } },
  });
  return Boolean(mapping);
};

const getConversation = async (req, res, next) => {
  try {
    const { withUserId } = req.query;
    if (!withUserId) throw new ValidationError('withUserId is required');

    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { sectionId: true } });
    if (!(await isMyTeacher(student?.sectionId, withUserId))) throw new NotFoundError('Teacher not found or access denied');

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, messages, 'Conversation retrieved');
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) throw new ValidationError('receiverId and content are required');

    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { sectionId: true } });
    if (!(await isMyTeacher(student?.sectionId, receiverId))) throw new NotFoundError('Teacher not found or access denied');

    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content },
    });

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyTeachers, getConversation, sendMessage };
