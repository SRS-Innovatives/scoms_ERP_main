/**
 * Institute Admin — Student Withdrawal / Transfer
 *
 * The actual state-change workflow for a student leaving — distinct from the TC
 * (Transfer Certificate) document certificateController generates, which is just the
 * paper output. This tracks why, clearance status, and is the one place that actually
 * flips Student.status on completion.
 *
 * Clearance is computed against real data (outstanding library books, unpaid fees, an
 * occupied hostel bed) rather than trusted as bare checkboxes — an admin can still
 * override and mark cleared manually, but getClearanceStatus tells them what's really
 * outstanding first.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError, BusinessRuleError } = require('../../../shared');

const EXIT_TYPES = ['WITHDRAWAL', 'TRANSFER'];

const getExitRecords = async (req, res, next) => {
  try {
    const { status } = req.query;
    const records = await prisma.studentExitRecord.findMany({
      where: { institutionId: req.institutionId, ...(status && { status }) },
      include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
      orderBy: { requestedDate: 'desc' },
    });
    return sendSuccess(res, records, 'Exit records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const requestExit = async (req, res, next) => {
  try {
    const { studentId, exitType, reason, transferToInstitution } = req.body;
    if (!studentId || !exitType || !reason) throw new ValidationError('studentId, exitType and reason are required');
    if (!EXIT_TYPES.includes(exitType)) throw new ValidationError(`exitType must be one of ${EXIT_TYPES.join(', ')}`);

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const existingActive = await prisma.studentExitRecord.findFirst({
      where: { studentId, status: { notIn: ['CANCELLED', 'COMPLETED'] } },
    });
    if (existingActive) throw new BusinessRuleError('This student already has an active withdrawal/transfer request in progress');

    const record = await prisma.studentExitRecord.create({
      data: {
        institutionId: req.institutionId,
        studentId,
        exitType,
        reason,
        transferToInstitution: exitType === 'TRANSFER' ? transferToInstitution || null : null,
      },
    });
    return sendSuccess(res, record, 'Exit request created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Real, computed clearance — not just what the admin has manually checked. */
const getClearanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await prisma.studentExitRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!record) throw new NotFoundError('Exit record not found');

    const [outstandingBooks, feeAssignments, hostelBed] = await Promise.all([
      prisma.bookIssue.count({ where: { studentId: record.studentId, status: 'ISSUED' } }),
      prisma.studentFeeAssignment.aggregate({ where: { studentId: record.studentId, dueAmount: { gt: 0 } }, _sum: { dueAmount: true }, _count: true }),
      prisma.hostelBed.findUnique({ where: { studentId: record.studentId } }),
    ]);

    return sendSuccess(res, {
      library: { cleared: outstandingBooks === 0, outstandingBooks },
      fees: { cleared: (feeAssignments._count || 0) === 0, outstandingAssignments: feeAssignments._count || 0, totalDue: feeAssignments._sum.dueAmount || 0 },
      hostel: { cleared: !hostelBed, currentlyAllocated: !!hostelBed },
    }, 'Clearance status computed successfully');
  } catch (err) {
    next(err);
  }
};

const updateClearance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { libraryCleared, feesCleared, hostelCleared } = req.body;

    const existing = await prisma.studentExitRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Exit record not found');
    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) throw new BusinessRuleError(`Cannot update clearance on a ${existing.status} exit record`);

    const record = await prisma.studentExitRecord.update({
      where: { id },
      data: {
        ...(libraryCleared !== undefined && { libraryCleared: !!libraryCleared }),
        ...(feesCleared !== undefined && { feesCleared: !!feesCleared }),
        ...(hostelCleared !== undefined && { hostelCleared: !!hostelCleared }),
        status: existing.status === 'REQUESTED' ? 'CLEARANCE_PENDING' : existing.status,
      },
    });
    return sendSuccess(res, record, 'Clearance updated successfully');
  } catch (err) {
    next(err);
  }
};

const approveExit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studentExitRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Exit record not found');
    if (!['REQUESTED', 'CLEARANCE_PENDING'].includes(existing.status)) throw new BusinessRuleError('Only a REQUESTED or CLEARANCE_PENDING exit record can be approved');
    if (!(existing.libraryCleared && existing.feesCleared && existing.hostelCleared)) {
      throw new BusinessRuleError('All clearance items (library, fees, hostel) must be marked cleared before approval');
    }

    const record = await prisma.studentExitRecord.update({
      where: { id },
      data: { status: 'APPROVED', processedById: req.user.id },
    });
    return sendSuccess(res, record, 'Exit approved — ready to be completed');
  } catch (err) {
    next(err);
  }
};

/** The one step that actually changes Student.status — everything before this is just
 * workflow state on the exit record itself. */
const completeExit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studentExitRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Exit record not found');
    if (existing.status !== 'APPROVED') throw new BusinessRuleError('Only an APPROVED exit record can be completed');

    const newStudentStatus = existing.exitType === 'TRANSFER' ? 'TRANSFERRED' : 'WITHDRAWN';

    const [record] = await prisma.$transaction([
      prisma.studentExitRecord.update({ where: { id }, data: { status: 'COMPLETED', exitDate: new Date() } }),
      prisma.student.update({ where: { id: existing.studentId }, data: { status: newStudentStatus } }),
    ]);
    return sendSuccess(res, record, `Student marked as ${newStudentStatus.toLowerCase()}`);
  } catch (err) {
    next(err);
  }
};

const cancelExit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studentExitRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Exit record not found');
    if (existing.status === 'COMPLETED') throw new BusinessRuleError('A COMPLETED exit record cannot be cancelled');

    const record = await prisma.studentExitRecord.update({ where: { id }, data: { status: 'CANCELLED' } });
    return sendSuccess(res, record, 'Exit request cancelled');
  } catch (err) {
    next(err);
  }
};

module.exports = { getExitRecords, requestExit, getClearanceStatus, updateClearance, approveExit, completeExit, cancelExit };
