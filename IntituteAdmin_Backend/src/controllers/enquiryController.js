/**
 * Institute Admin — Front Office / Admission Enquiry Controller
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_SOURCES = ['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER'];
const VALID_STATUSES = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'LOST'];

const getEnquiries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const enquiries = await prisma.enquiry.findMany({
      where: { institutionId: req.institutionId, ...(status && { status }) },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, enquiries, 'Enquiries retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createEnquiry = async (req, res, next) => {
  try {
    const { studentName, parentName, phone, email, classAppliedFor, source, followUpDate, notes } = req.body;
    if (!studentName || !phone) throw new ValidationError('studentName and phone are required');
    if (source && !VALID_SOURCES.includes(source)) throw new ValidationError(`source must be one of ${VALID_SOURCES.join(', ')}`);

    const enquiry = await prisma.enquiry.create({
      data: {
        institutionId: req.institutionId,
        studentName,
        parentName: parentName || null,
        phone,
        email: email || null,
        classAppliedFor: classAppliedFor || null,
        source: source || 'WALK_IN',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null,
        createdById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, enquiry, 'Enquiry logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, followUpDate, notes } = req.body;
    if (status && !VALID_STATUSES.includes(status)) throw new ValidationError(`status must be one of ${VALID_STATUSES.join(', ')}`);

    const existing = await prisma.enquiry.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Enquiry not found');

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    });
    return sendSuccess(res, enquiry, 'Enquiry updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.enquiry.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Enquiry not found');
    await prisma.enquiry.delete({ where: { id } });
    return sendSuccess(res, null, 'Enquiry deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getEnquiries, createEnquiry, updateEnquiry, deleteEnquiry };
