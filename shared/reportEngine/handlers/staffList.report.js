const prisma = require('../../database/client');

/** STAFF_LIST — real staff directory, filterable by department/status. */
module.exports = async (institutionId, filters) => {
  const { departmentId, status } = filters;

  const staff = await prisma.staff.findMany({
    where: {
      institutionId,
      ...(departmentId && { departmentId }),
      ...(status && { status }),
    },
    include: {
      department: { select: { name: true } },
      user: { select: { email: true } },
    },
    orderBy: { firstName: 'asc' },
  });

  const rows = staff.map((s) => ({
    employeeCode: s.employeeCode,
    name: `${s.firstName} ${s.lastName}`,
    department: s.department?.name || '—',
    designation: s.designation,
    email: s.user?.email || '—',
    phone: s.altPhone || '—',
    status: s.status,
  }));

  return { rows, summary: `${rows.length} staff member(s) found` };
};
