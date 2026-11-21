/**
 * Student Examination Controller — read-only.
 *
 * A student sees exam schedules for subjects in their own course, and results only
 * once the Institute Admin has explicitly published that exam schedule.
 */
const { prisma, sendSuccess, NotFoundError, BusinessRuleError } = require('../../../shared');
const { buildMarksheet } = require('../../../shared/exams/marksheet');
const { HALL_TICKET_EXAM_STATUSES, hallTicketSchedule } = require('../../../shared/exams/hallTicket');
const { notSkippedElectiveWhere } = require('../../../shared/academic/electives');
const { avatarUrl } = require('../../../shared/media/mediaUrl');
const { assertNoFeeHold } = require('../../../shared/fees/feePolicy');

const getExamSchedule = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.studentId }, select: { courseId: true } });
    if (!student) throw new NotFoundError('Student profile not found');
    // A student admitted straight into a section without a course set (common for
    // school-type institutions, where "course" isn't really a concept) has no
    // courseId to filter by — same graceful empty-list fallback used by getMySubjects,
    // rather than crashing on a null-vs-relation-filter ambiguity in Prisma.
    if (!student.courseId) return sendSuccess(res, [], 'Exam schedule retrieved successfully');

    const schedules = await prisma.examSchedule.findMany({
      // The exam schedule's own courseId is the real authority now — a subject can be
      // mapped to several classes, so this must never be inferred through the subject.
      // only papers of subjects this student takes (core subjects + their electives)
      where: { courseId: student.courseId, exam: { institutionId: req.institutionId }, subject: notSkippedElectiveWhere({ id: req.user.studentId, courseId: student.courseId }) },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { name: true, examType: true, status: true, hallTicketsReleased: true } },
      },
      orderBy: { examDate: 'asc' },
    });

    return sendSuccess(res, schedules, 'Exam schedule retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getResults = async (req, res, next) => {
  try {
    // the Fee Policy may hold results while fees are overdue
    await assertNoFeeHold(prisma, { institutionId: req.institutionId, studentId: req.user.studentId, type: 'RESULTS', forStudent: true });
    const marks = await prisma.studentMark.findMany({
      where: { studentId: req.user.studentId, examSchedule: { isPublished: true } },
      include: {
        examSchedule: {
          select: {
            maxMarks: true,
            passMarks: true,
            publishedAt: true,
            subject: { select: { name: true, code: true } },
            exam: { select: { id: true, name: true, examType: true } },
          },
        },
      },
      orderBy: { examSchedule: { examDate: 'desc' } },
    });

    return sendSuccess(res, marks, 'Results retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** The logged-in student, with what the hall ticket / marksheet header needs. */
const loadMe = (req) => prisma.student.findFirst({
  where: { id: req.user.studentId, institutionId: req.institutionId },
  select: {
    id: true, firstName: true, lastName: true, admissionNumber: true, registerNumber: true, rollNumber: true,
    dob: true, status: true, courseId: true,
    user: { select: { id: true, avatar: true } },
    section: { select: { id: true, name: true, semester: { select: { name: true, course: { select: { name: true } } } } } },
  },
});

/**
 * GET /exams/:examId/hall-ticket — the student's OWN hall ticket for one exam: their
 * details + photo and their class's paper schedule with venues. Same data the Institute
 * Admin prints per section, limited to this one student. Available while the exam is
 * SCHEDULED or ONGOING (not once it's completed/cancelled).
 */
const getHallTicket = async (req, res, next) => {
  try {
    const me = await loadMe(req);
    if (!me) throw new NotFoundError('Student profile not found');
    if (me.status !== 'ACTIVE') throw new BusinessRuleError('Hall tickets are only issued to active students. Contact the examination office.');
    if (!me.courseId || !me.section) throw new BusinessRuleError('You are not placed in a class yet, so no hall ticket can be issued. Contact the examination office.');

    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, institutionId: req.institutionId },
      select: { id: true, name: true, examType: true, status: true, hallTicketsReleased: true, startDate: true, endDate: true, academicYear: { select: { yearName: true } } },
    });
    if (!exam) throw new NotFoundError('Exam not found');
    if (!exam.hallTicketsReleased) {
      throw new BusinessRuleError(`Hall tickets for "${exam.name}" have not been released yet. Please check again later.`);
    }
    if (!HALL_TICKET_EXAM_STATUSES.includes(exam.status)) {
      throw new BusinessRuleError(`Hall tickets for "${exam.name}" are no longer available (exam is ${String(exam.status).toLowerCase()}).`);
    }
    // the Fee Policy may hold hall tickets while fees are overdue
    await assertNoFeeHold(prisma, { institutionId: req.institutionId, studentId: me.id, type: 'HALL_TICKET', forStudent: true });

    const schedule = await hallTicketSchedule(exam.id, me.courseId, req.institutionId, me.id);
    if (schedule.length === 0) throw new NotFoundError('No papers are scheduled for your class in this exam yet.');

    return sendSuccess(res, {
      exam,
      section: { id: me.section.id, name: me.section.name, className: me.section.semester?.course?.name, term: me.section.semester?.name },
      schedule,
      student: {
        id: me.id, name: `${me.firstName} ${me.lastName}`.trim(), admissionNumber: me.admissionNumber,
        registerNumber: me.registerNumber, rollNumber: me.rollNumber, dob: me.dob,
        // nested user.avatar would be rewritten too, but the template reads `photo`
        photo: me.user?.avatar ? avatarUrl(req, me.user.id, me.user.avatar) : null,
      },
    }, 'Hall ticket retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /exams/:examId/marksheet — the student's OWN marksheet: per-subject grade points,
 * PASS/FAIL, SGPA and CGPA. Only PUBLISHED subjects are included (in the CGPA too), so
 * nothing reaches a student before results are released.
 *
 * Shown only when the institution switches it on (Result Publish → "Student Mark Card",
 * InstitutionSettings.studentMarksheetEnabled, off by default). When off, this answers
 * { marksheetEnabled: false } and the Results page shows just the published marks.
 */
const getMarksheet = async (req, res, next) => {
  try {
    const settings = await prisma.institutionSettings.findUnique({
      where: { institutionId: req.institutionId },
      select: { studentMarksheetEnabled: true },
    });
    if (!settings?.studentMarksheetEnabled) {
      return sendSuccess(res, { marksheetEnabled: false }, 'Mark cards are not released to students by your institution');
    }

    const me = await loadMe(req);
    if (!me) throw new NotFoundError('Student profile not found');
    await assertNoFeeHold(prisma, { institutionId: req.institutionId, studentId: me.id, type: 'RESULTS', forStudent: true });
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, institutionId: req.institutionId },
      select: { id: true, name: true, examType: true, academicYear: { select: { yearName: true } } },
    });
    if (!exam) throw new NotFoundError('Exam not found');

    const student = {
      name: `${me.firstName} ${me.lastName}`.trim(), admissionNumber: me.admissionNumber, registerNumber: me.registerNumber,
      rollNumber: me.rollNumber, className: me.section?.semester?.course?.name || null, section: me.section?.name || null,
    };
    const sheet = await buildMarksheet({ institutionId: req.institutionId, studentId: me.id, examId: exam.id, publishedOnly: true });
    if (!sheet) {
      return sendSuccess(res, { marksheetEnabled: true, student, exam, subjects: [], sgpa: null, cgpa: null, classification: null }, 'No published results for this exam yet');
    }
    return sendSuccess(res, { marksheetEnabled: true, student, exam, ...sheet }, 'Marksheet retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExamSchedule,
  getResults,
  getHallTicket,
  getMarksheet,
};
