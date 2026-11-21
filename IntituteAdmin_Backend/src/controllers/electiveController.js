/**
 * Institute Admin — Elective Allotment.
 *
 * A subject marked ELECTIVE for a class (Subject Setup → class mapping) is taken only by
 * the students allotted to it here (StudentElective). Attendance, marks, exam schedules,
 * hall tickets and the student's own subject list all follow this
 * (shared/academic/electives.js).
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

/** GET /electives?courseId= — the electives of one class, with how many students take each. */
const getElectives = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    if (!courseId) throw new ValidationError('courseId is required');
    const course = await prisma.course.findFirst({ where: { id: courseId, institutionId: req.institutionId }, select: { id: true, name: true } });
    if (!course) throw new NotFoundError('Class not found');
    const mappings = await prisma.subjectClassMapping.findMany({
      where: { courseId, isElective: true },
      include: { subject: { select: { id: true, code: true, name: true } } },
      orderBy: { subject: { name: 'asc' } },
    });
    const counts = await prisma.studentElective.groupBy({
      by: ['subjectId'],
      where: { subjectId: { in: mappings.map((m) => m.subjectId) }, student: { courseId } },
      _count: { _all: true },
    });
    const byId = Object.fromEntries(counts.map((c) => [c.subjectId, c._count._all]));
    const totalStudents = await prisma.student.count({ where: { courseId, status: 'ACTIVE', institutionId: req.institutionId } });
    return sendSuccess(res, {
      course,
      totalStudents,
      electives: mappings.map((m) => ({ ...m.subject, students: byId[m.subjectId] || 0 })),
    }, 'Electives retrieved');
  } catch (err) {
    next(err);
  }
};

const assertElective = async (subjectId, courseId, institutionId) => {
  if (!courseId) throw new ValidationError('courseId is required');
  const m = await prisma.subjectClassMapping.findFirst({
    where: { subjectId, courseId, isElective: true, subject: { institutionId } },
    include: { subject: { select: { name: true } }, course: { select: { name: true } } },
  });
  if (!m) throw new NotFoundError('This subject is not an elective for that class — mark it as an elective in Subject Setup first');
  return m;
};

/** GET /electives/:subjectId/students?courseId= — every active student of the class, with whether they take it. */
const getElectiveStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { courseId } = req.query;
    const m = await assertElective(subjectId, courseId, req.institutionId);
    const students = await prisma.student.findMany({
      where: { courseId, status: 'ACTIVE', institutionId: req.institutionId },
      select: {
        id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true,
        section: { select: { name: true } },
        electives: { where: { subjectId }, select: { id: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { rollNumber: 'asc' }, { firstName: 'asc' }],
    });
    return sendSuccess(res, {
      subject: { id: subjectId, name: m.subject.name },
      course: { id: courseId, name: m.course.name },
      students: students.map((s) => ({ ...s, electives: undefined, takes: s.electives.length > 0 })),
    }, 'Elective students retrieved');
  } catch (err) {
    next(err);
  }
};

/** PUT /electives/:subjectId/students { courseId, studentIds } — sets exactly which students of the class take it. */
const setElectiveStudents = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { courseId, studentIds } = req.body;
    if (!Array.isArray(studentIds)) throw new ValidationError('studentIds must be a list');
    const m = await assertElective(subjectId, courseId, req.institutionId);
    const valid = await prisma.student.findMany({
      where: { id: { in: studentIds }, courseId, institutionId: req.institutionId },
      select: { id: true },
    });
    if (valid.length !== new Set(studentIds).size) throw new ValidationError('Some of the selected students are not in this class');
    const ids = valid.map((v) => v.id);

    await prisma.$transaction([
      // drop students of THIS class who no longer take it (other classes are untouched)
      prisma.studentElective.deleteMany({ where: { subjectId, student: { courseId }, studentId: { notIn: ids } } }),
      prisma.studentElective.createMany({
        data: ids.map((studentId) => ({ institutionId: req.institutionId, studentId, subjectId })),
        skipDuplicates: true,
      }),
    ]);
    prisma.auditLog.create({
      data: { institutionId: req.institutionId, userId: req.user.id, action: 'ELECTIVE_ALLOTTED', module: 'ACADEMICS', entity: 'Subject', entityId: subjectId, newValues: JSON.stringify({ courseId, students: ids.length }) },
    }).catch(() => {});
    return sendSuccess(res, { subjectId, courseId, students: ids.length }, `${ids.length} student(s) now take ${m.subject.name} in ${m.course.name}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getElectives, getElectiveStudents, setElectiveStudents };
