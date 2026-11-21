/**
 * Staff — My Exam Duties (Print → Duty Allotment Letter)
 *
 * The duties the Institute Admin allotted to the signed-in staff member (Examination → Exam
 * Duties), grouped by exam, with what the letter prints: date, time, paper, class, room, role.
 */
const { prisma, sendSuccess, BusinessRuleError } = require('../../../shared');

const ROLE_LABEL = {
  INVIGILATOR: 'Invigilator',
  CHIEF_SUPERINTENDENT: 'Chief Superintendent',
  ROOM_SUPERINTENDENT: 'Room Superintendent',
  SQUAD: 'Flying Squad',
  RELIEVER: 'Reliever',
};

const getMyDuties = async (req, res, next) => {
  try {
    if (!req.user?.staffId) throw new BusinessRuleError('Only staff accounts have exam duties');
    const [me, duties] = await Promise.all([
      prisma.staff.findUnique({
        where: { id: req.user.staffId },
        select: { firstName: true, lastName: true, employeeCode: true, designation: true, department: { select: { name: true } } },
      }),
      prisma.examDuty.findMany({
        where: { staffId: req.user.staffId, institutionId: req.institutionId },
        select: {
          id: true, role: true, roomLabel: true, remarks: true, createdAt: true,
          schedule: {
            select: {
              examDate: true, startTime: true, endTime: true, roomNumber: true,
              room: { select: { roomNumber: true, name: true } },
              subject: { select: { name: true, code: true } },
              course: { select: { name: true } },
              exam: { select: { id: true, name: true, examType: true, startDate: true, endDate: true } },
            },
          },
        },
      }),
    ]);

    const today = new Date(new Date().toISOString().slice(0, 10));
    const byExam = new Map();
    for (const d of duties) {
      const s = d.schedule;
      if (!byExam.has(s.exam.id)) byExam.set(s.exam.id, { exam: s.exam, duties: [] });
      const room = s.room ? (s.room.name ? `${s.room.roomNumber} — ${s.room.name}` : s.room.roomNumber) : s.roomNumber;
      byExam.get(s.exam.id).duties.push({
        id: d.id,
        role: d.role,
        roleLabel: ROLE_LABEL[d.role] || d.role,
        date: s.examDate,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject.name,
        subjectCode: s.subject.code,
        className: s.course.name,
        room: d.roomLabel || room || null,
        remarks: d.remarks,
        allottedAt: d.createdAt,
        upcoming: new Date(s.examDate) >= today,
      });
    }
    const exams = [...byExam.values()]
      .map((g) => ({ ...g, duties: g.duties.sort((a, b) => new Date(a.date) - new Date(b.date) || String(a.startTime).localeCompare(String(b.startTime))) }))
      .sort((a, b) => new Date(b.exam.startDate) - new Date(a.exam.startDate));

    return sendSuccess(res, {
      staff: me && { name: [me.firstName, me.lastName].filter(Boolean).join(' '), employeeCode: me.employeeCode, designation: me.designation, department: me.department?.name || null },
      exams,
    }, 'Exam duties retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyDuties };
