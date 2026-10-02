/**
 * Shared Room lookup for modules that point at the Campus/Building/Floor/Room master
 * (Timetable, Exam seating, Hostel). The legacy free-text roomNumber stays the display
 * value; when a roomId is given it must belong to the caller's institution, and its
 * roomNumber fills in a blank legacy value.
 */
const prisma = require('../database/client');
const { NotFoundError } = require('../errors/customErrors');

/**
 * Returns undefined when roomId was not sent, null when it was cleared, or the Room row.
 * Pass the transaction client as `db` when called inside $transaction.
 */
const resolveRoom = async (roomId, institutionId, db = prisma) => {
  if (roomId === undefined) return undefined;
  if (!roomId) return null;
  const room = await db.room.findFirst({ where: { id: roomId, institutionId, isActive: true } });
  if (!room) throw new NotFoundError('Room not found or access denied');
  return room;
};

/** Batch variant for bulk writes (e.g. a whole timetable grid) - one query, keyed by id. */
const resolveRoomsById = async (roomIds, institutionId, db = prisma) => {
  const ids = [...new Set(roomIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const rooms = await db.room.findMany({ where: { id: { in: ids }, institutionId, isActive: true } });
  if (rooms.length !== ids.length) throw new NotFoundError('One or more rooms are invalid for this institution');
  return new Map(rooms.map((r) => [r.id, r]));
};

module.exports = { resolveRoom, resolveRoomsById };
