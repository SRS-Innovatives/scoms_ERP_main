/**
 * Resolves which child a logged-in Parent is currently viewing, and makes every existing
 * student-scoped route work for them for free.
 *
 * The bug this fixes: a Parent's JWT only ever carried role + parentId — never a
 * studentId, because a parent can have more than one child. But ~60 Student_Backend
 * controllers read `req.user.studentId` directly, assuming the caller IS the student.
 * Before this middleware, that meant every one of those endpoints silently returned
 * nothing (or errored) for a Parent — the "parent portal" was not a design gap, it was
 * non-functional.
 *
 * The fix: a Parent sends which child they mean via `?studentId=` (or `X-Active-Student-Id`
 * header) on every request; this middleware verifies that child is REALLY theirs via the
 * real ParentStudent link table (never trusts the id blindly — that's the tenant-isolation
 * equivalent for "which of MY children", not just "which institution"), then rewrites
 * req.user.studentId to it. Every one of those 60 controllers then just works, unmodified,
 * for a Parent exactly as it already does for a Student — no per-controller changes needed.
 * A Student caller is untouched (their JWT already carries their own real studentId).
 */
const prisma = require('../database/client');
const { AuthorizationError } = require('../errors/customErrors');
const { ROLES } = require('../constants/roles');

const resolveActiveChild = async (req, res, next) => {
  try {
    if (req.user?.role !== ROLES.PARENT) return next();
    if (!req.user.parentId) throw new AuthorizationError('This parent account is not linked to any student record — contact your institution.');

    const requestedStudentId = req.query.studentId || req.headers['x-active-student-id'];

    const links = await prisma.parentStudent.findMany({
      where: { parentId: req.user.parentId },
      select: { studentId: true },
    });
    if (links.length === 0) throw new AuthorizationError('This parent account is not linked to any student record — contact your institution.');

    const linkedIds = links.map((l) => l.studentId);
    let activeStudentId = requestedStudentId;

    if (activeStudentId) {
      if (!linkedIds.includes(activeStudentId)) {
        throw new AuthorizationError('That student is not linked to your parent account.');
      }
    } else {
      activeStudentId = linkedIds[0]; // exactly one child in the common case — first (only) link
    }

    req.user.studentId = activeStudentId;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveActiveChild;
