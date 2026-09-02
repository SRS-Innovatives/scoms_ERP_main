const prisma = require('../../database/client');

/** INSTITUTION_SUMMARY — top-level real counts for the whole institution, no filters. */
module.exports = async (institutionId) => {
  const [
    totalStudents,
    activeStudents,
    totalStaff,
    activeStaff,
    totalCourses,
    totalSections,
    totalDepartments,
    feeAgg,
  ] = await Promise.all([
    prisma.student.count({ where: { institutionId } }),
    prisma.student.count({ where: { institutionId, status: 'ACTIVE' } }),
    prisma.staff.count({ where: { institutionId } }),
    prisma.staff.count({ where: { institutionId, status: 'ACTIVE' } }),
    prisma.course.count({ where: { institutionId } }),
    prisma.section.count({ where: { semester: { course: { institutionId } } } }),
    prisma.department.count({ where: { institutionId } }),
    prisma.feePayment.aggregate({ where: { institutionId, paymentStatus: 'SUCCESS' }, _sum: { amountPaid: true } }),
  ]);

  const totalOutstandingAgg = await prisma.studentFeeAssignment.aggregate({
    where: { student: { institutionId } },
    _sum: { dueAmount: true },
  });

  const rows = [
    { metric: 'Total Students', value: totalStudents },
    { metric: 'Active Students', value: activeStudents },
    { metric: 'Total Staff', value: totalStaff },
    { metric: 'Active Staff', value: activeStaff },
    { metric: 'Total Departments', value: totalDepartments },
    { metric: 'Total Courses', value: totalCourses },
    { metric: 'Total Sections', value: totalSections },
    { metric: 'Total Fee Collected (All Time)', value: `₹${(feeAgg._sum.amountPaid || 0).toLocaleString()}` },
    { metric: 'Total Fee Outstanding', value: `₹${(totalOutstandingAgg._sum.dueAmount || 0).toLocaleString()}` },
  ];

  return { rows, summary: 'Institution-wide summary' };
};
