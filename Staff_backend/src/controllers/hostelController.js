/**
 * Staff Portal — Hostel Desk Controller (Hostel Warden role)
 *
 * Ported verbatim from IntituteAdmin_Backend's hostelController — institution-scoped
 * business logic, gated entirely by HOSTEL_MANAGE, so the Warden gets the same
 * capability set an Institute Admin would use to run the hostel.
 *
 * Hostel (block, warden, mess) -> HostelBed (room/bed inventory, occupancy, monthly fee)
 * -> HostelAttendance (daily night roll call per occupied bed). HostelVisitorLog is a
 * standalone gate-pass register for parent/guardian visits.
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
  generateGatePassNumber,
} = require('../../../shared');

const toDateOnly = (dateStr) => {
  if (dateStr) return new Date(dateStr);
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// ============================================================
// Hostel Blocks
// ============================================================
const getHostels = async (req, res, next) => {
  try {
    const hostels = await prisma.hostel.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { beds: true } } },
      orderBy: { name: 'asc' },
    });
    const withOccupancy = await Promise.all(
      hostels.map(async (h) => {
        const occupied = await prisma.hostelBed.count({ where: { hostelId: h.id, isOccupied: true } });
        return { ...h, occupiedBeds: occupied };
      })
    );
    return sendSuccess(res, withOccupancy, 'Hostels retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createHostel = async (req, res, next) => {
  try {
    const { name, type, warden, messType, capacity } = req.body;
    if (!name) throw new ValidationError('name is required');

    const hostel = await prisma.hostel.create({
      data: {
        institutionId: req.institutionId,
        name,
        type: type || 'BOYS',
        warden: warden || null,
        messType: messType || null,
        capacity: Number(capacity) || 100,
      },
    });
    return sendSuccess(res, hostel, 'Hostel block created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Student picker for bed allocation — only students who don't already have a bed
 * (HostelBed.studentId is unique), so the Warden never sees a student they'd
 * immediately get a "already has a bed allocated" error for. Mobile-only endpoint,
 * added for the mobile allocate-bed flow (see scoms-app-staff's hostel module);
 * nothing on web changes. */
const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    const students = await prisma.student.findMany({
      where: {
        institutionId: req.institutionId,
        status: 'ACTIVE',
        hostelBed: null,
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

// ============================================================
// Beds — room/bed inventory + allocation
// ============================================================
const getBeds = async (req, res, next) => {
  try {
    const { hostelId } = req.query;
    const beds = await prisma.hostelBed.findMany({
      where: { hostel: { institutionId: req.institutionId }, ...(hostelId && { hostelId }) },
      include: {
        hostel: { select: { name: true, type: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
    });
    return sendSuccess(res, beds, 'Hostel beds retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createBed = async (req, res, next) => {
  try {
    const { hostelId, roomNumber, bedNumber, monthlyFee } = req.body;
    if (!hostelId || !roomNumber || !bedNumber) throw new ValidationError('hostelId, roomNumber, bedNumber are required');

    const hostel = await prisma.hostel.findFirst({ where: { id: hostelId, institutionId: req.institutionId } });
    if (!hostel) throw new NotFoundError('Hostel not found or access denied');

    const bed = await prisma.hostelBed.create({
      data: { hostelId, roomNumber, bedNumber, monthlyFee: Number(monthlyFee) || 5000 },
    });
    return sendSuccess(res, bed, 'Bed added to room inventory successfully', 201);
  } catch (err) {
    next(err);
  }
};

const allocateBed = async (req, res, next) => {
  try {
    const { bedId, studentId, customFields } = req.body;
    if (!bedId || !studentId) throw new ValidationError('bedId and studentId are required');

    const bed = await prisma.hostelBed.findFirst({ where: { id: bedId, hostel: { institutionId: req.institutionId } } });
    if (!bed) throw new NotFoundError('Bed not found or access denied');
    if (bed.isOccupied) throw new BusinessRuleError('This bed is already occupied');

    const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
    if (!student) throw new NotFoundError('Student not found or access denied');

    const existing = await prisma.hostelBed.findUnique({ where: { studentId } });
    if (existing) throw new BusinessRuleError('This student already has a bed allocated');

    const updated = await prisma.hostelBed.update({
      where: { id: bedId },
      data: {
        studentId,
        isOccupied: true,
        ...(customFields && Object.keys(customFields).length > 0 && { customFields }),
      },
    });
    return sendSuccess(res, updated, 'Bed allocated to student successfully');
  } catch (err) {
    next(err);
  }
};

const vacateBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bed = await prisma.hostelBed.findFirst({ where: { id, hostel: { institutionId: req.institutionId } } });
    if (!bed) throw new NotFoundError('Bed not found');

    const updated = await prisma.hostelBed.update({ where: { id }, data: { studentId: null, isOccupied: false } });
    return sendSuccess(res, updated, 'Bed vacated successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Night Attendance (Roll Call)
// ============================================================
const getAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const day = toDateOnly(date);

    const beds = await prisma.hostelBed.findMany({
      where: { hostel: { institutionId: req.institutionId }, isOccupied: true },
      include: {
        hostel: { select: { name: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        attendance: { where: { date: day } },
      },
      orderBy: [{ roomNumber: 'asc' }],
    });

    const result = beds.map((b) => ({
      bedId: b.id,
      roomNumber: b.roomNumber,
      bedNumber: b.bedNumber,
      hostel: b.hostel,
      student: b.student,
      attendance: b.attendance[0] || null,
    }));

    return sendSuccess(res, result, 'Hostel attendance roster retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const { records, date } = req.body;
    if (!Array.isArray(records)) throw new ValidationError('records must be an array');

    const day = toDateOnly(date);

    await prisma.$transaction(
      records.map((r) =>
        prisma.hostelAttendance.upsert({
          where: { hostelBedId_date: { hostelBedId: r.bedId, date: day } },
          create: { hostelBedId: r.bedId, date: day, status: r.status || 'PRESENT', remarks: r.remarks || null },
          update: { status: r.status || 'PRESENT', remarks: r.remarks || null },
        })
      )
    );

    return sendSuccess(res, null, 'Night roll call recorded successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Mess Fee (derived from HostelBed.monthlyFee)
// ============================================================
const getMessFees = async (req, res, next) => {
  try {
    const beds = await prisma.hostelBed.findMany({
      where: { hostel: { institutionId: req.institutionId }, isOccupied: true },
      include: {
        hostel: { select: { name: true, messType: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: [{ roomNumber: 'asc' }],
    });
    return sendSuccess(res, beds, 'Hostel mess fee list retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Visitor Gate Pass Register
// ============================================================
const getVisitors = async (req, res, next) => {
  try {
    const visitors = await prisma.hostelVisitorLog.findMany({
      where: { hostel: { institutionId: req.institutionId } },
      include: {
        hostel: { select: { name: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: { checkInAt: 'desc' },
    });
    return sendSuccess(res, visitors, 'Visitor register retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const checkInVisitor = async (req, res, next) => {
  try {
    const { studentId, visitorName, relationship } = req.body;
    if (!studentId || !visitorName) throw new ValidationError('studentId and visitorName are required');

    const bed = await prisma.hostelBed.findFirst({ where: { studentId, hostel: { institutionId: req.institutionId } } });
    if (!bed) throw new NotFoundError('Student is not a hosteler, or access denied');

    const count = await prisma.hostelVisitorLog.count({ where: { hostel: { institutionId: req.institutionId } } });
    const gatePassNo = generateGatePassNumber(count + 1);

    const visitor = await prisma.hostelVisitorLog.create({
      data: { hostelId: bed.hostelId, studentId, visitorName, relationship: relationship || null, gatePassNo },
      include: { student: { select: { firstName: true, lastName: true, rollNumber: true } } },
    });
    return sendSuccess(res, visitor, 'Visitor checked in successfully', 201);
  } catch (err) {
    next(err);
  }
};

const checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visitor = await prisma.hostelVisitorLog.findFirst({ where: { id, hostel: { institutionId: req.institutionId } } });
    if (!visitor) throw new NotFoundError('Visitor log not found');
    if (visitor.checkOutAt) throw new BusinessRuleError('Visitor has already checked out');

    const updated = await prisma.hostelVisitorLog.update({ where: { id }, data: { checkOutAt: new Date() } });
    return sendSuccess(res, updated, 'Visitor checked out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHostels,
  createHostel,
  searchStudents,
  getBeds,
  createBed,
  allocateBed,
  vacateBed,
  getAttendance,
  markAttendance,
  getMessFees,
  getVisitors,
  checkInVisitor,
  checkOutVisitor,
};
