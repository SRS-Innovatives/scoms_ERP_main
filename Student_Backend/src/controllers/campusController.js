/**
 * Student Campus Services Controller — read-only views of the student's own
 * library, transport, and hostel records, reusing the same tables the Institute
 * Admin (and, for library, the Staff Library Desk) already manage.
 */
const { prisma, sendSuccess, NotFoundError, BusinessRuleError } = require('../../../shared');

const RENEWAL_DAYS = 14;

// ============================================================
// Library
// ============================================================
const getMyLibrary = async (req, res, next) => {
  try {
    const issues = await prisma.bookIssue.findMany({
      where: { studentId: req.user.studentId },
      include: { book: { select: { title: true, author: true } } },
      orderBy: { issuedAt: 'desc' },
    });
    return sendSuccess(res, issues, 'Library records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const renewBook = async (req, res, next) => {
  try {
    const { issueId } = req.body;
    const issue = await prisma.bookIssue.findFirst({ where: { id: issueId, studentId: req.user.studentId, status: 'ISSUED' } });
    if (!issue) throw new NotFoundError('Active book issue not found');
    if (new Date(issue.dueDate) < new Date()) throw new BusinessRuleError('Overdue books must be returned at the library desk before renewal');

    const newDueDate = new Date(issue.dueDate);
    newDueDate.setDate(newDueDate.getDate() + RENEWAL_DAYS);

    const updated = await prisma.bookIssue.update({ where: { id: issueId }, data: { dueDate: newDueDate } });
    return sendSuccess(res, updated, `Loan renewed — new due date ${newDueDate.toDateString()}`);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Transport
// ============================================================
const getMyTransport = async (req, res, next) => {
  try {
    const mapping = await prisma.studentTransportMapping.findUnique({
      where: { studentId: req.user.studentId },
      include: { route: { include: { vehicle: true } } },
    });
    return sendSuccess(res, mapping, 'Transport assignment retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Hostel
// ============================================================
const getMyHostel = async (req, res, next) => {
  try {
    const bed = await prisma.hostelBed.findUnique({
      where: { studentId: req.user.studentId },
      include: { hostel: true },
    });
    return sendSuccess(res, bed, 'Hostel allocation retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyLibrary,
  renewBook,
  getMyTransport,
  getMyHostel,
};
