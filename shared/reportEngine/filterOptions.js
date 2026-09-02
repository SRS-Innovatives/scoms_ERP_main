const prisma = require('../database/client');

/**
 * Resolves the live option list for a dynamic filter's `source`, always scoped to the
 * caller's own institution. `context` carries the already-selected value of whichever
 * filter this one `dependsOn`, so cascading dropdowns (Department → Course → Semester →
 * Section → Subject/Student) never leak records from an unrelated branch.
 */
const resolveFilterOptions = async (source, institutionId, context = {}) => {
  switch (source) {
    case 'ACADEMIC_YEAR': {
      const rows = await prisma.academicYear.findMany({ where: { institutionId }, orderBy: { startDate: 'desc' } });
      return rows.map((r) => ({ value: r.id, label: r.yearName }));
    }
    case 'DEPARTMENT': {
      const rows = await prisma.department.findMany({ where: { institutionId }, orderBy: { name: 'asc' } });
      return rows.map((r) => ({ value: r.id, label: r.name }));
    }
    case 'COURSE': {
      const rows = await prisma.course.findMany({
        where: { institutionId, ...(context.departmentId && { departmentId: context.departmentId }) },
        orderBy: { name: 'asc' },
      });
      return rows.map((r) => ({ value: r.id, label: r.name }));
    }
    case 'SEMESTER': {
      const rows = await prisma.semester.findMany({
        where: { course: { institutionId }, ...(context.courseId && { courseId: context.courseId }) },
        include: { course: { select: { name: true } } },
        orderBy: { semesterNumber: 'asc' },
      });
      return rows.map((r) => ({ value: r.id, label: `${r.course.name} — ${r.name}` }));
    }
    case 'SECTION': {
      const rows = await prisma.section.findMany({
        where: {
          semester: { course: { institutionId } },
          ...(context.semesterId && { semesterId: context.semesterId }),
        },
        include: { semester: { select: { name: true, course: { select: { name: true } } } } },
        orderBy: { name: 'asc' },
      });
      return rows.map((r) => ({ value: r.id, label: `${r.semester.course.name} — ${r.semester.name} — ${r.name}` }));
    }
    case 'SUBJECT': {
      const rows = await prisma.subject.findMany({
        where: { course: { institutionId }, ...(context.courseId && { courseId: context.courseId }) },
        orderBy: { name: 'asc' },
      });
      return rows.map((r) => ({ value: r.id, label: r.name }));
    }
    case 'STUDENT': {
      const rows = await prisma.student.findMany({
        where: { institutionId, status: 'ACTIVE', ...(context.sectionId && { sectionId: context.sectionId }) },
        select: { id: true, firstName: true, lastName: true, rollNumber: true },
        orderBy: { rollNumber: 'asc' },
        take: 200,
      });
      return rows.map((r) => ({ value: r.id, label: `${r.firstName} ${r.lastName} (${r.rollNumber || '—'})` }));
    }
    case 'STAFF': {
      const rows = await prisma.staff.findMany({
        where: { institutionId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
        orderBy: { firstName: 'asc' },
        take: 200,
      });
      return rows.map((r) => ({ value: r.id, label: `${r.firstName} ${r.lastName} (${r.employeeCode})` }));
    }
    case 'EXAM': {
      const rows = await prisma.exam.findMany({ where: { institutionId }, orderBy: { startDate: 'desc' } });
      return rows.map((r) => ({ value: r.id, label: `${r.name} (${r.examType})` }));
    }
    case 'PAYMENT_MODE':
      return ['CASH', 'CHEQUE', 'DD', 'BANK_TRANSFER', 'UPI_MANUAL', 'RAZORPAY', 'ONLINE_CARD', 'OTHER'].map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));
    case 'STATUS':
      return ['ACTIVE', 'INACTIVE'].map((v) => ({ value: v, label: v }));
    default:
      return [];
  }
};

module.exports = { resolveFilterOptions };
