/**
 * Infrastructure Controller (Campus -> Building -> Floor -> Room)
 *
 * The Room master is shared by Timetable, Exam seating and Hostel through their optional
 * roomId columns - this controller only owns the master data itself.
 */

const {
  prisma,
  sendSuccess,
  NotFoundError,
  BusinessRuleError,
  ValidationError,
} = require('../../../shared');

const ROOM_TYPES = ['CLASSROOM', 'LAB', 'HALL', 'OFFICE', 'LIBRARY', 'HOSTEL_ROOM', 'STAFF_ROOM', 'OTHER'];

const toIntOrNull = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const toBool = (v) => v === true || v === 'true';

const findCampus = async (campusId, institutionId) => {
  if (campusId === undefined) return undefined;
  if (!campusId) return null;
  const campus = await prisma.campus.findFirst({ where: { id: campusId, institutionId } });
  if (!campus) throw new NotFoundError('Campus not found or access denied');
  return campusId;
};

// ============================================================
// Campuses
// ============================================================
const getCampuses = async (req, res, next) => {
  try {
    const campuses = await prisma.campus.findMany({
      where: { institutionId: req.institutionId },
      include: { _count: { select: { buildings: true } } },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });
    return sendSuccess(res, campuses, 'Campuses retrieved');
  } catch (err) {
    next(err);
  }
};

const createCampus = async (req, res, next) => {
  try {
    const { code, name, address, city, capacity, isMain } = req.body;
    if (!code || !name) throw new ValidationError('Campus code and name are required');

    const campus = await prisma.$transaction(async (tx) => {
      if (toBool(isMain)) {
        await tx.campus.updateMany({ where: { institutionId: req.institutionId, isMain: true }, data: { isMain: false } });
      }
      return tx.campus.create({
        data: {
          institutionId: req.institutionId,
          code,
          name,
          address: address || null,
          city: city || null,
          capacity: toIntOrNull(capacity),
          isMain: toBool(isMain),
        },
      });
    });
    return sendSuccess(res, campus, 'Campus created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateCampus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, address, city, capacity, isMain, isActive } = req.body;
    const existing = await prisma.campus.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Campus not found');

    const campus = await prisma.$transaction(async (tx) => {
      if (toBool(isMain)) {
        await tx.campus.updateMany({ where: { institutionId: req.institutionId, isMain: true, NOT: { id } }, data: { isMain: false } });
      }
      return tx.campus.update({
        where: { id },
        data: {
          ...(code !== undefined && { code }),
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address: address || null }),
          ...(city !== undefined && { city: city || null }),
          ...(capacity !== undefined && { capacity: toIntOrNull(capacity) }),
          ...(isMain !== undefined && { isMain: toBool(isMain) }),
          ...(isActive !== undefined && { isActive: toBool(isActive) }),
        },
      });
    });
    return sendSuccess(res, campus, 'Campus updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteCampus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.campus.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { buildings: true } } },
    });
    if (!existing) throw new NotFoundError('Campus not found');
    if (existing._count.buildings > 0) {
      throw new BusinessRuleError('Cannot delete a Campus with buildings linked to it - deactivate it instead');
    }
    await prisma.campus.delete({ where: { id } });
    return sendSuccess(res, null, 'Campus deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Buildings (+ their floors, managed inline)
// ============================================================
const getBuildings = async (req, res, next) => {
  try {
    const { campusId } = req.query;
    const buildings = await prisma.building.findMany({
      where: { institutionId: req.institutionId, ...(campusId && { campusId }) },
      include: {
        campus: { select: { id: true, name: true, code: true } },
        floors: { orderBy: { floorNumber: 'asc' }, include: { _count: { select: { rooms: true } } } },
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, buildings, 'Buildings retrieved');
  } catch (err) {
    next(err);
  }
};

const createBuilding = async (req, res, next) => {
  try {
    const { campusId, code, name, description, floorCount } = req.body;
    if (!code || !name) throw new ValidationError('Building code and name are required');
    const resolvedCampusId = await findCampus(campusId, req.institutionId);
    const floors = toIntOrNull(floorCount);
    if (floors !== null && (!Number.isInteger(floors) || floors < 0 || floors > 100)) {
      throw new ValidationError('floorCount must be between 0 and 100');
    }

    const building = await prisma.building.create({
      data: {
        institutionId: req.institutionId,
        code,
        name,
        description: description || null,
        ...(resolvedCampusId && { campusId: resolvedCampusId }),
        // Convenience: auto-create floors 0..n-1 (Ground, 1st, ...); more can be added later.
        ...(floors && {
          floors: { create: Array.from({ length: floors }, (_, i) => ({ floorNumber: i, name: i === 0 ? 'Ground Floor' : `Floor ${i}` })) },
        }),
      },
      include: { floors: true },
    });
    return sendSuccess(res, building, 'Building created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { campusId, code, name, description, isActive } = req.body;
    const existing = await prisma.building.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Building not found');
    const resolvedCampusId = await findCampus(campusId, req.institutionId);

    const building = await prisma.building.update({
      where: { id },
      data: {
        ...(resolvedCampusId !== undefined && { campusId: resolvedCampusId }),
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive: toBool(isActive) }),
      },
    });
    return sendSuccess(res, building, 'Building updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.building.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { rooms: true } } },
    });
    if (!existing) throw new NotFoundError('Building not found');
    if (existing._count.rooms > 0) {
      throw new BusinessRuleError('Cannot delete a Building with rooms in it - deactivate it instead');
    }
    await prisma.building.delete({ where: { id } });
    return sendSuccess(res, null, 'Building deleted successfully');
  } catch (err) {
    next(err);
  }
};

const createFloor = async (req, res, next) => {
  try {
    const { id: buildingId } = req.params;
    const { floorNumber, name } = req.body;
    const n = Number(floorNumber);
    if (!Number.isInteger(n)) throw new ValidationError('floorNumber must be an integer');
    const building = await prisma.building.findFirst({ where: { id: buildingId, institutionId: req.institutionId } });
    if (!building) throw new NotFoundError('Building not found');

    const floor = await prisma.floor.create({ data: { buildingId, floorNumber: n, name: name || null } });
    return sendSuccess(res, floor, 'Floor added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteFloor = async (req, res, next) => {
  try {
    const { floorId } = req.params;
    const floor = await prisma.floor.findFirst({
      where: { id: floorId, building: { institutionId: req.institutionId } },
      include: { _count: { select: { rooms: true } } },
    });
    if (!floor) throw new NotFoundError('Floor not found');
    if (floor._count.rooms > 0) throw new BusinessRuleError('Cannot delete a Floor with rooms on it');
    await prisma.floor.delete({ where: { id: floorId } });
    return sendSuccess(res, null, 'Floor deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Rooms
// ============================================================
const resolveRoomParents = async (buildingId, floorId, institutionId) => {
  const building = await prisma.building.findFirst({ where: { id: buildingId, institutionId } });
  if (!building) throw new NotFoundError('Building not found or access denied');
  if (floorId) {
    const floor = await prisma.floor.findFirst({ where: { id: floorId, buildingId } });
    if (!floor) throw new ValidationError('Floor does not belong to the selected building');
  }
};

const getRooms = async (req, res, next) => {
  try {
    const { buildingId, type, activeOnly } = req.query;
    const rooms = await prisma.room.findMany({
      where: {
        institutionId: req.institutionId,
        ...(buildingId && { buildingId }),
        ...(type && { type }),
        ...(activeOnly === 'true' && { isActive: true }),
      },
      include: {
        building: { select: { id: true, name: true, code: true, campus: { select: { id: true, name: true } } } },
        floor: { select: { id: true, floorNumber: true, name: true } },
      },
      orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
    });
    return sendSuccess(res, rooms, 'Rooms retrieved');
  } catch (err) {
    next(err);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { buildingId, floorId, roomNumber, name, type, capacity } = req.body;
    if (!buildingId || !roomNumber) throw new ValidationError('buildingId and roomNumber are required');
    if (type && !ROOM_TYPES.includes(type)) throw new ValidationError(`Room type must be one of ${ROOM_TYPES.join(', ')}`);
    await resolveRoomParents(buildingId, floorId, req.institutionId);

    const room = await prisma.room.create({
      data: {
        institutionId: req.institutionId,
        buildingId,
        floorId: floorId || null,
        roomNumber: String(roomNumber).trim(),
        name: name || null,
        ...(type && { type }),
        capacity: toIntOrNull(capacity),
      },
    });
    return sendSuccess(res, room, 'Room created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { floorId, roomNumber, name, type, capacity, isActive } = req.body;
    const existing = await prisma.room.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Room not found');
    if (type && !ROOM_TYPES.includes(type)) throw new ValidationError(`Room type must be one of ${ROOM_TYPES.join(', ')}`);
    if (floorId) await resolveRoomParents(existing.buildingId, floorId, req.institutionId);

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(floorId !== undefined && { floorId: floorId || null }),
        ...(roomNumber !== undefined && { roomNumber: String(roomNumber).trim() }),
        ...(name !== undefined && { name: name || null }),
        ...(type !== undefined && { type }),
        ...(capacity !== undefined && { capacity: toIntOrNull(capacity) }),
        ...(isActive !== undefined && { isActive: toBool(isActive) }),
      },
    });
    return sendSuccess(res, room, 'Room updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.room.findFirst({
      where: { id, institutionId: req.institutionId },
      include: { _count: { select: { timetableEntries: true, examSchedules: true, hostelBeds: true } } },
    });
    if (!existing) throw new NotFoundError('Room not found');
    const { timetableEntries, examSchedules, hostelBeds } = existing._count;
    if (timetableEntries + examSchedules + hostelBeds > 0) {
      throw new BusinessRuleError('Room is used by timetables, exams or hostel beds - deactivate it instead');
    }
    await prisma.room.delete({ where: { id } });
    return sendSuccess(res, null, 'Room deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ROOM_TYPES,
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createFloor,
  deleteFloor,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
};
