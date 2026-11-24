/**
 * Staff — Student Messaging Controller
 *
 * A staff member can only message students in a section they actually teach (resolved
 * via real SubjectTeacherMapping), and can only ever see conversations they are a party to.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, findConversation, pushNotification } = require('../../../shared');
const { getTaughtSectionIds } = require('../../../shared/academic/taughtSections');

const MAX_LENGTH = 2000;

// cached; dropped when SubjectTeacherMapping changes (shared/academic/taughtSections.js)
const getMySectionIds = getTaughtSectionIds;

/**
 * My students, each with the latest message between us (`lastMessage`, or null) so the
 * app can show a chat list. One message query for everyone, not one per student.
 */
const getMyStudents = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'Students retrieved');

    const students = await prisma.student.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { userId: true, firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } },
      orderBy: { firstName: 'asc' },
    });

    const userIds = students.map((s) => s.userId).filter(Boolean);
    const recent = userIds.length
      ? await prisma.message.findMany({
          where: {
            OR: [
              { senderId: req.user.id, receiverId: { in: userIds } },
              { receiverId: req.user.id, senderId: { in: userIds } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
          select: { id: true, senderId: true, receiverId: true, content: true, createdAt: true },
        })
      : [];
    const last = new Map();
    for (const m of recent) {
      const other = m.senderId === req.user.id ? m.receiverId : m.senderId;
      if (!last.has(other)) last.set(other, { content: m.content.slice(0, 140), createdAt: m.createdAt, fromMe: m.senderId === req.user.id });
    }

    return sendSuccess(res, students.map((s) => ({ ...s, lastMessage: last.get(s.userId) || null })), 'Students retrieved');
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

    // Latest 200 messages (oldest-first, as before) — not the thread's entire history;
    // ?before=<date> pages back through older ones
    const { rows: messages, meta } = await findConversation(prisma, req.user.id, withUserId, req);

    return sendSuccess(res, messages, 'Conversation retrieved', 200, meta);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!receiverId || !content) throw new ValidationError('receiverId and content are required');
    if (content.length > MAX_LENGTH) throw new ValidationError(`A message can be at most ${MAX_LENGTH} characters`);

    const sectionIds = await getMySectionIds(req.user.staffId);
    if (!(await isMyStudent(sectionIds, receiverId))) throw new NotFoundError('Student not found or access denied');

    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content },
    });

    // Tell the student (bell + push). Best-effort — never blocks sending.
    prisma.staff
      .findUnique({ where: { id: req.user.staffId }, select: { firstName: true, lastName: true } })
      .then((me) =>
        pushNotification({
          userId: receiverId,
          institutionId: req.institutionId,
          title: `Message from ${[me?.firstName, me?.lastName].filter(Boolean).join(' ') || 'your teacher'}`,
          message: content.length > 120 ? `${content.slice(0, 117)}…` : content,
          type: 'MESSAGE',
          link: '/student/messages',
        }),
      )
      .catch(() => {});

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyStudents, getConversation, sendMessage };
