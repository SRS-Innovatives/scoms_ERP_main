const prisma = require('../../database/client');
const { ValidationError } = require('../../errors/customErrors');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** FEE_COLLECTION — every successful payment received in a date range. */
module.exports = async (institutionId, filters) => {
  const { dateFrom, dateTo, paymentMode } = filters;
  if (!dateFrom || !dateTo) throw new ValidationError('dateFrom and dateTo are required');

  const payments = await prisma.feePayment.findMany({
    where: {
      institutionId,
      paymentStatus: 'SUCCESS',
      paidAt: { gte: startOfDay(dateFrom), lte: endOfDay(dateTo) },
      ...(paymentMode && { paymentMode }),
    },
    include: {
      student: { select: { firstName: true, lastName: true, rollNumber: true } },
      studentFeeAssignment: { include: { feeStructure: { select: { category: true } } } },
    },
    orderBy: { paidAt: 'asc' },
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const rows = payments.map((p) => ({
    date: p.paidAt.toISOString().slice(0, 10),
    name: `${p.student.firstName} ${p.student.lastName}`,
    rollNumber: p.student.rollNumber,
    category: p.studentFeeAssignment?.feeStructure?.category || '—',
    amount: p.amountPaid,
    mode: p.paymentMode,
    reference: p.transactionReference || '—',
  }));

  return { rows, summary: `${rows.length} payment(s) totaling ₹${totalCollected.toLocaleString()}` };
};
