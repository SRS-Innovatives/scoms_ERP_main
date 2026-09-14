/**
 * Staff Self-Service Controller
 *
 * Everything here is scoped strictly to req.user.staffId — a staff member reads/edits
 * only their own record. Reuses the exact same Staff/StaffQualification/StaffExperience/
 * StaffAttendance/LeaveRequest models the Institute Admin backend manages, just narrowed
 * to "my own".
 */
const {
  prisma,
  sendSuccess,
  NotFoundError,
  ValidationError,
  getActiveList,
} = require('../../../shared');

/** The leave types this institution actually offers right now — its own customized
 * list if it has one, the standard default otherwise. Powers the Apply Leave dropdown. */
const getLeaveTypes = async (req, res, next) => {
  try {
    const types = await getActiveList(req.institutionId, 'LEAVE_TYPE');
    return sendSuccess(res, types, 'Leave types retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Profile
// ============================================================
const getMyProfile = async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.user.staffId },
      include: {
        user: { select: { email: true, mobile: true, role: true, avatar: true } },
        department: true,
        salary: true,
        qualifications: { orderBy: { yearOfPassing: 'desc' } },
        experiences: { orderBy: { fromDate: 'desc' } },
      },
    });
    if (!staff) throw new NotFoundError('Staff profile not found');
    return sendSuccess(res, staff, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { phone, avatar, altPhone, dob, bloodGroup, bankName, bankAccountNumber, bankIfscCode, bankAccountName, panNumber, emergencyContactName, emergencyContactRelation, emergencyContactPhone, emergencyContactAddress } = req.body;

    if (phone || avatar !== undefined) {
      if (avatar !== undefined && avatar !== '' && !/^data:image\/(png|jpeg|jpg);base64,/.test(avatar)) {
        throw new ValidationError('Profile photo must be a PNG or JPEG image');
      }
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(phone && { mobile: phone }),
          ...(avatar !== undefined && { avatar: avatar === '' ? null : avatar }),
        },
      });
    }

    const staff = await prisma.staff.update({
      where: { id: req.user.staffId },
      data: {
        ...(altPhone !== undefined && { altPhone }),
        ...(dob && { dob: new Date(dob) }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankIfscCode !== undefined && { bankIfscCode }),
        ...(bankAccountName !== undefined && { bankAccountName }),
        ...(panNumber !== undefined && { panNumber }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(emergencyContactRelation !== undefined && { emergencyContactRelation }),
        ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
        ...(emergencyContactAddress !== undefined && { emergencyContactAddress }),
      },
    });
    return sendSuccess(res, staff, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const addMyQualification = async (req, res, next) => {
  try {
    const { degree, institutionName, yearOfPassing, grade } = req.body;
    if (!degree || !institutionName || !yearOfPassing) throw new ValidationError('degree, institutionName, yearOfPassing are required');

    const qualification = await prisma.staffQualification.create({
      data: { staffId: req.user.staffId, degree, institutionName, yearOfPassing: Number(yearOfPassing), grade: grade || null },
    });
    return sendSuccess(res, qualification, 'Qualification added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const addMyExperience = async (req, res, next) => {
  try {
    const { organization, roleTitle, fromDate, toDate, description } = req.body;
    if (!organization || !roleTitle || !fromDate) throw new ValidationError('organization, roleTitle, fromDate are required');

    const experience = await prisma.staffExperience.create({
      data: { staffId: req.user.staffId, organization, roleTitle, fromDate: new Date(fromDate), toDate: toDate ? new Date(toDate) : null, description: description || null },
    });
    return sendSuccess(res, experience, 'Experience record added successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// My Leave
// ============================================================
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { staffId: req.user.staffId },
      orderBy: { createdAt: 'desc' },
    });

    const currentYear = new Date().getFullYear();
    const usedByType = { CASUAL: 0, EARNED: 0, MEDICAL: 0, DUTY: 0 };
    leaves
      .filter((l) => l.status === 'APPROVED' && new Date(l.startDate).getFullYear() === currentYear)
      .forEach((l) => {
        const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        usedByType[l.type] = (usedByType[l.type] || 0) + days;
      });

    return sendSuccess(res, { leaves, usedByType }, 'Leave applications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const applyMyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) throw new ValidationError('startDate, endDate, reason are required');

    const leave = await prisma.leaveRequest.create({
      data: { institutionId: req.institutionId, staffId: req.user.staffId, type: type || 'CASUAL', startDate: new Date(startDate), endDate: new Date(endDate), reason },
    });
    return sendSuccess(res, leave, 'Leave application submitted to Principal & HOD for approval!', 201);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// My Attendance
// ============================================================
const getMyAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const y = Number(year) || now.getFullYear();
    const m = month !== undefined ? Number(month) : now.getMonth();

    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

    const records = await prisma.staffAttendance.findMany({
      where: { staffId: req.user.staffId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const totalMarked = records.length;
    const punctualityRate = totalMarked > 0 ? Number((((totalMarked - lateCount) / totalMarked) * 100).toFixed(1)) : 100;

    return sendSuccess(res, { records, presentCount, lateCount, totalMarked, punctualityRate }, 'Attendance retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  addMyQualification,
  addMyExperience,
  getMyLeaves,
  applyMyLeave,
  getMyAttendance,
  getLeaveTypes,
};
