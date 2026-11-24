/**
 * Parent — Child Directory & own account
 *
 * The only parent-only endpoints: every other route in this backend is shared with
 * Student and simply resolves to whichever child is active (see
 * shared/middleware/resolveActiveChild.js).
 *   GET   /parent/children  — the real children linked to this account (child switcher)
 *   GET   /parent/profile   — the parent's own record (not the child's)
 *   PATCH /parent/profile   — edit the parent's own contact details
 */
const { prisma, sendSuccess, ValidationError, AuthorizationError, NotFoundError, ROLES } = require('../../../shared');

const requireParent = (req) => {
  if (req.user.role !== ROLES.PARENT) throw new ValidationError('This endpoint is for parent accounts only');
  if (!req.user.parentId) throw new AuthorizationError('This parent account is not linked to a parent record — contact your institution.');
};

const getMyChildren = async (req, res, next) => {
  try {
    requireParent(req);

    const links = await prisma.parentStudent.findMany({
      where: { parentId: req.user.parentId },
      select: {
        relation: true,
        student: {
          select: {
            id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true,
            course: { select: { name: true } }, section: { select: { name: true } },
          },
        },
      },
    });

    const children = links.map((l) => ({ ...l.student, relation: l.relation }));
    return sendSuccess(res, children, 'Children retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Contact details a parent may correct themselves. Names, income (scholarship
 * eligibility) and the login identity (User.email / User.mobile) stay with the
 * institution, so a parent can't change who they are or how they sign in.
 */
const PARENT_EDITABLE_FIELDS = [
  'fatherPhone', 'fatherEmail', 'fatherOccupation',
  'motherPhone', 'motherEmail', 'motherOccupation',
  'guardianName', 'guardianPhone', 'guardianRelation',
  'address',
];
const PHONE_FIELDS = new Set(['fatherPhone', 'motherPhone', 'guardianPhone']);
const EMAIL_FIELDS = new Set(['fatherEmail', 'motherEmail']);
const PHONE_RE = /^\+?[0-9][0-9 -]{6,14}[0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { address: 500 };

const PROFILE_SELECT = {
  id: true,
  fatherName: true, fatherOccupation: true, fatherPhone: true, fatherEmail: true,
  motherName: true, motherOccupation: true, motherPhone: true, motherEmail: true,
  guardianName: true, guardianPhone: true, guardianRelation: true,
  address: true,
  updatedAt: true,
  user: { select: { email: true, mobile: true, userCode: true } },
};

const shapeProfile = (p) => {
  const { user, ...rest } = p;
  return { ...rest, loginEmail: user?.email ?? null, loginMobile: user?.mobile ?? null, userCode: user?.userCode ?? null };
};

const getMyProfile = async (req, res, next) => {
  try {
    requireParent(req);
    const parent = await prisma.parent.findUnique({ where: { id: req.user.parentId }, select: PROFILE_SELECT });
    if (!parent) throw new NotFoundError('Parent profile not found');
    return sendSuccess(res, shapeProfile(parent), 'Parent profile retrieved');
  } catch (err) {
    next(err);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    requireParent(req);

    const data = {};
    const errors = [];
    for (const field of PARENT_EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue;
      const raw = req.body[field];
      if (raw !== null && typeof raw !== 'string') {
        errors.push(`${field} must be text`);
        continue;
      }
      const value = raw === null ? null : raw.trim();
      if (value === '' || value === null) {
        data[field] = null;
        continue;
      }
      if (value.length > (MAX_LEN[field] || 120)) errors.push(`${field} is too long`);
      else if (PHONE_FIELDS.has(field) && !PHONE_RE.test(value)) errors.push(`${field} is not a valid phone number`);
      else if (EMAIL_FIELDS.has(field) && !EMAIL_RE.test(value)) errors.push(`${field} is not a valid email address`);
      else data[field] = value;
    }
    const unknown = Object.keys(req.body || {}).filter((k) => !PARENT_EDITABLE_FIELDS.includes(k));
    if (unknown.length) errors.push(`These fields can't be changed from the app: ${unknown.join(', ')}`);
    if (errors.length) throw new ValidationError(errors.join('; '));
    if (Object.keys(data).length === 0) throw new ValidationError('Nothing to update');

    const before = await prisma.parent.findUnique({ where: { id: req.user.parentId }, select: PROFILE_SELECT });
    if (!before) throw new NotFoundError('Parent profile not found');

    const parent = await prisma.parent.update({ where: { id: req.user.parentId }, data, select: PROFILE_SELECT });

    prisma.auditLog.create({
      data: {
        institutionId: req.user.institutionId || null,
        userId: req.user.id,
        action: 'PARENT_PROFILE_UPDATED',
        module: 'STUDENT',
        entity: 'Parent',
        entityId: req.user.parentId,
        oldValues: JSON.stringify(Object.fromEntries(Object.keys(data).map((k) => [k, before[k]]))),
        newValues: JSON.stringify(data),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      },
    }).catch(() => {});

    return sendSuccess(res, shapeProfile(parent), 'Your details were updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyChildren, getMyProfile, updateMyProfile, PARENT_EDITABLE_FIELDS };
