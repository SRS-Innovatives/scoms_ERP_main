/**
 * Staff — SMS Broadcast Center & Message History
 *
 * A staff member may only broadcast to sections they actually teach (via real
 * SubjectTeacherMapping), and only ever sees their own sent history.
 */
const { prisma, sendSuccess, ValidationError, BusinessRuleError, sendSMSNotification } = require('../../../shared');

const getMySectionIds = async (staffId) => {
  const mappings = await prisma.subjectTeacherMapping.findMany({
    where: { staffId, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  });
  return mappings.map((m) => m.sectionId);
};

/** Sends a real SMS to every parent of every student in one of the staff member's own sections. */
const broadcastToSection = async (req, res, next) => {
  try {
    const { sectionId, message } = req.body;
    if (!sectionId || !message?.trim()) throw new ValidationError('sectionId and message are required');

    const sectionIds = await getMySectionIds(req.user.staffId);
    if (!sectionIds.includes(sectionId)) throw new BusinessRuleError('You are not assigned to this section');

    const students = await prisma.student.findMany({
      where: { sectionId, status: 'ACTIVE' },
      select: {
        firstName: true,
        lastName: true,
        parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
      },
    });

    let sentCount = 0;
    let skippedCount = 0;
    for (const student of students) {
      const phone = student.parents[0]?.parent?.fatherPhone || student.parents[0]?.parent?.motherPhone || student.parents[0]?.parent?.guardianPhone;
      if (!phone) {
        skippedCount += 1;
        continue;
      }
      const ok = await sendSMSNotification({
        to: phone,
        message: message.trim(),
        institutionId: req.institutionId,
        purpose: 'STAFF_BROADCAST',
        sentByStaffId: req.user.staffId,
      });
      if (ok) sentCount += 1;
    }

    return sendSuccess(res, { sentCount, skippedCount, totalStudents: students.length }, `SMS sent to ${sentCount} parent(s)${skippedCount > 0 ? ` (${skippedCount} skipped — no phone on file)` : ''}`);
  } catch (err) {
    next(err);
  }
};

/** Real parent/guardian contact directory for every student in the staff member's own
 * sections — there is no separate Parent portal in SCOMS, so a phone call/SMS is the real
 * contact channel rather than a fabricated in-app reply thread. */
const getParentContacts = async (req, res, next) => {
  try {
    const sectionIds = await getMySectionIds(req.user.staffId);
    if (sectionIds.length === 0) return sendSuccess(res, [], 'No assigned classes yet');

    const students = await prisma.student.findMany({
      where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        section: { select: { name: true } },
        parents: { include: { parent: true } },
      },
      orderBy: { rollNumber: 'asc' },
    });

    const contacts = students.map((s) => {
      const parent = s.parents[0]?.parent;
      return {
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber,
        section: s.section?.name,
        fatherName: parent?.fatherName || null,
        fatherPhone: parent?.fatherPhone || null,
        motherName: parent?.motherName || null,
        motherPhone: parent?.motherPhone || null,
        guardianName: parent?.guardianName || null,
        guardianPhone: parent?.guardianPhone || null,
      };
    });

    return sendSuccess(res, contacts, 'Parent contacts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Sends a real SMS to one specific parent phone number, for a student in the staff
 * member's own section. */
const sendToParent = async (req, res, next) => {
  try {
    const { studentId, phone, message } = req.body;
    if (!studentId || !phone || !message?.trim()) throw new ValidationError('studentId, phone and message are required');

    const sectionIds = await getMySectionIds(req.user.staffId);
    const student = await prisma.student.findFirst({ where: { id: studentId, sectionId: { in: sectionIds } } });
    if (!student) throw new BusinessRuleError('You may only contact parents of students in your own assigned classes');

    const ok = await sendSMSNotification({
      to: phone,
      message: message.trim(),
      institutionId: req.institutionId,
      purpose: 'STAFF_BROADCAST',
      sentByStaffId: req.user.staffId,
    });

    return sendSuccess(res, { sent: ok }, ok ? 'Message sent to parent' : 'Message could not be sent — check institution SMS credits');
  } catch (err) {
    next(err);
  }
};

/** This staff member's own sent SMS history — both broadcasts and automatic absence alerts. */
const getMyHistory = async (req, res, next) => {
  try {
    const logs = await prisma.smsLog.findMany({
      where: { sentByStaffId: req.user.staffId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return sendSuccess(res, logs, 'SMS history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { broadcastToSection, sendToParent, getMyHistory, getParentContacts };
