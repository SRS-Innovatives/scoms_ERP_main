/**
 * Student — My House. The student's own house (colour, mentor, members), its points and
 * rank among all the institution's houses, and the latest point entries. A house's total
 * is always the sum of its HousePointEntry rows (same rule as the Institute Admin's
 * Houses page).
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

const getMyHouse = async (req, res, next) => {
  try {
    const me = await prisma.student.findFirst({
      where: { id: req.user.studentId, institutionId: req.institutionId },
      select: { houseId: true },
    });
    if (!me) throw new NotFoundError('Student profile not found');
    if (!me.houseId) return sendSuccess(res, null, 'You are not in a house yet');

    const houses = await prisma.house.findMany({
      where: { institutionId: req.institutionId },
      select: { id: true, name: true, color: true },
    });
    const totals = await prisma.housePointEntry.groupBy({
      by: ['houseId'],
      where: { houseId: { in: houses.map((h) => h.id) } },
      _sum: { points: true },
    });
    const pointsById = Object.fromEntries(totals.map((t) => [t.houseId, t._sum.points || 0]));
    // Standings: highest points first (ties share the rank of the first house with that total)
    const standings = houses
      .map((h) => ({ ...h, points: pointsById[h.id] || 0 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    standings.forEach((h, i) => { h.rank = i > 0 && h.points === standings[i - 1].points ? standings[i - 1].rank : i + 1; });

    const [house, members, recent] = await Promise.all([
      prisma.house.findUnique({
        where: { id: me.houseId },
        select: { id: true, name: true, color: true, description: true, mentor: { select: { firstName: true, lastName: true } } },
      }),
      prisma.student.count({ where: { houseId: me.houseId, deletedAt: null } }),
      prisma.housePointEntry.findMany({
        where: { houseId: me.houseId },
        select: { id: true, points: true, reason: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    const mine = standings.find((h) => h.id === me.houseId);

    return sendSuccess(res, {
      house: {
        ...house,
        mentorName: house?.mentor ? `${house.mentor.firstName || ''} ${house.mentor.lastName || ''}`.trim() : null,
        mentor: undefined,
        members,
        points: mine?.points || 0,
        rank: mine?.rank || null,
        totalHouses: standings.length,
      },
      standings,
      recentPoints: recent,
    }, 'House retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyHouse };
