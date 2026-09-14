/**
 * Staff Question Bank & Automatic Question Paper Generator Controller
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
  getGradeScale,
  resolveGrade,
} = require('../../../shared');
const ExcelJS = require('exceljs');

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
      // A subject can now serve several classes — no single "course" to select, so the
      // mapped classes are joined into one label (e.g. "Class 9, Class 10") for display.
      include: { subject: { select: { name: true, code: true, classMappings: { select: { course: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    const withCourseLabel = questions.map((q) => ({
      ...q,
      subject: q.subject && { ...q.subject, course: { name: q.subject.classMappings.map((m) => m.course.name).join(', ') || null } },
    }));

    return sendSuccess(res, withCourseLabel, 'Question bank retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** The subjects this staff member is assigned to teach — feeds Question Bank / Paper Generator dropdowns. */
const getMySubjects = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId },
      include: { subject: { select: { id: true, name: true, code: true, classMappings: { select: { course: { select: { name: true } } } } } } },
      distinct: ['subjectId'],
    });
    // Same joined-classes label as getQuestions above — a subject can serve several classes now.
    const subjects = mappings
      .map((m) => m.subject && { ...m.subject, course: { name: m.subject.classMappings.map((c) => c.course.name).join(', ') || null } })
      .filter(Boolean);
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
        where: { courseId: schedule.courseId, status: 'ACTIVE' },
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

/** Validates one mark row before it's ever written — outside [0, maxMarks] is rejected
 * rather than silently clamped, so a bad value never reaches an average/rank/SGPA. */
const validateMarkValue = (marksObtained, maxMarks, studentLabel) => {
  if (Number.isNaN(marksObtained)) throw new ValidationError(`Invalid marks for ${studentLabel}`);
  if (marksObtained < 0 || marksObtained > maxMarks) {
    throw new ValidationError(`Marks for ${studentLabel} must be between 0 and ${maxMarks}`);
  }
};

/** Staff enters/corrects marks for their own subject's exam schedule. */
const saveMarks = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { marks } = req.body; // [{ studentId, marksObtained, isAbsent, remarks }]
    if (!Array.isArray(marks)) throw new ValidationError('marks must be an array');

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId: schedule.subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');
    if (schedule.isPublished) {
      throw new BusinessRuleError('These marks are already published and locked. Ask your Institute Admin to unlock this subject for correction, then re-publish once you\'re done.');
    }

    const scale = await getGradeScale(req.institutionId);

    const rows = marks.filter((m) => m.isAbsent || (m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== ''));
    rows.forEach((m) => {
      if (!m.isAbsent) validateMarkValue(Number(m.marksObtained), schedule.maxMarks, `student ${m.studentId}`);
    });

    await prisma.$transaction(
      rows.map((m) => {
        const isAbsent = !!m.isAbsent;
        const marksObtained = isAbsent ? 0 : Number(m.marksObtained);
        const grade = isAbsent ? 'AB' : resolveGrade(scale, marksObtained, schedule.maxMarks);
        return prisma.studentMark.upsert({
          where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId: m.studentId } },
          create: { examScheduleId: scheduleId, studentId: m.studentId, marksObtained, grade, isAbsent, remarks: m.remarks || null },
          update: { marksObtained, grade, isAbsent, remarks: m.remarks || null },
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

/** Parses an uploaded .xlsx/.csv of marks (Roll Number, Marks Obtained, Absent) into a
 * previewable, validated row set for one of this staff member's own subjects — nothing
 * is written yet, they review it in the normal marks-entry grid and hit Save Marks. */
const parseMarksImport = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    if (!req.file) throw new ValidationError('No file uploaded. Attach an .xlsx or .csv file as "file".');

    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, exam: { institutionId: req.institutionId } },
      include: { subject: true },
    });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

    const isAssigned = await prisma.subjectTeacherMapping.findFirst({ where: { staffId: req.user.staffId, subjectId: schedule.subjectId } });
    if (!isAssigned) throw new BusinessRuleError('You are not assigned to teach this subject');

    const workbook = new ExcelJS.Workbook();
    if (req.file.originalname.toLowerCase().endsWith('.csv')) {
      await workbook.csv.read(require('stream').Readable.from(req.file.buffer));
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new ValidationError('The uploaded file has no readable sheet');

    // Array.from (not .map) — ExcelJS's row.values is a sparse array with index 0 always
    // a hole, and .map() skips holes while the .findIndex() below does not, so a plain
    // .map() leaves header[0] as a real hole that crashes .includes() on undefined.
    const header = Array.from(sheet.getRow(1).values, (v) => String(v || '').trim().toLowerCase());
    const rollCol = header.findIndex((h) => h.includes('roll'));
    const marksCol = header.findIndex((h) => h.includes('marks'));
    const absentCol = header.findIndex((h) => h.includes('absent'));
    if (rollCol === -1 || marksCol === -1) {
      throw new ValidationError('The file must have "Roll Number" and "Marks Obtained" columns (an "Absent" column is optional)');
    }

    const students = await prisma.student.findMany({
      where: { courseId: schedule.courseId, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true },
    });
    const byRoll = new Map(students.filter((s) => s.rollNumber).map((s) => [String(s.rollNumber).trim().toLowerCase(), s]));

    const rows = [];
    const errors = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const roll = String(row.values[rollCol] ?? '').trim();
      if (!roll) return;
      const student = byRoll.get(roll.toLowerCase());
      if (!student) { errors.push({ rowNumber, roll, reason: 'No active student with this roll number in this class' }); return; }

      const isAbsent = absentCol > -1 && /^(y|yes|true|1|absent)$/i.test(String(row.values[absentCol] ?? '').trim());
      const rawMarks = row.values[marksCol];
      if (!isAbsent) {
        const marksObtained = Number(rawMarks);
        if (rawMarks === undefined || rawMarks === null || rawMarks === '' || Number.isNaN(marksObtained)) {
          errors.push({ rowNumber, roll, reason: 'Marks value is missing or not a number' }); return;
        }
        if (marksObtained < 0 || marksObtained > schedule.maxMarks) {
          errors.push({ rowNumber, roll, reason: `Marks must be between 0 and ${schedule.maxMarks}` }); return;
        }
        rows.push({ studentId: student.id, rollNumber: student.rollNumber, name: `${student.firstName} ${student.lastName}`, marksObtained, isAbsent: false });
      } else {
        rows.push({ studentId: student.id, rollNumber: student.rollNumber, name: `${student.firstName} ${student.lastName}`, marksObtained: 0, isAbsent: true });
      }
    });

    return sendSuccess(res, { matched: rows, errors, totalRows: rows.length + errors.length }, `${rows.length} row(s) matched, ${errors.length} error(s) — review below, nothing is saved yet`);
  } catch (err) {
    next(err);
  }
};

/** Average marks % per subject this staff member teaches. A subject can be mapped to
 * several classes at once now, so "courseName" lists every class it's mapped to —
 * marks themselves are still correctly scoped per class via each ExamSchedule's own courseId. */
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
      select: { id: true, name: true, classMappings: { select: { course: { select: { name: true } } } } },
    });

    const results = await Promise.all(
      subjects.map(async (s) => {
        const courseName = s.classMappings.map((m) => m.course.name).join(', ') || null;
        const marks = await prisma.studentMark.findMany({
          where: { examSchedule: { subjectId: s.id, exam: { institutionId: req.institutionId } }, isAbsent: false },
          select: { marksObtained: true, examSchedule: { select: { maxMarks: true } } },
        });
        if (marks.length === 0) return { subjectId: s.id, subjectName: s.name, courseName, avgPercentage: null, studentCount: 0 };

        const totalPct = marks.reduce((sum, m) => sum + (m.marksObtained / m.examSchedule.maxMarks) * 100, 0);
        return {
          subjectId: s.id,
          subjectName: s.name,
          courseName,
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
        where: { studentId: { in: studentIds }, examSchedule: { subjectId: { in: subjectIds } }, isAbsent: false },
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
  parseMarksImport,
  getSubjectPerformance,
  getStudentPerformanceSummary,
};
