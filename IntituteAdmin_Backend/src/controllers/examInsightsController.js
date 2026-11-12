/**
 * Institute Admin — read-only examination insights built from real records:
 *   Subject Analysis  (per subject: appeared / passed / failed / pass %)
 *   Hall Tickets      (per student of a section, with that class's exam schedule)
 *   Progress Report   (one student: attendance + marks for an exam)
 * Every query is scoped to req.institutionId.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, attendanceRules } = require('../../../shared');

const findExam = async (examId, institutionId) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, institutionId },
    select: { id: true, name: true, examType: true, startDate: true, endDate: true, academicYear: { select: { yearName: true } } },
  });
  if (!exam) throw new NotFoundError('Exam not found or access denied');
  return exam;
};

const roomNamesById = async (roomIds, institutionId) => {
  const ids = [...new Set(roomIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const rooms = await prisma.room.findMany({ where: { id: { in: ids }, institutionId }, select: { id: true, roomNumber: true, name: true, building: { select: { name: true } } } });
  return new Map(rooms.map((r) => [r.id, [r.building?.name, r.name || r.roomNumber].filter(Boolean).join(' · ')]));
};

/** GET /exams/:examId/subject-analysis — one row per exam schedule (subject + class). */
const getSubjectAnalysis = async (req, res, next) => {
  try {
    const exam = await findExam(req.params.examId, req.institutionId);
    const schedules = await prisma.examSchedule.findMany({
      where: { examId: exam.id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true } },
        studentMarks: { select: { marksObtained: true, isAbsent: true } },
      },
      orderBy: [{ examDate: 'asc' }],
    });

    // The teacher(s) in charge = subject teachers of that subject in that class's sections
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { subjectId: { in: schedules.map((s) => s.subjectId) }, subject: { institutionId: req.institutionId } },
      select: { subjectId: true, section: { select: { semester: { select: { courseId: true } } } }, staff: { select: { firstName: true, lastName: true } } },
    });

    const rows = schedules.map((s) => {
      const present = s.studentMarks.filter((m) => !m.isAbsent);
      const passed = present.filter((m) => m.marksObtained >= s.passMarks).length;
      const teachers = [...new Set(mappings
        .filter((m) => m.subjectId === s.subjectId && (!m.section || m.section.semester?.courseId === s.courseId))
        .map((m) => `${m.staff.firstName} ${m.staff.lastName}`.trim()))];
      return {
        scheduleId: s.id,
        code: s.subject.code,
        subject: s.subject.name,
        className: s.course.name,
        teachers,
        maxMarks: s.maxMarks,
        passMarks: s.passMarks,
        appeared: present.length,
        absent: s.studentMarks.length - present.length,
        passed,
        failed: present.length - passed,
        passPct: present.length ? Number(((passed / present.length) * 100).toFixed(1)) : null,
        average: present.length ? Number((present.reduce((t, m) => t + m.marksObtained, 0) / present.length).toFixed(1)) : null,
        published: s.isPublished,
      };
    });

    return sendSuccess(res, { exam, rows }, 'Subject analysis retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /exams/:examId/hall-tickets?sectionId= — every active student of the section with
 * that class's schedule for this exam. */
const getHallTickets = async (req, res, next) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) throw new ValidationError('sectionId is required');
    const exam = await findExam(req.params.examId, req.institutionId);
    const section = await prisma.section.findFirst({
      where: { id: sectionId, semester: { course: { institutionId: req.institutionId } } },
      select: { id: true, name: true, semester: { select: { name: true, courseId: true, course: { select: { name: true } } } } },
    });
    if (!section) throw new NotFoundError('Class/section not found or access denied');

    const [institution, students, schedules] = await Promise.all([
      prisma.institution.findUnique({ where: { id: req.institutionId }, select: { name: true, code: true, logo: true, address: true, city: true } }),
      prisma.student.findMany({
        where: { sectionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNumber: true, registerNumber: true, rollNumber: true, dob: true, user: { select: { avatar: true } } },
        orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.examSchedule.findMany({
        where: { examId: exam.id, courseId: section.semester.courseId },
        include: { subject: { select: { name: true, code: true } } },
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
      }),
    ]);
    const rooms = await roomNamesById(schedules.map((s) => s.roomId), req.institutionId);

    return sendSuccess(res, {
      exam,
      institution,
      section: { id: section.id, name: section.name, className: section.semester.course.name, term: section.semester.name },
      schedule: schedules.map((s) => ({
        code: s.subject.code, subject: s.subject.name, examDate: s.examDate, startTime: s.startTime, endTime: s.endTime,
        venue: rooms.get(s.roomId) || s.roomNumber || null,
      })),
      students: students.map((st) => ({
        id: st.id, name: `${st.firstName} ${st.lastName}`.trim(), admissionNumber: st.admissionNumber,
        registerNumber: st.registerNumber, rollNumber: st.rollNumber, dob: st.dob, photo: st.user?.avatar || null,
      })),
    }, 'Hall tickets retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /students/:studentId/progress-report?examId= — attendance (whole record so far) +
 * marks for the chosen exam (every exam when none is chosen). */
const getProgressReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;
    const student = await prisma.student.findFirst({
      where: { id: studentId, institutionId: req.institutionId },
      select: {
        id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true, sectionId: true,
        section: { select: { name: true, semester: { select: { name: true, course: { select: { name: true } } } } } },
        parents: { select: { parent: { select: { fatherName: true, motherName: true, guardianName: true } } }, take: 1 },
      },
    });
    if (!student) throw new NotFoundError('Student not found or access denied');
    const exam = examId ? await findExam(examId, req.institutionId) : null;

    const [records, marks, institution] = await Promise.all([
      prisma.attendanceRecord.findMany({ where: { studentId }, select: { status: true } }),
      prisma.studentMark.findMany({
        where: { studentId, examSchedule: { exam: { institutionId: req.institutionId, ...(exam && { id: exam.id }) } } },
        include: { examSchedule: { select: { maxMarks: true, passMarks: true, examDate: true, subject: { select: { name: true, code: true } }, exam: { select: { name: true } } } } },
        orderBy: { examSchedule: { examDate: 'asc' } },
      }),
      prisma.institution.findUnique({ where: { id: req.institutionId }, select: { name: true, logo: true } }),
    ]);

    const present = records.filter((r) => attendanceRules.isAttended(r.status)).length;
    const subjects = marks.map((m) => ({
      exam: m.examSchedule.exam.name,
      code: m.examSchedule.subject.code,
      subject: m.examSchedule.subject.name,
      maxMarks: m.examSchedule.maxMarks,
      marksObtained: m.isAbsent ? null : m.marksObtained,
      absent: m.isAbsent,
      grade: m.grade,
      result: m.isAbsent ? 'ABSENT' : m.marksObtained >= m.examSchedule.passMarks ? 'PASS' : 'FAIL',
    }));
    const scored = subjects.filter((s) => !s.absent);
    const totalObtained = scored.reduce((t, s) => t + s.marksObtained, 0);
    const totalMax = scored.reduce((t, s) => t + s.maxMarks, 0);

    return sendSuccess(res, {
      institution,
      exam,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        className: student.section?.semester?.course?.name || null,
        term: student.section?.semester?.name || null,
        section: student.section?.name || null,
        parentName: student.parents[0]?.parent?.fatherName || student.parents[0]?.parent?.motherName || student.parents[0]?.parent?.guardianName || null,
      },
      attendance: { sessions: records.length, present, percent: records.length ? Number(((present / records.length) * 100).toFixed(1)) : null },
      subjects,
      totals: { obtained: totalObtained, max: totalMax, percent: totalMax ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : null },
    }, 'Progress report retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSubjectAnalysis, getHallTickets, getProgressReport };
