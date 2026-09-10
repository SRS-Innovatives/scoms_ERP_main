/**
 * Staff Attendance Controller (Recording daily / subject student attendance)
 */

const {
  prisma,
  sendSuccess,
  ConflictError,
  NotFoundError,
  sendSMSNotification,
  pushNotificationToMany,
  logger,
} = require('../../../shared');

/** Whether the Institute Admin currently allows staff-triggered absence SMS — the "Take
 * Attendance" screen reads this to tell staff the truth about what pressing Save will do. */
const getSmsStatus = async (req, res, next) => {
  try {
    const settings = await prisma.institutionSettings.findUnique({
      where: { institutionId: req.institutionId },
      select: { staffAttendanceSmsEnabled: true },
    });
    const enabled = settings ? settings.staffAttendanceSmsEnabled !== false : true;
    return sendSuccess(res, { enabled }, 'SMS status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * The classes (section + subject) this staff member is assigned to teach, so the
 * "Take Attendance" screen only ever offers real classes — never a free-text picker.
 */
const getMyClasses = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId, sectionId: { not: null } },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        section: {
          select: {
            id: true,
            name: true,
            semester: { select: { name: true, course: { select: { name: true } } } },
            _count: { select: { students: true } },
          },
        },
      },
    });
    return sendSuccess(res, mappings, 'Assigned classes retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Student roster for a section, in name order — the list a staff member marks attendance against. */
const getRoster = async (req, res, next) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) throw new NotFoundError('sectionId is required');

    const section = await prisma.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!section) throw new NotFoundError('Section not found or access denied');

    const students = await prisma.student.findMany({
      where: { sectionId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true, gender: true, status: true },
      orderBy: { rollNumber: 'asc' },
    });

    // Real, computed attendance % per student from actual recorded sessions in this
    // section — null (not 0) when nothing has been recorded yet, so the UI can show
    // "No data" instead of a misleading 0%.
    const records = await prisma.attendanceRecord.findMany({
      where: { session: { sectionId }, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true, status: true },
    });
    const statsByStudent = {};
    records.forEach((r) => {
      if (!statsByStudent[r.studentId]) statsByStudent[r.studentId] = { total: 0, present: 0 };
      statsByStudent[r.studentId].total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') statsByStudent[r.studentId].present += 1;
    });

    const withStats = students.map((s) => ({
      ...s,
      attendancePercent: statsByStudent[s.id]
        ? Math.round((statsByStudent[s.id].present / statsByStudent[s.id].total) * 100)
        : null,
    }));

    return sendSuccess(res, withStats, 'Roster retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Look up whether a session already exists for this section/subject/date/period — powers edit mode. */
const getSession = async (req, res, next) => {
  try {
    const { sectionId, date, periodNumber = 1 } = req.query;
    if (!sectionId || !date) throw new NotFoundError('sectionId and date are required');

    const session = await prisma.attendanceSession.findFirst({
      where: {
        institutionId: req.institutionId,
        sectionId,
        date: new Date(date),
        periodNumber: Number(periodNumber),
      },
      include: { records: true, subject: { select: { name: true } } },
    });
    return sendSuccess(res, session, session ? 'Existing session found' : 'No session recorded yet');
  } catch (err) {
    next(err);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const { sectionId, subjectId, date, periodNumber = 1, records } = req.body;
    const sessionDate = new Date(date);

    // Prevent duplicate attendance recording for same section, subject, date, period
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        institutionId: req.institutionId,
        sectionId,
        date: sessionDate,
        periodNumber: Number(periodNumber),
      },
    });

    if (existingSession) {
      throw new ConflictError('Attendance has already been recorded for this section, date, and period. Use edit instead.');
    }

    const session = await prisma.attendanceSession.create({
      data: {
        institutionId: req.institutionId,
        sectionId,
        subjectId,
        takenById: req.user.staffId,
        date: sessionDate,
        periodNumber: Number(periodNumber),
        records: {
          create: records.map((rec) => ({
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks,
          })),
        },
      },
      include: {
        records: true,
      },
    });

    notifyAbsentParents(records, req.institutionId, req.user.staffId);

    return sendSuccess(res, session, 'Attendance session recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Edit an already-recorded session's records (e.g. correct a mistake, mark a late-arrival present). */
const updateAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { records } = req.body;

    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, institutionId: req.institutionId },
    });
    if (!session) throw new NotFoundError('Attendance session not found');

    await prisma.$transaction(
      records.map((rec) =>
        prisma.attendanceRecord.upsert({
          where: { sessionId_studentId: { sessionId, studentId: rec.studentId } },
          create: { sessionId, studentId: rec.studentId, status: rec.status, remarks: rec.remarks },
          update: { status: rec.status, remarks: rec.remarks },
        })
      )
    );

    notifyAbsentParents(records, req.institutionId);

    const updated = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, include: { records: true } });
    return sendSuccess(res, updated, 'Attendance updated successfully');
  } catch (err) {
    next(err);
  }
};

/** Recent sessions taken by this staff member, most recent first — for reviewing/editing past attendance. */
const getHistory = async (req, res, next) => {
  try {
    const { sectionId } = req.query;
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        institutionId: req.institutionId,
        takenById: req.user.staffId,
        ...(sectionId && { sectionId }),
      },
      include: {
        section: { select: { name: true } },
        subject: { select: { name: true } },
        records: { select: { status: true } },
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const summarized = sessions.map((s) => ({
      id: s.id,
      date: s.date,
      periodNumber: s.periodNumber,
      section: s.section?.name,
      subject: s.subject?.name,
      totalStudents: s.records.length,
      presentCount: s.records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      absentCount: s.records.filter((r) => r.status === 'ABSENT').length,
    }));

    return sendSuccess(res, summarized, 'Attendance history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Per-student, per-day P/A/L grid for a section over a given month — built from this
 * staff member's own recorded sessions only, never a fabricated calendar. */
const getMonthlyGrid = async (req, res, next) => {
  try {
    const { sectionId, month, year } = req.query;
    if (!sectionId || !month || !year) throw new NotFoundError('sectionId, month and year are required');

    const section = await prisma.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } },
    });
    if (!section) throw new NotFoundError('Section not found or access denied');

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        institutionId: req.institutionId,
        sectionId,
        takenById: req.user.staffId,
        date: { gte: startDate, lte: endDate },
      },
      include: { records: { select: { studentId: true, status: true } } },
      orderBy: { date: 'asc' },
    });

    const students = await prisma.student.findMany({
      where: { sectionId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true },
      orderBy: { rollNumber: 'asc' },
    });

    const days = [...new Set(sessions.map((s) => s.date.getUTCDate()))].sort((a, b) => a - b);

    const grid = students.map((st) => {
      const byDay = {};
      sessions.forEach((s) => {
        const rec = s.records.find((r) => r.studentId === st.id);
        if (rec) byDay[s.date.getUTCDate()] = rec.status;
      });
      return { studentId: st.id, name: `${st.firstName} ${st.lastName}`, rollNumber: st.rollNumber, byDay };
    });

    return sendSuccess(res, { days, grid }, 'Monthly attendance grid retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Fires a real SMS to each absent student's parent — reuses the SMS credit wallet built
 * earlier (blocked automatically if the institution's balance is exhausted). Runs in the
 * background so a slow/blocked SMS never delays the attendance-save response.
 */
const notifyAbsentParents = async (records, institutionId, staffId) => {
  const absentIds = records.filter((r) => r.status === 'ABSENT').map((r) => r.studentId);
  if (absentIds.length === 0) return;

  try {
    const students = await prisma.student.findMany({
      where: { id: { in: absentIds } },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
      },
    });

    // The student's own in-app notification is independent of the parent-SMS toggle below —
    // it's the student's own account, not the SMS feature the Institute Admin is gating.
    pushNotificationToMany({
      userIds: students.map((s) => s.userId),
      institutionId,
      title: 'Marked Absent',
      message: "You were marked ABSENT for today's class. Contact your class teacher if this is unexpected.",
      type: 'ATTENDANCE',
      link: '/student/attendance',
    }).catch(() => {});

    // The Institute Admin decides whether staff can trigger this SMS at all (Settings →
    // SMS Gateway) — off by default is never assumed, so a missing settings row still sends.
    const settings = await prisma.institutionSettings.findUnique({
      where: { institutionId },
      select: { staffAttendanceSmsEnabled: true },
    });
    if (settings && settings.staffAttendanceSmsEnabled === false) {
      logger.info(`📱 [SMS SKIPPED] Staff attendance SMS is disabled by the Institute Admin for institution ${institutionId}`);
      return;
    }

    for (const student of students) {
      const phone = student.parents[0]?.parent?.fatherPhone || student.parents[0]?.parent?.motherPhone || student.parents[0]?.parent?.guardianPhone;
      if (!phone) continue;
      sendSMSNotification({
        to: phone,
        message: `Dear Parent, your ward ${student.firstName} ${student.lastName} was marked ABSENT today. Please contact the school if this is unexpected. - SCOMS`,
        institutionId,
        purpose: 'ATTENDANCE_ALERT',
        sentByStaffId: staffId,
      }).catch((err) => logger.error('Failed to send absence SMS:', err));
    }
  } catch (err) {
    logger.error('Failed to notify absent parents:', err);
  }
};

module.exports = {
  getSmsStatus,
  getMyClasses,
  getRoster,
  getSession,
  markAttendance,
  updateAttendance,
  getHistory,
  getMonthlyGrid,
};
