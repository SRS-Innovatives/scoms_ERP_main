/**
 * Super Admin Analytics Controller
 */
const { prisma, sendSuccess, resolveEnabledModules, MODULE_CATALOG } = require('../../../shared');

// Onboarding lets admins free-type a state name, so "Tamil Nadu" and "tamil nadu" land as
// distinct DB rows — normalize casing here so the dashboard groups them as one state without
// having to touch the stored records.
const normalizeState = (state) => {
  const trimmed = (state || 'Other').trim();
  return trimmed.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const getAnalytics = async (req, res, next) => {
  try {
    const [
      institutions,
      users,
      totalStudents,
      totalStaff,
      paidInvoices,
      studentsByInstitution
    ] = await Promise.all([
      prisma.institution.findMany(),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.student.count(),
      prisma.staff.count(),
      prisma.invoice.findMany({ where: { status: 'PAID' }, select: { totalAmount: true, createdAt: true, planName: true, institutionId: true } }),
      prisma.student.groupBy({ by: ['institutionId'], _count: { _all: true } })
    ]);

    // Calculate Institution status breakdown
    let totalInstitutions = institutions.length;
    let activeInstitutions = 0;
    let trialInstitutions = 0;
    let suspendedInstitutions = 0;

    institutions.forEach(inst => {
      if (inst.status === 'ACTIVE') {
        if (inst.planName && inst.planName.toLowerCase().includes('trial')) {
          trialInstitutions++;
        } else {
          activeInstitutions++;
        }
      } else if (inst.status === 'SUSPENDED') {
        suspendedInstitutions++;
      }
    });

    // Generate last 6 months keys dynamically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        label: `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`,
        value: 0
      });
    }

    // 1. Institution Growth Trajectory (cumulative or new count by month)
    const instGrowthTracker = last6Months.map(m => ({ ...m, value: 0 }));
    institutions.forEach(inst => {
      const cDate = new Date(inst.createdAt);
      instGrowthTracker.forEach(m => {
        if (cDate.getMonth() === m.monthIndex && cDate.getFullYear() === m.year) {
          m.value++;
        }
      });
    });
    const institutionGrowth = instGrowthTracker.map(m => ({ label: m.label, value: m.value }));

    // 2. Platform User Growth by Month
    const userGrowthTracker = last6Months.map(m => ({ ...m, value: 0 }));
    users.forEach(u => {
      const cDate = new Date(u.createdAt);
      userGrowthTracker.forEach(m => {
        if (cDate.getMonth() === m.monthIndex && cDate.getFullYear() === m.year) {
          m.value++;
        }
      });
    });
    const userGrowth = userGrowthTracker.map(m => ({ label: m.label, value: m.value }));

    // 3. Monthly Recurring Revenue by Month (Sum of Paid Invoices)
    const revenueTracker = last6Months.map(m => ({ ...m, value: 0 }));
    paidInvoices.forEach(inv => {
      const cDate = new Date(inv.createdAt);
      revenueTracker.forEach(m => {
        if (cDate.getMonth() === m.monthIndex && cDate.getFullYear() === m.year) {
          m.value += inv.totalAmount;
        }
      });
    });
    const revenueMonthly = revenueTracker.map(m => ({ label: m.label, value: m.value }));

    // 4. State-wise Distribution Ranking
    const stateCounts = {};
    institutions.forEach(inst => {
      const state = normalizeState(inst.state);
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });
    const stateDistribution = Object.keys(stateCounts).map(state => ({
      label: state,
      value: stateCounts[state]
    })).sort((a, b) => b.value - a.value);

    // 4b. Full state breakdown table — institutions, active students, revenue per state
    const studentCountByInstId = {};
    studentsByInstitution.forEach((row) => { studentCountByInstId[row.institutionId] = row._count._all; });
    const revenueByInstId = {};
    paidInvoices.forEach((inv) => { revenueByInstId[inv.institutionId] = (revenueByInstId[inv.institutionId] || 0) + inv.totalAmount; });

    const stateAgg = {};
    institutions.forEach((inst) => {
      const state = normalizeState(inst.state);
      if (!stateAgg[state]) stateAgg[state] = { state, institutions: 0, activeStudents: 0, revenue: 0 };
      stateAgg[state].institutions++;
      stateAgg[state].activeStudents += studentCountByInstId[inst.id] || 0;
      stateAgg[state].revenue += revenueByInstId[inst.id] || 0;
    });
    const stateBreakdown = Object.values(stateAgg)
      .sort((a, b) => b.institutions - a.institutions)
      .map((s, idx) => ({ rank: idx + 1, ...s }));

    // 5. Module Adoption — % of institutions with each optional module enabled
    const moduleAdoption = MODULE_CATALOG.map((mod) => {
      const enabledCount = institutions.filter((inst) => resolveEnabledModules(inst.modules).includes(mod.key)).length;
      return {
        key: mod.key,
        label: mod.label,
        enabledCount,
        percentage: totalInstitutions > 0 ? Math.round((enabledCount / totalInstitutions) * 100) : 0,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // 6. Revenue by Plan — real breakdown from paid invoices, grouped by planName
    const totalBillings = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const planTotals = {};
    paidInvoices.forEach((inv) => {
      const plan = inv.planName || 'Unspecified';
      planTotals[plan] = (planTotals[plan] || 0) + inv.totalAmount;
    });
    const revenueByPlan = Object.entries(planTotals)
      .map(([plan, amount]) => ({ plan, amount, percentage: totalBillings > 0 ? Math.round((amount / totalBillings) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    const currentMonthRevenue = revenueMonthly[revenueMonthly.length - 1]?.value || 0;
    const avgAccountValue = totalInstitutions > 0 ? Math.round(totalBillings / totalInstitutions) : 0;

    const analytics = {
      totalInstitutions,
      activeInstitutions,
      trialInstitutions,
      suspendedInstitutions,
      totalUsers: users.length,
      totalStudents,
      totalStaff,
      systemHealth: 99.98, // static placeholder — no uptime-monitoring infrastructure exists yet
      storageUsedGB: 12.5, // static placeholder — no storage-metering infrastructure exists yet
      institutionGrowth,
      userGrowth,
      revenueMonthly,
      stateDistribution,
      stateBreakdown,
      moduleAdoption,
      revenueByPlan,
      totalBillings,
      currentMonthRevenue,
      avgAccountValue,
    };

    return sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
