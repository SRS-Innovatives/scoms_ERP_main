/**
 * Institute Admin — Payroll Controller
 *
 * Generates a Payslip snapshot from the staff member's real StaffSalary structure
 * (basic/HRA/DA/allowances/deductions). The schema's LeaveRequest model has no
 * "unpaid leave" concept to auto-derive a deduction from, so leaveDeduction is an
 * explicit, optional admin-entered amount rather than a guessed calculation.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getPayslips = async (req, res, next) => {
  try {
    const { staffId, month, year } = req.query;
    const payslips = await prisma.payslip.findMany({
      where: {
        institutionId: req.institutionId,
        ...(staffId && { staffId }),
        ...(month && { month: parseInt(month, 10) }),
        ...(year && { year: parseInt(year, 10) }),
      },
      include: { staff: { select: { firstName: true, lastName: true, employeeCode: true, designation: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return sendSuccess(res, payslips, 'Payslips retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const generatePayslip = async (req, res, next) => {
  try {
    const { staffId, month, year, leaveDeduction: leaveDeductionInput } = req.body;
    if (!staffId || !month || !year) throw new ValidationError('staffId, month and year are required');
    if (month < 1 || month > 12) throw new ValidationError('month must be between 1 and 12');

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, institutionId: req.institutionId },
      include: { salary: true },
    });
    if (!staff) throw new NotFoundError('Staff not found');
    if (!staff.salary) throw new ValidationError('This staff member has no salary structure set up yet');

    const existing = await prisma.payslip.findUnique({ where: { staffId_month_year: { staffId, month, year } } });
    if (existing) throw new ValidationError('A payslip for this staff member and month already exists');

    const { basicPay, hra, da, otherAllowances, deductions } = staff.salary;
    const leaveDeduction = Number(leaveDeductionInput) > 0 ? Number(leaveDeductionInput) : 0;
    const netPay = Math.max(0, basicPay + hra + da + otherAllowances - deductions - leaveDeduction);

    const payslip = await prisma.payslip.create({
      data: {
        institutionId: req.institutionId,
        staffId,
        month,
        year,
        basicPay,
        hra,
        da,
        otherAllowances,
        deductions,
        leaveDeduction,
        netPay,
        generatedById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, payslip, 'Payslip generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

const markPayslipPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.payslip.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Payslip not found');

    const payslip = await prisma.payslip.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    return sendSuccess(res, payslip, 'Payslip marked as paid');
  } catch (err) {
    next(err);
  }
};

const deletePayslip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.payslip.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Payslip not found');
    if (existing.status === 'PAID') throw new ValidationError('Cannot delete a payslip already marked paid');
    await prisma.payslip.delete({ where: { id } });
    return sendSuccess(res, null, 'Payslip deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayslips, generatePayslip, markPayslipPaid, deletePayslip };
