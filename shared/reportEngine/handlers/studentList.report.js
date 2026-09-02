const prisma = require('../../database/client');

/** STUDENT_LIST — real student directory, filterable by department/course/section/status. */
module.exports = async (institutionId, filters) => {
  const { departmentId, courseId, sectionId, status } = filters;

  const students = await prisma.student.findMany({
    where: {
      institutionId,
      ...(departmentId && { departmentId }),
      ...(courseId && { courseId }),
      ...(sectionId && { sectionId }),
      ...(status && { status }),
    },
    include: {
      department: { select: { name: true } },
      course: { select: { name: true } },
      section: { select: { name: true, semester: { select: { name: true } } } },
    },
    orderBy: { rollNumber: 'asc' },
  });

  const rows = students.map((s) => ({
    admissionNumber: s.admissionNumber,
    name: `${s.firstName} ${s.lastName}`,
    department: s.department?.name || '—',
    course: s.course?.name || '—',
    semester: s.section?.semester?.name || '—',
    section: s.section?.name || '—',
    phone: s.phone || '—',
    email: s.email,
    status: s.status,
  }));

  return { rows, summary: `${rows.length} student(s) found` };
};
