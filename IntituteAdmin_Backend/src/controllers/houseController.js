/**
 * Institute Admin — Houses / Groups: houses with a mentor teacher, member students and a
 * points log. A house's total is always the sum of its HousePointEntry rows.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const findHouse = async (id, institutionId) => {
  const house = await prisma.house.findFirst({ where: { id, institutionId } });
  if (!house) throw new NotFoundError('House not found');
  return house;
};

const resolveMentor = async (mentorStaffId, institutionId) => {
  if (mentorStaffId === undefined) return undefined;
  if (!mentorStaffId) return null;
  const staff = await prisma.staff.findFirst({ where: { id: mentorStaffId, institutionId }, select: { id: true } });
  if (!staff) throw new NotFoundError('Mentor staff member not found');
  return staff.id;
};

const getHouses = async (req, res, next) => {
  try {
    const houses = await prisma.house.findMany({
      where: { institutionId: req.institutionId },
      include: {
        mentor: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { students: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });
    const totals = await prisma.housePointEntry.groupBy({
      by: ['houseId'],
      where: { houseId: { in: houses.map((h) => h.id) } },
      _sum: { points: true },
    });
    const totalByHouse = Object.fromEntries(totals.map((t) => [t.houseId, t._sum.points || 0]));
    const rows = houses.map((h) => ({ ...h, members: h._count.students, points: totalByHouse[h.id] || 0, _count: undefined }));
    // Standings: highest points first
    const ranked = [...rows].sort((a, b) => b.points - a.points).map((h, i) => ({ id: h.id, rank: i + 1 }));
    const rankById = Object.fromEntries(ranked.map((r) => [r.id, r.rank]));
    return sendSuccess(res, rows.map((h) => ({ ...h, rank: rankById[h.id] })), 'Houses retrieved');
  } catch (err) {
    next(err);
  }
};

const createHouse = async (req, res, next) => {
  try {
    const { name, color, description, mentorStaffId } = req.body;
    if (!name || !String(name).trim()) throw new ValidationError('House name is required');
    if (color && !COLOR_PATTERN.test(color)) throw new ValidationError('Colour must be a hex value like #e11d48');
    const mentor = await resolveMentor(mentorStaffId, req.institutionId);
    const house = await prisma.house.create({
      data: { institutionId: req.institutionId, name: String(name).trim(), ...(color && { color }), description: description || null, mentorStaffId: mentor || null },
    });
    return sendSuccess(res, house, 'House created', 201);
  } catch (err) {
    next(err);
  }
};

const updateHouse = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const { name, color, description, mentorStaffId } = req.body;
    if (name !== undefined && !String(name).trim()) throw new ValidationError('House name is required');
    if (color && !COLOR_PATTERN.test(color)) throw new ValidationError('Colour must be a hex value like #e11d48');
    const mentor = await resolveMentor(mentorStaffId, req.institutionId);
    const updated = await prisma.house.update({
      where: { id: house.id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(color && { color }),
        ...(description !== undefined && { description: description || null }),
        ...(mentor !== undefined && { mentorStaffId: mentor }),
      },
    });
    return sendSuccess(res, updated, 'House updated');
  } catch (err) {
    next(err);
  }
};

const deleteHouse = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    // Members simply become unassigned (Student.houseId -> NULL); the points log goes with the house
    await prisma.house.delete({ where: { id: house.id } });
    return sendSuccess(res, null, 'House deleted');
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const students = await prisma.student.findMany({
      where: { houseId: house.id, institutionId: req.institutionId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true, section: { select: { name: true, semester: { select: { course: { select: { name: true } } } } } } },
      orderBy: [{ firstName: 'asc' }],
    });
    return sendSuccess(res, students, 'House members retrieved');
  } catch (err) {
    next(err);
  }
};

/** Assign students to this house — by explicit ids, or every active student of a section.
 * A student belongs to one house at a time, so this moves them from any other house. */
const assignMembers = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const { studentIds, sectionId } = req.body;
    let where;
    if (Array.isArray(studentIds) && studentIds.length) where = { id: { in: studentIds }, institutionId: req.institutionId };
    else if (sectionId) where = { sectionId, institutionId: req.institutionId, status: 'ACTIVE', deletedAt: null };
    else throw new ValidationError('Send studentIds or a sectionId');
    const result = await prisma.student.updateMany({ where, data: { houseId: house.id } });
    if (Array.isArray(studentIds) && result.count !== new Set(studentIds).size) {
      throw new NotFoundError(`${new Set(studentIds).size - result.count} student(s) were not found in this institution`);
    }
    return sendSuccess(res, { assigned: result.count }, `${result.count} student(s) added to ${house.name}`);
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const result = await prisma.student.updateMany({ where: { id: req.params.studentId, houseId: house.id, institutionId: req.institutionId }, data: { houseId: null } });
    if (!result.count) throw new NotFoundError('That student is not in this house');
    return sendSuccess(res, null, 'Student removed from the house');
  } catch (err) {
    next(err);
  }
};

const getPoints = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const entries = await prisma.housePointEntry.findMany({ where: { houseId: house.id }, orderBy: { createdAt: 'desc' }, take: 200 });
    return sendSuccess(res, entries, 'Points log retrieved');
  } catch (err) {
    next(err);
  }
};

const awardPoints = async (req, res, next) => {
  try {
    const house = await findHouse(req.params.id, req.institutionId);
    const points = Number(req.body.points);
    const reason = String(req.body.reason || '').trim();
    if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 10000) throw new ValidationError('Points must be a whole number (negative to deduct), up to 10000');
    if (!reason) throw new ValidationError('A reason is required (e.g. "Inter-house football, 1st place")');
    const entry = await prisma.housePointEntry.create({ data: { houseId: house.id, points, reason, awardedById: req.user.id } });
    return sendSuccess(res, entry, points > 0 ? `${points} points awarded to ${house.name}` : `${-points} points deducted from ${house.name}`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getHouses, createHouse, updateHouse, deleteHouse, getMembers, assignMembers, removeMember, getPoints, awardPoints };
