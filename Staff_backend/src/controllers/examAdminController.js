/**
 * Staff Portal — Exam Setup Controller (Exam Admin role)
 *
 * Ported from IntituteAdmin_Backend's examController — the exam/schedule setup surface
 * (EXAMS_CREATE) that was missing for EXAM_ADMIN. Marks entry, publishing and roster
 * viewing already exist in Staff_backend's own examController.js under EXAMS_VIEW/
 * MARKS_ENTER/RESULTS_PUBLISH; this file only adds the create/setup half.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
} = require('../../../shared');

/** Academic-year picker for exam creation — mobile-only endpoint (see
 * scoms-app-staff's examSetup module); nothing on web changes. Newest year first,
 * with the institution's current year flagged so the picker can pre-select it. */
const getAcademicYears = async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({
      where: { institutionId: req.institutionId },
      select: { id: true, yearName: true, isCurrent: true },
      orderBy: { startDate: 'desc' },
    });
    return sendSuccess(res, years, 'Academic years retrieved successfully');
  } catch (err) {
    next(err);
  }
};

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

const createSchedule = async (req, res, next) => {
  try {
    const { examId, subjectId, courseId, examDate, startTime, endTime, maxMarks, passMarks, roomNumber } = req.body;
    if (!examId || !subjectId || !courseId || !examDate) throw new ValidationError('examId, subjectId, courseId, examDate are required');

    const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId: req.institutionId } });
    if (!exam) throw new NotFoundError('Exam not found or access denied');

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

module.exports = { getAcademicYears, getExams, createExam, updateExamStatus, createSchedule, deleteSchedule };
