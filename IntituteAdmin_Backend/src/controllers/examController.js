/**
 * Institute Admin Examination Controller
 *
 * Exam → ExamSchedule (per subject) → StudentMark. Staff enters marks for their
 * assigned subjects (Staff_backend); Institute Admin owns exam/schedule setup,
 * oversight/override of marks, and publishing results (only published marks are
 * visible on the Student portal).
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

const computeGrade = (marksObtained, maxMarks) => {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 75) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 35) return 'D';
  return 'F';
};

// ============================================================
// Exams
// ============================================================
const getExams = async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { institutionId: req.institutionId },
      include: { academicYear: { select: { yearName: true } }, _count: { select: { schedules: true } } },
      orderBy: { startDate: 'desc' },
    });
    return sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createExam = async (req, res, next) => {
  try {
    const { name, examType, academicYearId, startDate, endDate } = req.body;
    if (!name || !academicYearId || !startDate || !endDate) throw new ValidationError('name, academicYearId, startDate, endDate are required');

    const year = await prisma.academicYear.findFirst({ where: { id: academicYearId, institutionId: req.institutionId } });
    if (!year) throw new NotFoundError('Academic year not found or access denied');

    const exam = await prisma.exam.create({
      data: {
        institutionId: req.institutionId,
        name,
        examType: examType || 'UNIT_TEST',
        academicYearId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    return sendSuccess(res, exam, 'Exam created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateExamStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existing = await prisma.exam.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Exam not found');

    const exam = await prisma.exam.update({ where: { id }, data: { status } });
    return sendSuccess(res, exam, 'Exam status updated successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Exam Schedules (per subject)
// ============================================================
const getSchedules = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const schedules = await prisma.examSchedule.findMany({
      where: { exam: { institutionId: req.institutionId }, ...(examId && { examId }) },
      include: {
        subject: { select: { name: true, code: true, course: { select: { name: true } } } },
        exam: { select: { name: true, examType: true } },
        _count: { select: { studentMarks: true } },
      },
      orderBy: { examDate: 'asc' },
    });
    return sendSuccess(res, schedules, 'Exam schedules retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const { examId, subjectId, examDate, startTime, endTime, maxMarks, passMarks, roomNumber } = req.body;
    if (!examId || !subjectId || !examDate) throw new ValidationError('examId, subjectId, examDate are required');

    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found or access denied');

    const subject = await prisma.subject.findFirst({ where: { id: subjectId, course: { institutionId: req.institutionId } } });
    if (!subject) throw new NotFoundError('Subject not found or access denied');

    const schedule = await prisma.examSchedule.create({
      data: {
        examId,
        subjectId,
        examDate: new Date(examDate),
        startTime: startTime || '',
        endTime: endTime || '',
        maxMarks: Number(maxMarks) || 100,
        passMarks: Number(passMarks) || 35,
        roomNumber: roomNumber || null,
      },
    });
    return sendSuccess(res, schedule, 'Exam schedule created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.examSchedule.findFirst({ where: { id, exam: { institutionId: req.institutionId } } });
    if (!existing) throw new NotFoundError('Exam schedule not found');
    await prisma.examSchedule.delete({ where: { id } });
    return sendSuccess(res, null, 'Exam schedule deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Marks (oversight / admin entry+correction) — roster is every ACTIVE student
// enrolled in the subject's course, matching how Staff-side entry resolves it.
// ============================================================
const getMarksRoster = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, exam: { institutionId: req.institutionId } },
      include: { subject: true, exam: true },
    });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const [students, marks] = await Promise.all([
      prisma.student.findMany({
        where: { courseId: schedule.subject.courseId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } },
        orderBy: { rollNumber: 'asc' },
      }),
      prisma.studentMark.findMany({ where: { examScheduleId: scheduleId } }),
    ]);

    const marksByStudent = Object.fromEntries(marks.map((m) => [m.studentId, m]));
    const roster = students.map((s) => ({ ...s, mark: marksByStudent[s.id] || null }));

    return sendSuccess(res, { schedule, roster }, 'Marks roster retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const saveMarks = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { marks } = req.body; // [{ studentId, marksObtained, remarks }]
    if (!Array.isArray(marks)) throw new ValidationError('marks must be an array');

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    await prisma.$transaction(
      marks
        .filter((m) => m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '')
        .map((m) => {
          const marksObtained = Number(m.marksObtained);
          const grade = computeGrade(marksObtained, schedule.maxMarks);
          return prisma.studentMark.upsert({
            where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId: m.studentId } },
            create: { examScheduleId: scheduleId, studentId: m.studentId, marksObtained, grade, remarks: m.remarks || null },
            update: { marksObtained, grade, remarks: m.remarks || null },
          });
        })
    );

    return sendSuccess(res, null, 'Marks saved successfully');
  } catch (err) {
    next(err);
  }
};

const publishResults = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const updated = await prisma.examSchedule.update({
      where: { id: scheduleId },
      data: { isPublished: !schedule.isPublished, publishedAt: !schedule.isPublished ? new Date() : null },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: updated.isPublished ? 'RESULTS_PUBLISHED' : 'RESULTS_UNPUBLISHED',
        module: 'EXAMINATION',
        entity: 'ExamSchedule',
        entityId: scheduleId,
      },
    }).catch(() => {});

    return sendSuccess(res, updated, updated.isPublished ? 'Results published — visible to students now' : 'Results unpublished');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Rank List & Subject Analysis
// ============================================================
const getRankList = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found');

    const marks = await prisma.studentMark.findMany({
      where: { examSchedule: { examId } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, section: { select: { name: true } } } },
        examSchedule: { select: { subjectId: true, maxMarks: true, subject: { select: { name: true } } } },
      },
    });

    const byStudent = {};
    marks.forEach((m) => {
      if (!byStudent[m.studentId]) {
        byStudent[m.studentId] = { student: m.student, total: 0, maxTotal: 0, subjects: [] };
      }
      byStudent[m.studentId].total += m.marksObtained;
      byStudent[m.studentId].maxTotal += m.examSchedule.maxMarks;
      byStudent[m.studentId].subjects.push({ subject: m.examSchedule.subject.name, marks: m.marksObtained, maxMarks: m.examSchedule.maxMarks, grade: m.grade });
    });

    const ranked = Object.values(byStudent)
      .map((r) => ({ ...r, percentage: r.maxTotal > 0 ? Number(((r.total / r.maxTotal) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    // Subject-wise class average
    const bySubject = {};
    marks.forEach((m) => {
      const key = m.examSchedule.subject.name;
      if (!bySubject[key]) bySubject[key] = { subject: key, total: 0, count: 0, maxMarks: m.examSchedule.maxMarks };
      bySubject[key].total += m.marksObtained;
      bySubject[key].count += 1;
    });
    const subjectAnalysis = Object.values(bySubject).map((s) => ({
      subject: s.subject,
      average: Number((s.total / s.count).toFixed(2)),
      maxMarks: s.maxMarks,
      studentsAppeared: s.count,
    }));

    return sendSuccess(res, { rankList: ranked, subjectAnalysis }, 'Rank list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExams,
  createExam,
  updateExamStatus,
  getSchedules,
  createSchedule,
  deleteSchedule,
  getMarksRoster,
  saveMarks,
  publishResults,
  getRankList,
};
