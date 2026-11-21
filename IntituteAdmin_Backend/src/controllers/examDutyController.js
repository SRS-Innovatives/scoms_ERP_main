/**
 * Institute Admin — Exam Duty Allotment (Examination → Exam Duties)
 *
 * Allots staff to exam papers (ExamSchedule): invigilator, chief / room superintendent, squad,
 * reliever. The staff member is notified and prints their Duty Allotment Letter from the Staff
 * portal (Staff_backend examDutyController.getMyDuties).
 *
 * Rules:
 *  - one duty per staff member per paper;
 *  - a staff member can't hold two duties whose times overlap on the same day;
 *  - only ACTIVE staff of this institution;
 *  - approved leave on that day is allowed but returned as a warning, so the admin decides.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, ConflictError, pushNotificationToMany, logger } = require('../../../shared');

const ROLES = ['INVIGILATOR', 'CHIEF_SUPERINTENDENT', 'ROOM_SUPERINTENDENT', 'SQUAD', 'RELIEVER'];
const ROLE_LABEL = {
  INVIGILATOR: 'Invigilator',
  CHIEF_SUPERINTENDENT: 'Chief Superintendent',
  ROOM_SUPERINTENDENT: 'Room Superintendent',
  SQUAD: 'Flying Squad',
  RELIEVER: 'Reliever',
};

/** "09:30" → 570; null when not a time. */
const minutes = (t) => {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const sameDay = (a, b) => new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
/** Two papers on the same day clash when their times overlap (or a time is missing). */
const clashes = (a, b) => {
  if (!sameDay(a.examDate, b.examDate)) return false;
  const [as, ae, bs, be] = [minutes(a.startTime), minutes(a.endTime), minutes(b.startTime), minutes(b.endTime)];
  if ([as, ae, bs, be].some((x) => x === null)) return true;
  return as < be && bs < ae;
};

const STAFF_SELECT = { id: true, firstName: true, lastName: true, employeeCode: true, designation: true, department: { select: { name: true } } };
const staffName = (s) => [s.firstName, s.lastName].filter(Boolean).join(' ');

/** Approved leave covering the paper's day, for these staff → Map(staffId → leave). */
const leaveOn = async (institutionId, staffIds, date) => {
  if (staffIds.length === 0) return new Map();
  const day = new Date(new Date(date).toISOString().slice(0, 10));
  const leaves = await prisma.leaveRequest.findMany({
    where: { institutionId, staffId: { in: staffIds }, status: 'APPROVED', startDate: { lte: new Date(day.getTime() + 86399999) }, endDate: { gte: day } },
    select: { staffId: true, type: true, startDate: true, endDate: true },
  });
  return new Map(leaves.map((l) => [l.staffId, l]));
};

/** Every paper of an exam with its duties, plus the staff list to pick from. */
const getExamDuties = async (req, res, next) => {
  try {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, institutionId: req.institutionId },
      select: { id: true, name: true, examType: true, startDate: true, endDate: true },
    });
    if (!exam) throw new NotFoundError('Exam not found');

    const [papers, staff] = await Promise.all([
      prisma.examSchedule.findMany({
        where: { examId: exam.id },
        select: {
          id: true, examDate: true, startTime: true, endTime: true, roomNumber: true,
          subject: { select: { name: true, code: true } },
          course: { select: { name: true } },
          room: { select: { roomNumber: true, name: true } },
          duties: { select: { id: true, role: true, roomLabel: true, remarks: true, staff: { select: STAFF_SELECT } }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.staff.findMany({
        where: { institutionId: req.institutionId, status: 'ACTIVE' },
        select: STAFF_SELECT,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    ]);

    // duties per staff member across this exam — shown next to each name in the picker
    const load = {};
    papers.forEach((p) => p.duties.forEach((d) => { load[d.staff.id] = (load[d.staff.id] || 0) + 1; }));

    return sendSuccess(res, {
      exam,
      roles: ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] })),
      papers: papers.map((p) => ({ ...p, room: p.room ? (p.room.name ? `${p.room.roomNumber} — ${p.room.name}` : p.room.roomNumber) : p.roomNumber || null, roomNumber: undefined })),
      staff: staff.map((s) => ({ ...s, name: staffName(s), dutiesInExam: load[s.id] || 0 })),
    }, 'Exam duties retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const assignDuty = async (req, res, next) => {
  try {
    const { scheduleId, staffId, role = 'INVIGILATOR', roomLabel, remarks } = req.body || {};
    if (!scheduleId || !staffId) throw new ValidationError('scheduleId and staffId are required');
    if (!ROLES.includes(role)) throw new ValidationError(`role must be one of ${ROLES.join(', ')}`);

    const [paper, staff] = await Promise.all([
      prisma.examSchedule.findFirst({
        where: { id: scheduleId, exam: { institutionId: req.institutionId } },
        select: { id: true, examDate: true, startTime: true, endTime: true, exam: { select: { name: true } }, subject: { select: { name: true } }, course: { select: { name: true } }, roomNumber: true },
      }),
      prisma.staff.findFirst({ where: { id: staffId, institutionId: req.institutionId }, select: { ...STAFF_SELECT, status: true, userId: true } }),
    ]);
    if (!paper) throw new NotFoundError('Exam paper not found');
    if (!staff) throw new NotFoundError('Staff member not found');
    if (staff.status !== 'ACTIVE') throw new ValidationError(`${staffName(staff)} is not an active staff member`);

    // another duty of this staff member at an overlapping time that day
    const others = await prisma.examDuty.findMany({
      where: { staffId, institutionId: req.institutionId, scheduleId: { not: paper.id } },
      select: { schedule: { select: { examDate: true, startTime: true, endTime: true, subject: { select: { name: true } }, exam: { select: { name: true } } } } },
    });
    const clash = others.find((o) => clashes(paper, o.schedule));
    if (clash) {
      throw new ConflictError(`${staffName(staff)} already has a duty at that time — ${clash.schedule.exam.name}, ${clash.schedule.subject.name} (${clash.schedule.startTime}–${clash.schedule.endTime})`);
    }

    let duty;
    try {
      duty = await prisma.examDuty.create({
        data: {
          institutionId: req.institutionId,
          scheduleId: paper.id,
          staffId,
          role,
          roomLabel: roomLabel ? String(roomLabel).trim().slice(0, 100) || null : null,
          remarks: remarks ? String(remarks).trim().slice(0, 300) || null : null,
          assignedById: req.user.id,
        },
        select: { id: true, role: true, roomLabel: true, remarks: true, staff: { select: STAFF_SELECT } },
      });
    } catch (e) {
      if (e?.code === 'P2002') throw new ConflictError(`${staffName(staff)} already has a duty for this paper`);
      throw e;
    }

    const leave = (await leaveOn(req.institutionId, [staffId], paper.examDate)).get(staffId);
    const date = new Date(paper.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    pushNotificationToMany({
      userIds: [staff.userId],
      institutionId: req.institutionId,
      type: 'EXAM',
      link: '/staff/print/duty-letter',
      title: 'Exam Duty Allotted',
      message: `${ROLE_LABEL[role]} — ${paper.exam.name}, ${paper.subject.name} (${paper.course.name}) on ${date}, ${paper.startTime}–${paper.endTime}${duty.roomLabel || paper.roomNumber ? `, room ${duty.roomLabel || paper.roomNumber}` : ''}. Your duty letter is ready to print.`,
    }).catch((e) => logger.error('Exam duty notification failed:', e));

    return sendSuccess(res, {
      ...duty,
      warning: leave ? `${staffName(staff)} is on approved ${String(leave.type).toLowerCase()} leave that day` : null,
    }, `${staffName(staff)} allotted as ${ROLE_LABEL[role]}`, 201);
  } catch (err) {
    next(err);
  }
};

const removeDuty = async (req, res, next) => {
  try {
    const duty = await prisma.examDuty.findFirst({
      where: { id: req.params.id, institutionId: req.institutionId },
      select: { id: true, role: true, staff: { select: { userId: true, firstName: true, lastName: true } }, schedule: { select: { examDate: true, subject: { select: { name: true } }, exam: { select: { name: true } } } } },
    });
    if (!duty) throw new NotFoundError('Duty not found');
    await prisma.examDuty.delete({ where: { id: duty.id } });
    const date = new Date(duty.schedule.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    pushNotificationToMany({
      userIds: [duty.staff.userId],
      institutionId: req.institutionId,
      type: 'EXAM',
      link: '/staff/print/duty-letter',
      title: 'Exam Duty Withdrawn',
      message: `Your ${ROLE_LABEL[duty.role] || duty.role} duty for ${duty.schedule.exam.name}, ${duty.schedule.subject.name} on ${date} has been withdrawn.`,
    }).catch((e) => logger.error('Exam duty notification failed:', e));
    return sendSuccess(res, null, 'Duty removed');
  } catch (err) {
    next(err);
  }
};

module.exports = { getExamDuties, assignDuty, removeDuty, ROLE_LABEL, clashes };
