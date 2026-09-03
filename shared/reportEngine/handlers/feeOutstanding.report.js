const prisma = require('../../database/client');

/** FEE_OUTSTANDING — students with a due balance above an optional minimum threshold. */
module.exports = async (institutionId, filters) => {
  const { courseId, sectionId, minimumOutstanding } = filters;
  const threshold = minimumOutstanding ? Number(minimumOutstanding) : 0;

  const assignments = await prisma.studentFeeAssignment.findMany({
    where: {
      dueAmount: { gt: threshold },
      student: {
        institutionId,
        ...(courseId && { courseId }),
        ...(sectionId && { sectionId }),
      },
    },
    include: {
      student: {
        select: {
          firstName: true, lastName: true, rollNumber: true,
          course: { select: { name: true } },
          section: { select: { name: true } },
          parents: { include: { parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } } } },
        },
      },
      feeStructure: { select: { category: true } },
    },
    orderBy: { dueAmount: 'desc' },
  });

  const totalOutstanding = assignments.reduce((sum, a) => sum + a.dueAmount, 0);
  const rows = assignments.map((a) => ({
    name: `${a.student.firstName} ${a.student.lastName}`,
    rollNumber: a.student.rollNumber,
    course: a.student.course?.name || '—',
    section: a.student.section?.name || '—',
    category: a.feeStructure?.category || '—',
    totalFee: a.totalAmount,
    paid: a.paidAmount,
    outstanding: a.dueAmount,
    parentPhone: a.student.parents[0]?.parent?.fatherPhone || a.student.parents[0]?.parent?.motherPhone || a.student.parents[0]?.parent?.guardianPhone || '—',
  }));

  return { rows, summary: `${rows.length} assignment(s), ₹${totalOutstanding.toLocaleString()} total outstanding` };
};
