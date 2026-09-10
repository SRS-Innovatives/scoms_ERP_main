/**
 * Institute Admin Attendance Oversight Controller — read-only visibility across the
 * whole institution (recording itself happens on the Staff side, per subject/section).
 */
const { prisma, sendSuccess, sendSMSNotification, ValidationError } = require('../../../shared');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** Daily attendance register — every session taken on a given date, institution-wide or for one section. */
const getDailyRegister = async (req, res, next) => {
  try {
    const { date, sectionId } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        institutionId: req.institutionId,
        date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
        ...(sectionId && { sectionId }),
      },
      include: {
        section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } },
        subject: { select: { name: true } },
        takenBy: { select: { user: { select: { email: true } } } },
        records: { include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, sessions, 'Daily attendance register retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Today's (or a given date's) absentees institution-wide, with parent contact for the SMS resend action. */
const getAbsentees = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const records = await prisma.attendanceRecord.findMany({
      where: {
        status: 'ABSENT',
        session: { institutionId: req.institutionId, date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } },
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, rollNumber: true, phone: true,
            section: { select: { name: true } },
            parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
          },
        },
        session: { select: { subject: { select: { name: true } } } },
      },
    });

    const absentees = records.map((r) => ({
      recordId: r.id,
      studentId: r.student.id,
      name: `${r.student.firstName} ${r.student.lastName}`,
      rollNumber: r.student.rollNumber,
      section: r.student.section?.name,
      subject: r.session.subject?.name,
      parentPhone: r.student.parents[0]?.parent?.fatherPhone || r.student.parents[0]?.parent?.motherPhone || r.student.parents[0]?.parent?.guardianPhone || null,
    }));

    return sendSuccess(res, absentees, 'Absentee list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Manually re-send the absence SMS to one or more parents (e.g. the automatic one at mark-time failed/bounced). */
const notifyAbsentees = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds || [] }, institutionId: req.institutionId },
      select: {
        firstName: true, lastName: true,
        parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
      },
    });

    let sentCount = 0;
    for (const student of students) {
      const phone = student.parents[0]?.parent?.fatherPhone || student.parents[0]?.parent?.motherPhone || student.parents[0]?.parent?.guardianPhone;
      if (!phone) continue;
      await sendSMSNotification({
        to: phone,
        message: `Reminder: your ward ${student.firstName} ${student.lastName} was marked ABSENT today. - SCOMS`,
        institutionId: req.institutionId,
        purpose: 'ATTENDANCE_ALERT',
      });
      sentCount++;
    }

    return sendSuccess(res, { sentCount, total: students.length }, `Absence SMS sent to ${sentCount} of ${students.length} parents`);
  } catch (err) {
    next(err);
  }
};

/** Attendance rate trend over the last N days, institution-wide — powers the Reports page. */
const getReports = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.attendanceRecord.findMany({
      where: { session: { institutionId: req.institutionId, date: { gte: since } } },
      select: { status: true, session: { select: { date: true } } },
    });

    const byDate = {};
    records.forEach((r) => {
      const key = r.session.date.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { date: key, present: 0, absent: 0, total: 0 };
      byDate[key].total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') byDate[key].present++;
      else if (r.status === 'ABSENT') byDate[key].absent++;
    });

    const trend = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, rate: d.total > 0 ? Number(((d.present / d.total) * 100).toFixed(1)) : 0 }));

    const overallTotal = records.length;
    const overallPresent = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;

    return sendSuccess(res, {
      trend,
      overallRate: overallTotal > 0 ? Number(((overallPresent / overallTotal) * 100).toFixed(1)) : 0,
      overallTotal,
    }, 'Attendance reports retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// Priority order when a student has more than one session/period recorded on the same
// day (e.g. period-wise attendance) — the worst status of the day wins, so a student
// absent for even one period shows as ABSENT for that day rather than being averaged away.
const DAY_STATUS_PRIORITY = ['ABSENT', 'HALF_DAY', 'LATE', 'LEAVE', 'PRESENT'];
const collapseDayStatus = (statuses) => {
  for (const s of DAY_STATUS_PRIORITY) if (statuses.includes(s)) return s;
  return null;
};

/**
 * Class-wise consolidated monthly attendance grid — one row per student, one column per
 * calendar day of the month. Multiple sessions on the same day (period-wise attendance)
 * collapse to a single day status via collapseDayStatus above.
 */
const getConsolidatedAttendanceReport = async (req, res, next) => {
  try {
    const { sectionId, month, year } = req.query;
    if (!sectionId || !month || !year) throw new ValidationError('sectionId, month and year are required');

    const monthNum = Number(month);
    const yearNum = Number(year);
    const monthStart = new Date(yearNum, monthNum - 1, 1);
    const monthEnd = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const students = await prisma.student.findMany({
      where: { institutionId: req.institutionId, sectionId },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true },
      orderBy: { rollNumber: 'asc' },
    });

    const records = await prisma.attendanceRecord.findMany({
      where: { session: { institutionId: req.institutionId, sectionId, date: { gte: monthStart, lte: monthEnd } } },
      select: { studentId: true, status: true, session: { select: { date: true } } },
    });

    // studentId -> day-of-month -> [statuses that day]
    const byStudentDay = {};
    records.forEach((r) => {
      const day = new Date(r.session.date).getDate();
      if (!byStudentDay[r.studentId]) byStudentDay[r.studentId] = {};
      if (!byStudentDay[r.studentId][day]) byStudentDay[r.studentId][day] = [];
      byStudentDay[r.studentId][day].push(r.status);
    });

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(yearNum, monthNum - 1, i + 1);
      return { day: i + 1, weekday: d.toLocaleDateString('en-US', { weekday: 'short' }) };
    });

    const rows = students.map((student) => {
      const dayMap = byStudentDay[student.id] || {};
      let presentDays = 0;
      let markedDays = 0;
      const attendance = days.map(({ day }) => {
        const statuses = dayMap[day];
        if (!statuses || statuses.length === 0) return null; // no session recorded that day at all
        const dayStatus = collapseDayStatus(statuses);
        markedDays += 1;
        if (dayStatus === 'PRESENT' || dayStatus === 'LATE') presentDays += 1;
        return dayStatus;
      });
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        attendance,
        presentDays,
        markedDays,
        percentage: markedDays > 0 ? Number(((presentDays / markedDays) * 100).toFixed(1)) : null,
      };
    });

    return sendSuccess(res, { days, rows }, 'Consolidated attendance report retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Date-wise attendance report — one whole class/section, one specific date: every
 * student in the section as a row, with their collapsed status for that day (or
 * "NOT_MARKED" if no session was taken for them at all that day), plus a summary.
 */
const getDateWiseAttendanceReport = async (req, res, next) => {
  try {
    const { sectionId, date } = req.query;
    if (!sectionId || !date) throw new ValidationError('sectionId and date are required');

    const targetDate = new Date(date);

    const students = await prisma.student.findMany({
      where: { institutionId: req.institutionId, sectionId },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true },
      orderBy: { rollNumber: 'asc' },
    });

    const records = await prisma.attendanceRecord.findMany({
      where: { session: { institutionId: req.institutionId, sectionId, date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } } },
      select: { studentId: true, status: true, session: { select: { subject: { select: { name: true } }, periodNumber: true } } },
    });

    const byStudent = {};
    records.forEach((r) => {
      if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
      byStudent[r.studentId].push(r.status);
    });

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, HALF_DAY: 0, NOT_MARKED: 0 };
    const rows = students.map((student) => {
      const statuses = byStudent[student.id];
      const status = statuses && statuses.length > 0 ? collapseDayStatus(statuses) : 'NOT_MARKED';
      summary[status] = (summary[status] || 0) + 1;
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        status,
        sessionsRecorded: statuses ? statuses.length : 0,
      };
    });

    const markedCount = students.length - summary.NOT_MARKED;
    const presentCount = summary.PRESENT + summary.LATE;

    return sendSuccess(res, {
      date,
      totalStudents: students.length,
      summary,
      percentage: markedCount > 0 ? Number(((presentCount / markedCount) * 100).toFixed(1)) : null,
      rows,
    }, 'Date-wise attendance report retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyRegister,
  getAbsentees,
  notifyAbsentees,
  getReports,
  getConsolidatedAttendanceReport,
  getDateWiseAttendanceReport,
};
