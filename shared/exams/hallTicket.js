/**
 * Hall ticket helpers shared by the Institute Admin (whole section) and the student's own
 * hall ticket download.
 */
const prisma = require('../database/client');
const { notSkippedElectiveWhere } = require('../academic/electives');

/** A student may download their hall ticket while the exam is upcoming or running —
 * not once it's COMPLETED (or CANCELLED). A new exam starts as SCHEDULED. */
const HALL_TICKET_EXAM_STATUSES = ['SCHEDULED', 'ONGOING'];

/** roomId → "Building · Room" label for the venue column. */
const roomNamesById = async (roomIds, institutionId) => {
  const ids = [...new Set(roomIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const rooms = await prisma.room.findMany({ where: { id: { in: ids }, institutionId }, select: { id: true, roomNumber: true, name: true, building: { select: { name: true } } } });
  return new Map(rooms.map((r) => [r.id, [r.building?.name, r.name || r.roomNumber].filter(Boolean).join(' · ')]));
};

/** The schedule rows of one exam for one class (course), with venue labels. */
const hallTicketSchedule = async (examId, courseId, institutionId, studentId = null) => {
  const schedules = await prisma.examSchedule.findMany({
    // for one student: leave out papers of electives they didn't choose
    where: { examId, courseId, ...(studentId && { subject: notSkippedElectiveWhere({ id: studentId, courseId }) }) },
    include: { subject: { select: { name: true, code: true } } },
    orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
  });
  const rooms = await roomNamesById(schedules.map((s) => s.roomId), institutionId);
  return schedules.map((s) => ({
    code: s.subject.code, subject: s.subject.name, examDate: s.examDate, startTime: s.startTime, endTime: s.endTime,
    venue: rooms.get(s.roomId) || s.roomNumber || null,
  }));
};

module.exports = { HALL_TICKET_EXAM_STATUSES, roomNamesById, hallTicketSchedule };
