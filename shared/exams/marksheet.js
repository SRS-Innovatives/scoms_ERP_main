/**
 * Marksheet calculation — one source for the Institute Admin marksheet and the student's
 * own marksheet, so grade points / SGPA / CGPA can never differ between portals.
 *
 *   subjects  — per subject: marks, grade, grade point, PASS/FAIL/ABSENT
 *   sgpa      — credit-weighted grade points for this exam (absent subjects excluded)
 *   cgpa      — the same across every exam the student has marks for
 *
 * Internal + external: an EXTERNAL exam may list the INTERNAL exams that count towards it
 * (Exam.internalExamIds). When the institution's academic settings enable internal
 * assessment (regulations.internalAssessmentEnabled + internalAssessmentWeight, e.g. 25),
 * each subject's FINAL % = average internal % × weight + external % × (100 − weight); the
 * grade, grade point, PASS/FAIL, SGPA and CGPA come from the final %. A subject with no
 * internal marks counts its external % alone. INTERNAL exams are not counted separately in
 * the CGPA (they are already inside the finals). GENERAL exams work exactly as before.
 *
 * publishedOnly: the student portal passes true so unpublished marks (internal or
 * external) never reach a student. The admin passes false.
 */
const prisma = require('../database/client');
const { getGradeScale, resolveGrade, gradePointFor } = require('../utils/grading');
const { getInstitutionAcademicStructure } = require('../academic/institutionAcademic');

const round2 = (n) => Math.round(n * 100) / 100;

const classify = (sgpa) => (sgpa === null ? null
  : sgpa >= 9 ? 'FIRST CLASS WITH DISTINCTION'
  : sgpa >= 7 ? 'FIRST CLASS'
  : sgpa >= 6 ? 'SECOND CLASS'
  : sgpa >= 5 ? 'PASS CLASS'
  : 'FAIL');

/** { weight, ids } when this exam's result combines internals, else null. */
const combinationFor = async (exam, institutionId) => {
  if (exam?.assessmentType !== 'EXTERNAL' || !Array.isArray(exam.internalExamIds) || exam.internalExamIds.length === 0) return null;
  const { regulations } = await getInstitutionAcademicStructure(institutionId);
  const weight = Number(regulations?.internalAssessmentWeight);
  if (!regulations?.internalAssessmentEnabled || !(weight > 0) || weight >= 100) return null;
  return { weight, ids: exam.internalExamIds };
};

/** One exam's subject rows for one student (null when there are no visible marks). */
const examSubjects = async ({ institutionId, studentId, examId, published, scale }) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { assessmentType: true, internalExamIds: true } });
  const examMarks = await prisma.studentMark.findMany({
    where: { studentId, examSchedule: { examId, ...published } },
    include: { examSchedule: { include: { subject: { select: { name: true, code: true, credits: true } } } } },
  });
  if (examMarks.length === 0) return null;

  const combine = await combinationFor(exam, institutionId);
  let internalBySubject = new Map();
  if (combine) {
    const internals = await prisma.studentMark.findMany({
      where: { studentId, isAbsent: false, examSchedule: { examId: { in: combine.ids }, ...published } },
      select: { marksObtained: true, examSchedule: { select: { subjectId: true, maxMarks: true } } },
    });
    const acc = new Map();
    internals.forEach((m) => {
      if (!(m.examSchedule.maxMarks > 0)) return;
      const list = acc.get(m.examSchedule.subjectId) || [];
      list.push((m.marksObtained / m.examSchedule.maxMarks) * 100);
      acc.set(m.examSchedule.subjectId, list);
    });
    internalBySubject = new Map([...acc].map(([k, v]) => [k, round2(v.reduce((s, x) => s + x, 0) / v.length)]));
  }

  return examMarks.map((m) => {
    const base = { code: m.examSchedule.subject.code, title: m.examSchedule.subject.name, credit: m.examSchedule.subject.credits };
    // An absence never earns (or loses) a grade point — it's shown as "AB" and simply
    // excluded from both SGPA and CGPA credit-weighting.
    if (m.isAbsent) {
      return { ...base, marksObtained: null, maxMarks: m.examSchedule.maxMarks, grade: 'AB', gradePoint: null, result: 'ABSENT' };
    }
    if (!combine) {
      const grade = m.grade || resolveGrade(scale, m.marksObtained, m.examSchedule.maxMarks);
      return {
        ...base,
        marksObtained: m.marksObtained,
        maxMarks: m.examSchedule.maxMarks,
        grade,
        gradePoint: gradePointFor(scale, grade),
        result: m.marksObtained >= m.examSchedule.passMarks ? 'PASS' : 'FAIL',
      };
    }
    const externalPercent = m.examSchedule.maxMarks > 0 ? round2((m.marksObtained / m.examSchedule.maxMarks) * 100) : 0;
    const internalPercent = internalBySubject.has(m.examSchedule.subjectId) ? internalBySubject.get(m.examSchedule.subjectId) : null;
    const finalPercent = internalPercent === null
      ? externalPercent
      : round2((internalPercent * combine.weight) / 100 + (externalPercent * (100 - combine.weight)) / 100);
    const grade = resolveGrade(scale, finalPercent, 100);
    const passPercent = m.examSchedule.maxMarks > 0 ? (m.examSchedule.passMarks / m.examSchedule.maxMarks) * 100 : 35;
    return {
      ...base,
      marksObtained: m.marksObtained,
      maxMarks: m.examSchedule.maxMarks,
      internalPercent,
      externalPercent,
      finalPercent,
      internalWeight: combine.weight,
      grade,
      gradePoint: gradePointFor(scale, grade),
      result: finalPercent >= passPercent ? 'PASS' : 'FAIL',
    };
  });
};

const creditWeighted = (subjects) => {
  let credits = 0;
  let points = 0;
  subjects.forEach((s) => {
    if (s.gradePoint !== null && s.gradePoint !== undefined) {
      credits += s.credit;
      points += s.gradePoint * s.credit;
    }
  });
  return { credits, points };
};

/** Returns null when the student has no (visible) marks in this exam. */
const buildMarksheet = async ({ institutionId, studentId, examId, publishedOnly = false }) => {
  const published = publishedOnly ? { isPublished: true } : {};
  const scale = await getGradeScale(institutionId);

  const subjects = await examSubjects({ institutionId, studentId, examId, published, scale });
  if (!subjects) return null;

  const s = creditWeighted(subjects);
  const sgpa = s.credits > 0 ? Number((s.points / s.credits).toFixed(2)) : null;

  // CGPA — every (non-internal) exam this student has any visible marks for, credit-weighted
  // on each exam's own subject results (finals for combined exams).
  const exams = await prisma.studentMark.findMany({
    where: { studentId, examSchedule: { exam: { institutionId, assessmentType: { not: 'INTERNAL' } }, ...published } },
    select: { examSchedule: { select: { examId: true } } },
    distinct: ['examScheduleId'],
  });
  let cgpaCredits = 0;
  let cgpaPoints = 0;
  for (const id of [...new Set(exams.map((e) => e.examSchedule.examId))]) {
    const rows = id === examId ? subjects : await examSubjects({ institutionId, studentId, examId: id, published, scale });
    if (!rows) continue;
    const c = creditWeighted(rows);
    cgpaCredits += c.credits;
    cgpaPoints += c.points;
  }
  const cgpa = cgpaCredits > 0 ? Number((cgpaPoints / cgpaCredits).toFixed(2)) : null;

  return { subjects, sgpa, cgpa, classification: classify(sgpa) };
};

module.exports = { buildMarksheet };
