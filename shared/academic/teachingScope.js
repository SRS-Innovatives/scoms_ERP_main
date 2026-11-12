/**
 * Teaching scope — WHO may work with WHICH students, the single source every Staff
 * module (web portal and mobile app alike, both call Staff_backend) uses.
 *
 * Built only from system ids, never names:
 *   - Subject teacher  = a SubjectTeacherMapping row (staffId + subjectId + sectionId),
 *                        set by the Institute Admin under Staff -> Teacher Assignments.
 *                        A legacy row with no sectionId means "this subject in every class".
 *   - Class teacher    = Section.classTeacherId.
 *   - HOD              = may VIEW every section of their own department.
 *   - Principal / VP   = may VIEW every section of the institution.
 * Viewing is broad (above); WRITING is narrow:
 *   - subject attendance + marks -> only the subject teacher of that subject in that class
 *     (or the approved substitute, for that one class, on that day)
 *   - daily attendance + student leave approval -> only the class teacher
 */
const prisma = require('../database/client');
const { ROLES } = require('../constants/roles');
const { NotFoundError, AuthorizationError, ValidationError } = require('../errors/customErrors');

const SCHOOL_WIDE_VIEW_ROLES = [ROLES.PRINCIPAL, ROLES.VICE_PRINCIPAL];

/** Everything a staff member is assigned to — one query set per request. */
const getStaffScope = async (user, institutionId) => {
  const staffId = user?.staffId;
  if (!staffId) throw new AuthorizationError('This account is not linked to a staff profile');
  const [staff, assignments, classTeacherSections] = await Promise.all([
    prisma.staff.findFirst({ where: { id: staffId, institutionId }, select: { id: true, departmentId: true } }),
    prisma.subjectTeacherMapping.findMany({
      where: { staffId, subject: { institutionId } },
      select: { subjectId: true, sectionId: true, section: { select: { semester: { select: { courseId: true } } } } },
    }),
    prisma.section.findMany({
      where: { classTeacherId: staffId, semester: { course: { institutionId } } },
      select: { id: true },
    }),
  ]);
  if (!staff) throw new AuthorizationError('This account is not linked to a staff profile');
  return {
    staffId,
    role: user.role,
    departmentId: staff.departmentId,
    assignments: assignments.map((a) => ({ subjectId: a.subjectId, sectionId: a.sectionId, courseId: a.section?.semester?.courseId || null })),
    classTeacherSectionIds: classTeacherSections.map((s) => s.id),
    viewsWholeInstitution: SCHOOL_WIDE_VIEW_ROLES.includes(user.role),
  };
};

/** The section, only if it belongs to this institution (else 404 — never another tenant's). */
const getSectionInInstitution = async (sectionId, institutionId) => {
  if (!sectionId) throw new ValidationError('sectionId is required');
  const section = await prisma.section.findFirst({
    where: { id: sectionId, semester: { course: { institutionId } } },
    select: { id: true, name: true, classTeacherId: true, semester: { select: { courseId: true, course: { select: { departmentId: true } } } } },
  });
  if (!section) throw new NotFoundError('Class/section not found or access denied');
  return section;
};

const teachesSubjectInSection = (scope, subjectId, sectionId) =>
  scope.assignments.some((a) => a.subjectId === subjectId && (a.sectionId === sectionId || a.sectionId === null));

const isClassTeacherOf = (scope, sectionId) => scope.classTeacherSectionIds.includes(sectionId);

/** May this staff member SEE this section's students and records? */
const canViewSection = (scope, section) =>
  scope.viewsWholeInstitution
  || isClassTeacherOf(scope, section.id)
  || scope.assignments.some((a) => a.sectionId === section.id || a.sectionId === null)
  || (scope.role === ROLES.HOD && !!scope.departmentId && section.semester?.course?.departmentId === scope.departmentId);

const assertCanViewSection = async (user, institutionId, sectionId) => {
  const [scope, section] = await Promise.all([getStaffScope(user, institutionId), getSectionInInstitution(sectionId, institutionId)]);
  if (!canViewSection(scope, section)) throw new AuthorizationError('You are not assigned to this class');
  return { scope, section };
};

const dateOnly = (d) => {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

/** An APPROVED substitute duty for this staff member, this class (and subject), this day. */
const isApprovedSubstitute = async ({ staffId, institutionId, sectionId, subjectId, date }) => {
  const cover = await prisma.substituteRequest.findFirst({
    where: {
      institutionId,
      substituteStaffId: staffId,
      status: 'APPROVED',
      date: dateOnly(date),
      entry: { timetable: { sectionId }, ...(subjectId && { subjectId }) },
    },
    select: { id: true },
  });
  return !!cover;
};

/**
 * Recording attendance:
 *   with a subject -> the subject teacher of that subject in that class, or that day's approved substitute
 *   without a subject (daily attendance) -> the class teacher
 */
const assertCanRecordAttendance = async (user, institutionId, { sectionId, subjectId, date }) => {
  const [scope, section] = await Promise.all([getStaffScope(user, institutionId), getSectionInInstitution(sectionId, institutionId)]);
  if (subjectId) {
    if (teachesSubjectInSection(scope, subjectId, section.id)) return { scope, section };
    if (await isApprovedSubstitute({ staffId: scope.staffId, institutionId, sectionId: section.id, subjectId, date })) return { scope, section };
    throw new AuthorizationError('You are not assigned to teach this subject in this class');
  }
  if (isClassTeacherOf(scope, section.id)) return { scope, section };
  throw new AuthorizationError('Only the class teacher can take daily attendance for this class');
};

/** Every student id in the submission must be an active student of this section. */
const assertStudentsInSection = async (studentIds, sectionId) => {
  const ids = [...new Set((studentIds || []).filter(Boolean))];
  if (ids.length === 0) return;
  const found = await prisma.student.count({ where: { id: { in: ids }, sectionId } });
  if (found !== ids.length) {
    throw new ValidationError(`${ids.length - found} of the submitted student(s) are not in this class`);
  }
};

/**
 * Marks for an exam schedule (one subject, one course/class): the sections of that
 * course where this staff member teaches that subject. Returns the student filter to use
 * for roster / save / import; throws when they teach that subject in none of them.
 */
const getMarkableStudentFilter = async (user, institutionId, schedule) => {
  const scope = await getStaffScope(user, institutionId);
  const forSubject = scope.assignments.filter((a) => a.subjectId === schedule.subjectId);
  if (forSubject.some((a) => a.sectionId === null)) {
    return { scope, where: { courseId: schedule.courseId, status: 'ACTIVE' } }; // legacy subject-wide assignment
  }
  const sectionIds = forSubject.filter((a) => a.courseId === schedule.courseId).map((a) => a.sectionId);
  if (sectionIds.length === 0) throw new AuthorizationError('You are not assigned to teach this subject for this class');
  return { scope, where: { courseId: schedule.courseId, status: 'ACTIVE', sectionId: { in: sectionIds } } };
};

/** Every student in a marks submission must be one this staff member may mark. */
const assertStudentsMarkable = async (studentIds, where) => {
  const ids = [...new Set((studentIds || []).filter(Boolean))];
  if (ids.length === 0) return;
  const found = await prisma.student.count({ where: { ...where, id: { in: ids } } });
  if (found !== ids.length) {
    throw new AuthorizationError(`${ids.length - found} of the submitted student(s) are not in a class you teach this subject to`);
  }
};

/**
 * Sections whose student leave this staff member may decide on:
 *   class teacher -> their own section(s); Principal/VP -> all; HOD -> their department.
 * Empty array = none (not a class teacher).
 */
const getLeaveApprovalSectionIds = async (user, institutionId) => {
  const scope = await getStaffScope(user, institutionId);
  if (scope.viewsWholeInstitution) {
    return (await prisma.section.findMany({ where: { semester: { course: { institutionId } } }, select: { id: true } })).map((s) => s.id);
  }
  const ids = new Set(scope.classTeacherSectionIds);
  if (scope.role === ROLES.HOD && scope.departmentId) {
    (await prisma.section.findMany({ where: { semester: { course: { institutionId, departmentId: scope.departmentId } } }, select: { id: true } }))
      .forEach((s) => ids.add(s.id));
  }
  return [...ids];
};

module.exports = {
  getStaffScope,
  getSectionInInstitution,
  teachesSubjectInSection,
  isClassTeacherOf,
  canViewSection,
  assertCanViewSection,
  assertCanRecordAttendance,
  assertStudentsInSection,
  getMarkableStudentFilter,
  assertStudentsMarkable,
  getLeaveApprovalSectionIds,
};
