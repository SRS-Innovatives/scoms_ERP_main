/**
 * Institute Admin Alumni Network Controller — real CRUD over graduated-student records.
 * An alumni record can either link back to a real SCOMS Student (added via "Add from
 * Student Directory") or be entered manually (for alumni who predate SCOMS itself).
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const getAlumni = async (req, res, next) => {
  try {
    const { search, graduationYear } = req.query;
    const alumni = await prisma.alumniRecord.findMany({
      where: {
        institutionId: req.institutionId,
        ...(graduationYear && { graduationYear: Number(graduationYear) }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { currentEmployer: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { student: { select: { admissionNumber: true } } },
      orderBy: { graduationYear: 'desc' },
    });
    return sendSuccess(res, alumni, 'Alumni records retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createAlumni = async (req, res, next) => {
  try {
    const { studentId, fullName, graduationYear, courseName, currentEmployer, currentDesignation, email, phone, linkedinUrl, testimonial } = req.body;
    if (!fullName || !graduationYear) throw new ValidationError('fullName and graduationYear are required');

    if (studentId) {
      const student = await prisma.student.findFirst({ where: { id: studentId, institutionId: req.institutionId } });
      if (!student) throw new NotFoundError('Student not found or access denied');
      const existing = await prisma.alumniRecord.findUnique({ where: { studentId } });
      if (existing) throw new ValidationError('This student already has an alumni record');
    }

    const alumni = await prisma.alumniRecord.create({
      data: {
        institutionId: req.institutionId,
        studentId: studentId || null,
        fullName,
        graduationYear: Number(graduationYear),
        courseName,
        currentEmployer,
        currentDesignation,
        email,
        phone,
        linkedinUrl,
        testimonial,
      },
    });
    return sendSuccess(res, alumni, 'Alumni record created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateAlumni = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.alumniRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Alumni record not found');

    const { fullName, graduationYear, courseName, currentEmployer, currentDesignation, email, phone, linkedinUrl, testimonial } = req.body;
    const alumni = await prisma.alumniRecord.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(graduationYear !== undefined && { graduationYear: Number(graduationYear) }),
        ...(courseName !== undefined && { courseName }),
        ...(currentEmployer !== undefined && { currentEmployer }),
        ...(currentDesignation !== undefined && { currentDesignation }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(testimonial !== undefined && { testimonial }),
      },
    });
    return sendSuccess(res, alumni, 'Alumni record updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAlumni = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.alumniRecord.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Alumni record not found');

    await prisma.alumniRecord.delete({ where: { id } });
    return sendSuccess(res, null, 'Alumni record deleted successfully');
  } catch (err) {
    next(err);
  }
};

/** Students eligible to be registered as alumni — anyone not already linked to a record.
 * SCOMS has no automatic "graduated" status yet, so the admin picks who to add rather
 * than this being auto-filtered to a graduation flag that doesn't exist. */
const getEligibleStudents = async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        institutionId: req.institutionId,
        alumniRecord: null,
      },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, status: true, course: { select: { name: true } } },
      orderBy: { firstName: 'asc' },
    });
    return sendSuccess(res, students, 'Eligible students retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlumni,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getEligibleStudents,
};
