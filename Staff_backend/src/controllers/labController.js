/**
 * Staff — Lab Equipment & Asset Register
 *
 * Reuses the institution-wide Asset ledger (already real, built for Institute Admin's
 * Inventory module), scoped to lab-related categories so a teacher sees only their own
 * lab's equipment, not furniture/IT assets across the whole campus.
 */
const { prisma, sendSuccess, ValidationError } = require('../../../shared');

const LAB_CATEGORY = 'Lab Instrument';

const getLabAssets = async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { institutionId: req.institutionId, category: LAB_CATEGORY },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, assets, 'Lab assets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createLabAsset = async (req, res, next) => {
  try {
    const { assetTag, name, location, quantity, condition, calibrationDueDate } = req.body;
    if (!assetTag || !name) throw new ValidationError('assetTag and name are required');

    const asset = await prisma.asset.create({
      data: {
        institutionId: req.institutionId,
        assetTag,
        name,
        category: LAB_CATEGORY,
        location: location || null,
        quantity: Number(quantity) || 1,
        condition: condition || 'GOOD',
        calibrationDueDate: calibrationDueDate ? new Date(calibrationDueDate) : null,
      },
    });

    return sendSuccess(res, asset, 'Lab equipment added to register', 201);
  } catch (err) {
    next(err);
  }
};

/** Equipment currently issued to (not yet returned by) students, restricted to this staff
 * member's own sections. */
const getIssuedEquipment = async (req, res, next) => {
  try {
    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId, sectionId: { not: null } },
      select: { sectionId: true },
      distinct: ['sectionId'],
    });
    const sectionIds = mappings.map((m) => m.sectionId);

    const issues = await prisma.equipmentIssue.findMany({
      where: { staffId: req.user.staffId },
      include: {
        asset: { select: { name: true, assetTag: true } },
        student: { select: { firstName: true, lastName: true, rollNumber: true, sectionId: true, section: { select: { name: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    // extra safety: only ever show issues for students still in a section this staff teaches
    const scoped = issues.filter((i) => sectionIds.includes(i.student.sectionId));
    return sendSuccess(res, scoped, 'Equipment issue log retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Issues one unit of lab equipment to a student in the staff member's own section. */
const issueEquipment = async (req, res, next) => {
  try {
    const { assetId, studentId, quantity, remarks } = req.body;
    if (!assetId || !studentId) throw new ValidationError('assetId and studentId are required');

    const mappings = await prisma.subjectTeacherMapping.findMany({
      where: { staffId: req.user.staffId, sectionId: { not: null } },
      select: { sectionId: true },
    });
    const sectionIds = mappings.map((m) => m.sectionId);

    const student = await prisma.student.findFirst({ where: { id: studentId, sectionId: { in: sectionIds } } });
    if (!student) throw new ValidationError('You may only issue equipment to students in your own assigned classes');

    const asset = await prisma.asset.findFirst({ where: { id: assetId, institutionId: req.institutionId } });
    if (!asset) throw new ValidationError('Equipment not found');

    const issue = await prisma.equipmentIssue.create({
      data: {
        assetId,
        studentId,
        staffId: req.user.staffId,
        quantity: Number(quantity) || 1,
        remarks: remarks || null,
      },
    });

    return sendSuccess(res, issue, 'Equipment issued successfully', 201);
  } catch (err) {
    next(err);
  }
};

/** Marks a previously issued item as returned. */
const returnEquipment = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const issue = await prisma.equipmentIssue.findFirst({ where: { id: issueId, staffId: req.user.staffId } });
    if (!issue) throw new ValidationError('Issue record not found or access denied');

    const updated = await prisma.equipmentIssue.update({
      where: { id: issueId },
      data: { returnedAt: new Date() },
    });

    return sendSuccess(res, updated, 'Equipment marked as returned');
  } catch (err) {
    next(err);
  }
};

module.exports = { getLabAssets, createLabAsset, getIssuedEquipment, issueEquipment, returnEquipment };
