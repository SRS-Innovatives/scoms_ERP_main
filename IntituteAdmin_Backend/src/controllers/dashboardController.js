/**
 * Institute Admin Dashboard Controller — real aggregation queries only, no static numbers.
 */
const { prisma, sendSuccess } = require('../../../shared');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getDashboard = async (req, res, next) => {
  try {
    const institutionId = req.institutionId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [
      institution,
      totalStudents,
      totalStaff,
      totalDepartments,
      presentTodayRecords,
      overdueFeeAssignments,
      feePaymentsThisYear,
      studentsByDepartment,
      recentStudents,
      recentAnnouncements,
    ] = await Promise.all([
      prisma.institution.findUnique({ where: { id: institutionId }, select: { name: true, code: true, type: true, modules: true, logo: true } }),
      prisma.student.count({ where: { institutionId, status: 'ACTIVE' } }),
      prisma.staff.count({ where: { institutionId } }),
      prisma.department.count({ where: { institutionId } }),
      // The three aggregates below used to pull every matching row into Node (all of
      // today's attendance, every unpaid fee row ever, every payment this year) just to
      // count/sum them — the database now returns one small row each instead.
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT r."studentId")::int AS "present"
        FROM "AttendanceRecord" r
        JOIN "AttendanceSession" s ON s."id" = r."sessionId"
        WHERE s."institutionId" = ${institutionId}
          AND s."date" >= ${startOfToday} AND s."date" <= ${endOfToday}
          AND r."status" = 'PRESENT'`,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(a."dueAmount"), 0)::float AS "amount",
               COUNT(DISTINCT a."studentId")::int AS "students"
        FROM "StudentFeeAssignment" a
        JOIN "Student" st ON st."id" = a."studentId"
        WHERE st."institutionId" = ${institutionId} AND a."dueAmount" > 0`,
      prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM p."paidAt")::int AS "month",
               COALESCE(SUM(p."amountPaid"), 0)::float AS "amount"
        FROM "FeePayment" p
        WHERE p."institutionId" = ${institutionId}
          AND p."paymentStatus" = 'SUCCESS' AND p."paymentMode" <> 'CREDIT' AND p."paidAt" >= ${startOfYear}
        GROUP BY 1`,
      prisma.student.groupBy({
        by: ['departmentId'],
        where: { institutionId, status: 'ACTIVE', departmentId: { not: null } },
        _count: { id: true },
      }),
      prisma.student.findMany({
        where: { institutionId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          course: { select: { name: true } },
          section: { select: { name: true } },
          feeAssignments: { select: { status: true }, take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.announcement.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    // Today's attendance rate
    const presentToday = presentTodayRecords[0]?.present || 0;
    const attendanceRate = totalStudents > 0 ? Number(((presentToday / totalStudents) * 100).toFixed(1)) : 0;

    // Pending fees
    const pendingFeesAmount = overdueFeeAssignments[0]?.amount || 0;
    const studentsOverdueCount = overdueFeeAssignments[0]?.students || 0;

    // Monthly fee collection trend (Jan..current month, this calendar year)
    const monthlyTotals = Array(12).fill(0);
    feePaymentsThisYear.forEach((p) => {
      monthlyTotals[p.month - 1] += p.amount;
    });
    const currentMonth = new Date().getMonth();
    const monthlyCollection = monthlyTotals
      .slice(0, currentMonth + 1)
      .map((amount, idx) => ({ month: MONTH_LABELS[idx], amount: Number(amount.toFixed(2)) }));

    // Department distribution
    const departmentIds = studentsByDepartment.map((g) => g.departmentId).filter(Boolean);
    const departments = departmentIds.length
      ? await prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
      : [];
    const deptNameMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
    const departmentDistribution = studentsByDepartment.map((g) => ({
      department: deptNameMap[g.departmentId] || 'Unassigned',
      count: g._count.id,
    }));

    // Recent students (for the dashboard directory preview)
    const recentStudentsList = recentStudents.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      rollNo: s.rollNumber,
      course: s.course?.name || '—',
      section: s.section?.name || '—',
      phone: s.phone,
      feeStatus: s.feeAssignments[0]?.status || 'N/A',
    }));

    const stats = {
      institution,
      totalStudents,
      totalStaff,
      totalDepartments,
      todayAttendance: { present: presentToday, total: totalStudents, rate: attendanceRate },
      pendingFees: { amount: Number(pendingFeesAmount.toFixed(2)), studentsOverdue: studentsOverdueCount },
      monthlyCollection,
      departmentDistribution,
      recentStudents: recentStudentsList,
      announcements: recentAnnouncements,
    };

    return sendSuccess(res, stats, 'Dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
