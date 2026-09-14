const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');
const { getGradeScale, resolveGrade, gradePointFor } = require('../../utils/grading');

/** STUDENT_MARKSHEET — the one report in this engine that is genuinely single-student by
 * nature (an official marksheet is one person's document, not a class roster), so both
 * examId and studentId are required. One row per subject scheduled under that exam, real
 * SGPA (this exam) and CGPA (every exam this student has marks for) folded into the
 * summary line — same math as the live Marksheet screen. */
module.exports = async (institutionId, filters) => {
  const { examId, studentId } = filters;
  if (!examId) throw new ValidationError('examId is required');
  if (!studentId) throw new ValidationError('studentId is required — a marksheet is always for one student');

  const student = await prisma.student.findFirst({ where: { id: studentId, institutionId }, select: { firstName: true, lastName: true, rollNumber: true } });
  if (!student) throw new ValidationError('Student not found');

  const exam = await prisma.exam.findFirst({ where: { id: examId, institutionId } });
  if (!exam) throw new ValidationError('Exam not found');

  const scale = await getGradeScale(institutionId);

  const examMarks = await prisma.studentMark.findMany({
    where: { studentId, examSchedule: { examId } },
    include: { examSchedule: { include: { subject: { select: { name: true, code: true, credits: true } } } } },
  });

  if (examMarks.length === 0) {
    return { rows: [], summary: `No marks entered yet for ${student.firstName} ${student.lastName} in "${exam.name}"` };
  }

  const rows = examMarks.map((m) => {
    if (m.isAbsent) {
      return {
        code: m.examSchedule.subject.code, subject: m.examSchedule.subject.name, credit: m.examSchedule.subject.credits,
        marksObtained: '—', maxMarks: m.examSchedule.maxMarks, grade: 'AB', result: 'ABSENT',
      };
    }
    const grade = m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks);
    return {
      code: m.examSchedule.subject.code,
      subject: m.examSchedule.subject.name,
      credit: m.examSchedule.subject.credits,
      marksObtained: m.marksObtained,
      maxMarks: m.examSchedule.maxMarks,
      grade,
      result: m.marksObtained >= m.examSchedule.passMarks ? 'PASS' : 'FAIL',
    };
  });

  const gradedRows = examMarks.filter((m) => !m.isAbsent).map((m) => ({ mark: m, grade: m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks) }));
  const sgpaCredits = gradedRows.reduce((sum, r) => sum + (gradePointFor(scale, r.grade) !== null ? r.mark.examSchedule.subject.credits : 0), 0);
  const sgpaPoints = gradedRows.reduce((sum, r) => {
    const gp = gradePointFor(scale, r.grade);
    return sum + (gp !== null ? gp * r.mark.examSchedule.subject.credits : 0);
  }, 0);
  const sgpa = sgpaCredits > 0 ? (sgpaPoints / sgpaCredits).toFixed(2) : null;

  const allMarks = await prisma.studentMark.findMany({
    where: { studentId, examSchedule: { exam: { institutionId } }, isAbsent: false },
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
  const cgpa = cgpaCredits > 0 ? (cgpaPoints / cgpaCredits).toFixed(2) : null;

  return {
    rows,
    summary: `${student.firstName} ${student.lastName} (Roll ${student.rollNumber || '—'}) — SGPA: ${sgpa ?? '—'} · CGPA: ${cgpa ?? '—'}`,
  };
};
