/**
 * Staff — Student Messaging Controller
 *
 * A staff member can only message students in a section they actually teach (resolved
 * via real SubjectTeacherMapping), and can only ever see conversations they are a party to.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getMySectionIds = async (staffId) => {
  const mappings = await prisma.subjectTeacherMapping.findMany({
    where: { staffId, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  });
  return mappings.map((m) => m.sectionId);
};

const getMyStudents = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'Students retrieved');

    const students = await prisma.student.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { userId: true, firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } },
      orderBy: { firstName: 'asc' },
    });

    return sendSuccess(res, students, 'Students retrieved');
  } catch (err) {
    next(err);
  }
};

const isMyStudent = async (sectionIds, studentUserId) => {
  if (sectionIds.length === 0) return false;
  const student = await prisma.student.findFirst({ where: { userId: studentUserId, sectionId: { in: sectionIds } } });
  return Boolean(student);
};

const getConversation = async (req, res, next) => {
  try {
    const { withUserId } = req.query;
    if (!withUserId) throw new ValidationError('withUserId is required');

    const sectionIds = await getMySectionIds(req.user.staffId);
    if (!(await isMyStudent(sectionIds, withUserId))) throw new NotFoundError('Student not found or access denied');

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

    const sectionIds = await getMySectionIds(req.user.staffId);
    if (!(await isMyStudent(sectionIds, receiverId))) throw new NotFoundError('Student not found or access denied');

    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content },
    });

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyStudents, getConversation, sendMessage };
