/**
 * Staff Library Desk Controller
 *
 * Same Book/BookIssue tables the Institute Admin library register uses — this is the
 * librarian-facing counter view (issue/return/fine collection), just scoped to
 * req.institutionId like every other tenant-scoped query.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} = require('../../../shared');

const FINE_PER_DAY = 5;
const LENDING_DAYS = 14;

const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    const students = await prisma.student.findMany({
      where: {
        institutionId: req.institutionId,
        status: 'ACTIVE',
        ...(q && {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { rollNumber: { contains: q, mode: 'insensitive' } },
            { admissionNumber: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, admissionNumber: true },
      take: 20,
      orderBy: { rollNumber: 'asc' },
    });
    return sendSuccess(res, students, 'Students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const searchBooks = async (req, res, next) => {
  try {
    const { q } = req.query;
    const books = await prisma.book.findMany({
      where: {
        institutionId: req.institutionId,
        availableCopies: { gt: 0 },
        ...(q && { OR: [{ title: { contains: q, mode: 'insensitive' } }, { author: { contains: q, mode: 'insensitive' } }] }),
      },
      take: 20,
      orderBy: { title: 'asc' },
    });
    return sendSuccess(res, books, 'Books retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId } = req.body;
    if (!bookId || !studentId) throw new ValidationError('bookId and studentId are required');

    const book = await prisma.book.findFirst({ where: { id: bookId, institutionId: req.institutionId } });
    if (!book) throw new NotFoundError('Book not found or access denied');
    if (book.availableCopies <= 0) throw new BusinessRuleError('No copies available for this book right now');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const alreadyHeld = await prisma.bookIssue.findFirst({ where: { bookId, studentId, status: 'ISSUED' } });
    if (alreadyHeld) throw new BusinessRuleError('This student already has this book issued');

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LENDING_DAYS);

    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({ data: { bookId, studentId, dueDate } }),
      prisma.book.update({ where: { id: bookId }, data: { availableCopies: { decrement: 1 } } }),
    ]);

    return sendSuccess(res, issue, `Book issued successfully. Due date: ${dueDate.toDateString()}`, 201);
  } catch (err) {
    next(err);
  }
};

const getActiveIssues = async (req, res, next) => {
  try {
    const issues = await prisma.bookIssue.findMany({
      where: { status: 'ISSUED', book: { institutionId: req.institutionId } },
      include: {
        book: { select: { title: true, author: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    return sendSuccess(res, issues, 'Active issues retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const { issueId } = req.body;
    if (!issueId) throw new ValidationError('issueId is required');

    const issue = await prisma.bookIssue.findFirst({
      where: { id: issueId, status: 'ISSUED', book: { institutionId: req.institutionId } },
      include: { book: true },
    });
    if (!issue) throw new NotFoundError('Active book issue not found or access denied');

    const now = new Date();
    const overdueDays = Math.max(0, Math.ceil((now - issue.dueDate) / (1000 * 60 * 60 * 24)));
    const fineAmount = overdueDays * FINE_PER_DAY;

    const [updated] = await prisma.$transaction([
      prisma.bookIssue.update({ where: { id: issueId }, data: { status: 'RETURNED', returnedAt: now, fineAmount } }),
      prisma.book.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } }),
    ]);

    return sendSuccess(
      res,
      updated,
      fineAmount > 0 ? `Book returned. ${overdueDays} day(s) overdue — ₹${fineAmount} fine due.` : 'Book returned. No overdue fine.'
    );
  } catch (err) {
    next(err);
  }
};

const getFines = async (req, res, next) => {
  try {
    const fines = await prisma.bookIssue.findMany({
      where: { status: 'RETURNED', fineAmount: { gt: 0 }, book: { institutionId: req.institutionId } },
      include: {
        book: { select: { title: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: { returnedAt: 'desc' },
    });
    return sendSuccess(res, fines, 'Library fines retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const collectFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await prisma.bookIssue.findFirst({ where: { id, book: { institutionId: req.institutionId } } });
    if (!issue) throw new NotFoundError('Book issue not found');

    const updated = await prisma.bookIssue.update({ where: { id }, data: { finePaid: true } });
    return sendSuccess(res, updated, 'Fine collected successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchStudents,
  searchBooks,
  issueBook,
  getActiveIssues,
  returnBook,
  getFines,
  collectFine,
};
