/**
 * Staff Question Bank & Automatic Question Paper Generator Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} = require('../../../shared');

const createQuestion = async (req, res, next) => {
  try {
    const {
      subjectId,
      chapter,
      topic,
      type,
      difficulty,
      questionText,
      explanation,
      marks,
      options,
      correctAnswer,
    } = req.body;

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

    const question = await prisma.questionBank.create({
      data: {
        institutionId: req.institutionId,
        subjectId,
        chapter,
        topic,
        type: type || 'MCQ',
        difficulty: difficulty || 'MEDIUM',
        questionText,
        explanation,
        marks: Number(marks) || 1,
        options,
        correctAnswer,
        createdById: req.user.staffId,
      },
    });

    return sendSuccess(res, question, 'Question added to question bank', 201);
  } catch (err) {
    next(err);
  }
};

/** Question bank entries for the subjects this staff member actually teaches. */
const getQuestions = async (req, res, next) => {
  try {
    const { subjectId, difficulty, type } = req.query;

    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      select: { subjectId: true },
      distinct: ['subjectId'],
    });
    const subjectIds = mappings.map((m) => m.subjectId);
    if (subjectIds.length === 0) return sendSuccess(res, [], 'No subjects assigned yet');

    if (subjectId && !subjectIds.includes(subjectId)) {
      throw new BusinessRuleError('You are not assigned to teach this subject');
    }

    const questions = await prisma.questionBank.findMany({
      where: {
        institutionId: req.institutionId,
        subjectId: subjectId || { in: subjectIds },
        ...(difficulty && { difficulty }),
        ...(type && { type }),
      },
      include: { subject: { select: { name: true, code: true, course: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, questions, 'Question bank retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** The subjects this staff member is assigned to teach — feeds Question Bank / Paper Generator dropdowns. */
const getMySubjects = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      include: { subject: { select: { id: true, name: true, code: true, course: { select: { name: true } } } } },
      distinct: ['subjectId'],
    });
    const subjects = mappings.map((m) => m.subject).filter(Boolean);
    return sendSuccess(res, subjects, 'Assigned subjects retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const generateQuestionPaper = async (req, res, next) => {
  try {
    const { subjectId, totalMarks = 100, easyCount = 5, mediumCount = 5, hardCount = 2 } = req.body;

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

    const [easyQuestions, mediumQuestions, hardQuestions] = await Promise.all([
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'EASY' },
        take: Number(easyCount),
      }),
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'MEDIUM' },
        take: Number(mediumCount),
      }),
      prisma.questionBank.findMany({
        where: { institutionId: req.institutionId, subjectId, difficulty: 'HARD' },
        take: Number(hardCount),
      }),
    ]);

    const generatedPaper = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    if (generatedPaper.length === 0) {
      throw new BusinessRuleError('Not enough questions in Question Bank for the requested criteria');
    }

    return sendSuccess(res, {
      totalQuestions: generatedPaper.length,
      questions: generatedPaper,
    }, 'Question paper generated successfully');
  } catch (err) {
    next(err);
  }
};

// Sensible default curve — used only when the institution hasn't configured a real
// GradeScale yet (Institute Admin → Examination → Grade Setup).
const DEFAULT_GRADE_CURVE = [
  { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10 },
  { grade: 'A', minPercentage: 75, maxPercentage: 89.99, gradePoint: 9 },
  { grade: 'B', minPercentage: 60, maxPercentage: 74.99, gradePoint: 7 },
  { grade: 'C', minPercentage: 45, maxPercentage: 59.99, gradePoint: 5 },
  { grade: 'D', minPercentage: 35, maxPercentage: 44.99, gradePoint: 4 },
  { grade: 'F', minPercentage: 0, maxPercentage: 34.99, gradePoint: 0 },
];

const getGradeScale = async (institutionId) => {
  const real = await prisma.gradeScale.findMany({ where: { institutionId } });
  return real.length > 0 ? real : DEFAULT_GRADE_CURVE;
};

const resolveGrade = (scale, marksObtained, maxMarks) => {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  const match = scale.find((g) => pct >= g.minPercentage && pct <= g.maxPercentage);
  return match ? match.grade : null;
};

/** Exam schedules for subjects this staff member is actually assigned to teach — their "exam duties". */
const getMySchedules = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      select: { subjectId: true },
    });
    const subjectIds = [...new Set(mappings.map((m) => m.subjectId))];
    if (subjectIds.length === 0) return sendSuccess(res, [], 'No exam duties assigned yet');

    const schedules = await prisma.examSchedule.findMany({
      where: { subjectId: { in: subjectIds }, exam: { institutionId: req.institutionId } },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { name: true, examType: true } },
        _count: { select: { studentMarks: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    return sendSuccess(res, schedules, 'Exam duties retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Student roster (+ any marks already entered) for one of this staff member's exam schedules. */
const getRoster = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, exam: { institutionId: req.institutionId } },
      include: { subject: true, exam: true },
    });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId: schedule.subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

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

/** Staff enters/corrects marks for their own subject's exam schedule. */
const saveMarks = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { marks } = req.body;
    if (!Array.isArray(marks)) throw new ValidationError('marks must be an array');

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId: schedule.subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

    const scale = await getGradeScale(req.institutionId);

    await prisma.$transaction(
      marks
        .filter((m) => m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '')
        .map((m) => {
          const marksObtained = Number(m.marksObtained);
          const grade = resolveGrade(scale, marksObtained, schedule.maxMarks);
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

/** Marks a staff member's own exam schedule as published — visible to Student/Parent portals. */
const publishMarks = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId: schedule.subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

    const marksCount = await prisma.studentMark.count({ where: { examScheduleId: scheduleId } });
    if (marksCount === 0) throw new BusinessRuleError('Enter marks for at least one student before publishing');

    const updated = await prisma.examSchedule.update({
      where: { id: scheduleId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    return sendSuccess(res, updated, 'Marks published successfully — now visible to students and parents');
  } catch (err) {
    next(err);
  }
};

/** Average marks % per subject this staff member teaches — subjects are course-scoped, so
 * teaching "Physics" in two different courses naturally shows as two comparison rows. */
const getSubjectPerformance = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      select: { subjectId: true },
      distinct: ['subjectId'],
    });
    const subjectIds = mappings.map((m) => m.subjectId);
    if (subjectIds.length === 0) return sendSuccess(res, [], 'No subject performance data yet');

    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, course: { select: { name: true } } },
    });

    const results = await Promise.all(
      subjects.map(async (s) => {
        const marks = await prisma.studentMark.findMany({
          where: { examSchedule: { subjectId: s.id, exam: { institutionId: req.institutionId } } },
          select: { marksObtained: true, examSchedule: { select: { maxMarks: true } } },
        });
        if (marks.length === 0) return { subjectId: s.id, subjectName: s.name, courseName: s.course.name, avgPercentage: null, studentCount: 0 };

        const totalPct = marks.reduce((sum, m) => sum + (m.marksObtained / m.examSchedule.maxMarks) * 100, 0);
        return {
          subjectId: s.id,
          subjectName: s.name,
          courseName: s.course.name,
          avgPercentage: Number((totalPct / marks.length).toFixed(1)),
          studentCount: marks.length,
        };
      })
    );

    return sendSuccess(res, results, 'Subject performance retrieved');
  } catch (err) {
    next(err);
  }
};

/** Per-student attendance % and average marks % across all of this staff member's assigned
 * classes and subjects — the single real data source for the Performance section pages
 * (progress tracker, weak students, top performers, attendance-vs-marks). */
const getStudentPerformanceSummary = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      select: { sectionId: true, subjectId: true },
    });
    const sectionIds = [...new Set(mappings.map((m) => m.sectionId).filter(Boolean))];
    const subjectIds = [...new Set(mappings.map((m) => m.subjectId))];
    if (sectionIds.length === 0) return sendSuccess(res, [], 'No assigned classes yet');

    const students = await prisma.student.findMany({
      where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true, gender: true, status: true, section: { select: { name: true } } },
      orderBy: { rollNumber: 'asc' },
    });
    const studentIds = students.map((s) => s.id);

    const [attendanceRecords, marks] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { studentId: { in: studentIds }, session: { sectionId: { in: sectionIds }, takenById: req.user.staffId } },
        select: { studentId: true, status: true },
      }),
      prisma.studentMark.findMany({
        where: { studentId: { in: studentIds }, examSchedule: { subjectId: { in: subjectIds } } },
        select: { studentId: true, marksObtained: true, examSchedule: { select: { maxMarks: true } } },
      }),
    ]);

    const attStats = {};
    attendanceRecords.forEach((r) => {
      if (!attStats[r.studentId]) attStats[r.studentId] = { total: 0, present: 0 };
      attStats[r.studentId].total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') attStats[r.studentId].present += 1;
    });

    const markStats = {};
    marks.forEach((m) => {
      if (!markStats[m.studentId]) markStats[m.studentId] = { totalPct: 0, count: 0 };
      markStats[m.studentId].totalPct += (m.marksObtained / m.examSchedule.maxMarks) * 100;
      markStats[m.studentId].count += 1;
    });

    const summary = students.map((s) => ({
      id: s.id,
      rollNo: s.rollNumber || s.admissionNumber,
      name: `${s.firstName} ${s.lastName}`,
      gender: s.gender === 'MALE' ? 'M' : s.gender === 'FEMALE' ? 'F' : '—',
      class: s.section?.name,
      status: s.status === 'ACTIVE' ? 'Active' : s.status,
      attendancePercent: attStats[s.id] ? Math.round((attStats[s.id].present / attStats[s.id].total) * 100) : null,
      avgMarksPercent: markStats[s.id] ? Math.round(markStats[s.id].totalPct / markStats[s.id].count) : null,
    }));

    return sendSuccess(res, summary, 'Student performance summary retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getMySubjects,
  generateQuestionPaper,
  getMySchedules,
  getRoster,
  saveMarks,
  publishMarks,
  getSubjectPerformance,
  getStudentPerformanceSummary,
};
