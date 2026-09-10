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

// Sensible default curve — used only when the institution hasn't configured a real
// GradeScale yet (Institute Admin → Examination → Grade Setup). Once they do, every
// grade/SGPA/CGPA computed below uses their real, editable scale instead.
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

const gradePointFor = (scale, grade) => scale.find((g) => g.grade === grade)?.gradePoint ?? null;

// Kept for any caller still expecting the old signature — now backed by the default curve.
const computeGrade = (marksObtained, maxMarks) => resolveGrade(DEFAULT_GRADE_CURVE, marksObtained, maxMarks);

// ============================================================
// Exams
// ============================================================
const getExams = async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { institutionId: req.institutionId },
      include: {
        academicYear: { select: { yearName: true } },
        conductedByInstitution: { select: { id: true, name: true } },
        _count: { select: { schedules: true } },
      },
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

    // A plain (non-autonomous) College's exams are really set/owned by its affiliating
    // University — default the conducting authority to that link when one exists. A
    // School, University, or Autonomous College always conducts its own.
    const self = await prisma.institution.findUnique({
      where: { id: req.institutionId },
      select: { type: true, affiliatedUniversityId: true },
    });
    const conductedByInstitutionId = self.type === 'COLLEGE' ? self.affiliatedUniversityId || null : null;

    const exam = await prisma.exam.create({
      data: {
        institutionId: req.institutionId,
        name,
        examType: examType || 'UNIT_TEST',
        academicYearId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        conductedByInstitutionId,
      },
      include: { conductedByInstitution: { select: { id: true, name: true } } },
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

// ============================================================
// Complete / Consolidated Marks Report
// ============================================================

/**
 * One row per student, one column per subject actually scheduled under this exam —
 * the wide "Complete Marks Report" layout. A student is marked FAIL if any subject
 * they have a mark for falls below that subject's own passMarks (a standard
 * per-subject pass rule, not just an overall percentage cutoff). Percentage/rank are
 * computed only from subjects the student actually has marks for, so a student who is
 * missing one subject's mark (not yet entered) isn't unfairly penalized as if they
 * scored zero in it.
 */
const getConsolidatedMarksReport = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { sectionId } = req.query;

    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found');

    const schedules = await prisma.examSchedule.findMany({
      where: { examId },
      include: { subject: { select: { id: true, name: true, code: true } } },
      orderBy: { subject: { name: 'asc' } },
    });
    if (schedules.length === 0) {
      return sendSuccess(res, { subjects: [], rows: [] }, 'No exam schedules set up for this exam yet');
    }

    const studentList = await prisma.student.findMany({
      where: { institutionId: req.institutionId, ...(sectionId && { sectionId }) },
      select: {
        id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true,
        section: { select: { id: true, name: true } },
      },
      orderBy: { rollNumber: 'asc' },
    });

    const marks = await prisma.studentMark.findMany({
      where: { examSchedule: { examId } },
    });
    const marksByStudent = {};
    marks.forEach((m) => {
      if (!marksByStudent[m.studentId]) marksByStudent[m.studentId] = {};
      marksByStudent[m.studentId][m.examScheduleId] = m;
    });

    const subjects = schedules.map((s) => ({
      scheduleId: s.id,
      subjectId: s.subject.id,
      name: s.subject.name,
      code: s.subject.code,
      maxMarks: s.maxMarks,
      passMarks: s.passMarks,
    }));

    const rows = studentList.map((student) => {
      const studentMarks = marksByStudent[student.id] || {};
      let totalMarks = 0;
      let totalMaxMarks = 0;
      let failedAnySubject = false;
      const subjectMarks = subjects.map((subj) => {
        const mark = studentMarks[subj.scheduleId];
        if (!mark) return { ...subj, marksObtained: null, grade: null, isFail: false };
        totalMarks += mark.marksObtained;
        totalMaxMarks += subj.maxMarks;
        const isFail = mark.marksObtained < subj.passMarks;
        if (isFail) failedAnySubject = true;
        return { ...subj, marksObtained: mark.marksObtained, grade: mark.grade || computeGrade(mark.marksObtained, subj.maxMarks) };
      });
      const percentage = totalMaxMarks > 0 ? Number(((totalMarks / totalMaxMarks) * 100).toFixed(2)) : null;

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        section: student.section?.name || null,
        subjectMarks,
        totalMarks,
        totalMaxMarks,
        percentage,
        result: totalMaxMarks === 0 ? null : failedAnySubject ? 'FAIL' : 'PASS',
      };
    });

    const ranked = [...rows]
      .filter((r) => r.percentage !== null)
      .sort((a, b) => b.percentage - a.percentage);
    ranked.forEach((r, idx) => { r.rank = idx + 1; });
    rows.forEach((r) => { if (r.rank === undefined) r.rank = null; });

    return sendSuccess(res, { exam: { id: exam.id, name: exam.name }, subjects, rows }, 'Consolidated marks report retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Official Marksheet — single student, real SGPA (this exam) + real CGPA
// (credit-weighted average across every exam this student has marks for)
// ============================================================
const getStudentMarksheet = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;
    if (!examId) throw new ValidationError('examId is required');

    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId: req.institutionId },
      select: {
        id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true,
        section: { select: { name: true, semester: { select: { name: true, course: { select: { name: true } } } } } },
      },
    });
    if (!student) throw new NotFoundError('Student not found');

    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found');

    const scale = await getGradeScale(req.institutionId);

    // This exam's subject-wise marks (real SGPA input)
    const examMarks = await prisma.studentMark.findMany({
      where: { studentId, examSchedule: { examId } },
      include: { examSchedule: { include: { subject: { select: { name: true, code: true, credits: true } } } } },
    });
    if (examMarks.length === 0) {
      return sendSuccess(res, { student, exam, subjects: [], sgpa: null, cgpa: null }, 'No marks entered for this student in this exam yet');
    }

    const subjects = examMarks.map((m) => {
      const grade = m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks);
      return {
        code: m.examSchedule.subject.code,
        title: m.examSchedule.subject.name,
        credit: m.examSchedule.subject.credits,
        marksObtained: m.marksObtained,
        maxMarks: m.examSchedule.maxMarks,
        grade,
        gradePoint: gradePointFor(scale, grade),
        result: m.marksObtained >= m.examSchedule.passMarks ? 'PASS' : 'FAIL',
      };
    });

    const sgpaCredits = subjects.reduce((sum, s) => sum + (s.gradePoint !== null ? s.credit : 0), 0);
    const sgpaPoints = subjects.reduce((sum, s) => sum + (s.gradePoint !== null ? s.gradePoint * s.credit : 0), 0);
    const sgpa = sgpaCredits > 0 ? Number((sgpaPoints / sgpaCredits).toFixed(2)) : null;

    // CGPA — every exam this student has any marks for, same institution, credit-weighted.
    const allMarks = await prisma.studentMark.findMany({
      where: { studentId, examSchedule: { exam: { institutionId: req.institutionId } } },
      include: { examSchedule: { include: { subject: { select: { credits: true } } } } },
    });
    let cgpaCredits = 0;
    let cgpaPoints = 0;
    allMarks.forEach((m) => {
      const grade = m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks);
      const gp = gradePointFor(scale, grade);
      if (gp !== null) {
        cgpaCredits += m.examSchedule.subject.credits;
        cgpaPoints += gp * m.examSchedule.subject.credits;
      }
    });
    const cgpa = cgpaCredits > 0 ? Number((cgpaPoints / cgpaCredits).toFixed(2)) : null;

    const classification = sgpa === null ? null
      : sgpa >= 9 ? 'FIRST CLASS WITH DISTINCTION'
      : sgpa >= 7 ? 'FIRST CLASS'
      : sgpa >= 6 ? 'SECOND CLASS'
      : sgpa >= 5 ? 'PASS CLASS'
      : 'FAIL';

    return sendSuccess(res, { student, exam, subjects, sgpa, cgpa, classification }, 'Marksheet retrieved successfully');
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
  getConsolidatedMarksReport,
  getStudentMarksheet,
};
