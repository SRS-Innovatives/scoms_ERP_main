/**
 * Elective subjects — who takes a subject in a class.
 *
 * A subject mapped to a class (SubjectClassMapping) is either CORE (isElective = false —
 * every student of the class takes it) or ELECTIVE (only the students the admin allotted
 * it to, StudentElective rows). Every place that lists "the students of a subject" or
 * "the subjects of a student" uses these helpers, so attendance, marks, exam schedules,
 * hall tickets and the student's own subject list always agree.
 */

/** Prisma `where` on Student: the students of `courseId` who take `subjectId`.
 * {} for a core subject (no extra filter), a "chose it" filter for an elective. */
const electiveStudentFilter = async (db, subjectId, courseId) => {
  if (!subjectId || !courseId) return {};
  const m = await db.subjectClassMapping.findFirst({ where: { subjectId, courseId, isElective: true }, select: { id: true } });
  return m ? { electives: { some: { subjectId } } } : {};
};

/** Same, when the class is given as a section (attendance works per section). */
const electiveStudentFilterForSection = async (db, subjectId, sectionId) => {
  if (!subjectId || !sectionId) return {};
  const section = await db.section.findUnique({ where: { id: sectionId }, select: { semester: { select: { courseId: true } } } });
  return electiveStudentFilter(db, subjectId, section?.semester?.courseId);
};

/** Prisma `where` on Subject: the subjects this student takes in their class —
 * every core subject of the class, plus the electives they were allotted. */
const studentSubjectWhere = (student) => ({
  classMappings: {
    some: {
      courseId: student.courseId,
      OR: [{ isElective: false }, { subject: { electives: { some: { studentId: student.id } } } }],
    },
  },
});

/** Prisma `where` on Subject for exam papers of the student's class: everything EXCEPT an
 * elective of this class the student didn't choose. (Exam papers were never limited to
 * mapped subjects, so unlike studentSubjectWhere this doesn't require a class mapping.) */
const notSkippedElectiveWhere = (student) => ({
  NOT: {
    classMappings: { some: { courseId: student.courseId, isElective: true } },
    electives: { none: { studentId: student.id } },
  },
});

module.exports = { electiveStudentFilter, electiveStudentFilterForSection, studentSubjectWhere, notSkippedElectiveWhere };
