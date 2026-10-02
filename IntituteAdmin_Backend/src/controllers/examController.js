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
  BusinessRuleError,
  getGradeScale,
  resolveGrade,
  gradePointFor,
  computeGrade,
  resolveRoom,
} = require('../../../shared');
const ExcelJS = require('exceljs');

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
        subject: { select: { name: true, code: true } },
        course: { select: { name: true } }, // the schedule's own class now, not derived from the subject
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
    const { examId, subjectId, courseId, examDate, startTime, endTime, maxMarks, passMarks, roomNumber, roomId } = req.body;
    if (!examId || !subjectId || !courseId || !examDate) throw new ValidationError('examId, subjectId, courseId, examDate are required');

    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found or access denied');
    const room = await resolveRoom(roomId, req.institutionId);

    // A subject now serves several classes — courseId says explicitly which one this
    // particular exam schedule is for, so it must actually be mapped to that subject.
    const mapping = await prisma.subjectClassMapping.findFirst({
      where: { subjectId, courseId, subject: { institutionId: req.institutionId }, course: { institutionId: req.institutionId } },
    });
    if (!mapping) throw new ValidationError('This subject is not mapped to the selected class — map it first under Subject Setup');

    const schedule = await prisma.examSchedule.create({
      data: {
        examId,
        subjectId,
        courseId,
        examDate: new Date(examDate),
        startTime: startTime || '',
        endTime: endTime || '',
        maxMarks: Number(maxMarks) || 100,
        passMarks: Number(passMarks) || 35,
        roomNumber: roomNumber || room?.roomNumber || null,
        roomId: room?.id || null,
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

const saveMarks = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { marks } = req.body; // [{ studentId, marksObtained, isAbsent, remarks }]
    if (!Array.isArray(marks)) throw new ValidationError('marks must be an array');

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');
    if (schedule.isPublished) {
      throw new BusinessRuleError('Results for this subject are already published and locked. Unlock for correction first, then re-publish once you\'re done.');
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

/** Admin-only escape hatch: a published result is locked (see saveMarks above) — this
 * explicitly re-opens it for correction, with a reason recorded on the audit trail, so
 * a post-publish edit is always a deliberate, logged admin decision, never a silent one. */
const unlockSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ValidationError('A reason is required to unlock a published result for correction');

    const schedule = await prisma.examSchedule.findFirst({ where: { id: scheduleId, exam: { institutionId: req.institutionId } } });
    if (!schedule) throw new NotFoundError('Exam schedule not found');
    if (!schedule.isPublished) throw new ValidationError('This result is not published — nothing to unlock');

    const updated = await prisma.examSchedule.update({
      where: { id: scheduleId },
      data: { isPublished: false, publishedAt: null },
    });

    await prisma.auditLog.create({
      data: {
        institutionId: req.institutionId,
        userId: req.user.id,
        action: 'RESULTS_UNLOCKED',
        module: 'EXAMINATION',
        entity: 'ExamSchedule',
        entityId: scheduleId,
        newValues: JSON.stringify({ reason }),
      },
    }).catch(() => {});

    return sendSuccess(res, updated, 'Unlocked for correction — remember to re-publish once you\'re done, students can\'t see this result until then');
  } catch (err) {
    next(err);
  }
};

/** Parses an uploaded .xlsx/.csv of marks (Roll Number, Marks Obtained, Absent) into a
 * previewable, validated row set — nothing is written yet, the admin reviews it in the
 * normal marks-entry grid and hits Save Marks like any manual edit. */
const parseMarksImport = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    if (!req.file) throw new ValidationError('No file uploaded. Attach an .xlsx or .csv file as "file".');

    const schedule = await prisma.examSchedule.findFirst({
      where: { id: scheduleId, exam: { institutionId: req.institutionId } },
      include: { subject: true },
    });
    if (!schedule) throw new NotFoundError('Exam schedule not found');

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
      // An absence never counts against (or towards) the student's overall percentage —
      // only subjects they actually sat for feed the total, same treatment as a
      // not-yet-entered mark gets in the consolidated report below.
      if (!m.isAbsent) {
        byStudent[m.studentId].total += m.marksObtained;
        byStudent[m.studentId].maxTotal += m.examSchedule.maxMarks;
      }
      byStudent[m.studentId].subjects.push({ subject: m.examSchedule.subject.name, marks: m.marksObtained, maxMarks: m.examSchedule.maxMarks, grade: m.grade, isAbsent: m.isAbsent });
    });

    const ranked = Object.values(byStudent)
      .map((r) => ({ ...r, percentage: r.maxTotal > 0 ? Number(((r.total / r.maxTotal) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    // Subject-wise class average — absentees excluded, an "AB" of 0 would otherwise drag the average down
    const bySubject = {};
    marks.filter((m) => !m.isAbsent).forEach((m) => {
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
        if (!mark) return { ...subj, marksObtained: null, grade: null, isFail: false, isAbsent: false };
        if (mark.isAbsent) return { ...subj, marksObtained: 0, grade: 'AB', isFail: false, isAbsent: true };
        totalMarks += mark.marksObtained;
        totalMaxMarks += subj.maxMarks;
        const isFail = mark.marksObtained < subj.passMarks;
        if (isFail) failedAnySubject = true;
        return { ...subj, marksObtained: mark.marksObtained, grade: mark.grade || computeGrade(mark.marksObtained, subj.maxMarks), isAbsent: false };
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
      // An absence never earns (or loses) a grade point — it's shown as "AB" and simply
      // excluded from both SGPA and CGPA credit-weighting below.
      if (m.isAbsent) {
        return {
          code: m.examSchedule.subject.code, title: m.examSchedule.subject.name, credit: m.examSchedule.subject.credits,
          marksObtained: null, maxMarks: m.examSchedule.maxMarks, grade: 'AB', gradePoint: null, result: 'ABSENT',
        };
      }
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
    allMarks.filter((m) => !m.isAbsent).forEach((m) => {
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
  unlockSchedule,
  parseMarksImport,
  getRankList,
  getConsolidatedMarksReport,
  getStudentMarksheet,
};
