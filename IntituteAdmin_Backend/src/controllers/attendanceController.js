/**
 * Institute Admin Attendance Oversight Controller — read-only visibility across the
 * whole institution (recording itself happens on the Staff side, per subject/section).
 */
const { prisma, sendSuccess, sendSMSNotification } = require('../../../shared');

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

module.exports = {
  getDailyRegister,
  getAbsentees,
  notifyAbsentees,
  getReports,
};
