/**
 * Super Admin Users Controller
 */
const { prisma, sendSuccess, sendPaginated } = require('../../../shared');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { institution: { select: { name: true } } }
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords before sending
    const safeUsers = users.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    return sendPaginated(res, safeUsers, page, limit, total, 'Users retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
};
