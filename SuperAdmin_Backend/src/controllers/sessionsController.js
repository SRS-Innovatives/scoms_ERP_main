/**
 * Super Admin — Active Sessions (Security → Sessions).
 *
 * The real signed-in sessions across every portal (shared/auth/sessions.js): who, which
 * portal, IP, browser / app, signed in, last active — with live counts. Revoke signs that
 * device out (its access token stops working on the next request); "sign out everywhere"
 * ends every session of one user. Expired rows are cleared as the list is read.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');
const { forgetSessions } = require('../../../shared/auth/sessions');

const PAGE_SIZE = 25;
const MOBILE_HINTS = ['Mobile', 'Android', 'iPhone', 'iPad', 'okhttp', 'Expo', 'Dalvik', 'CFNetwork'];

/** Browser / app, operating system and device type from a user agent. */
const describeAgent = (ua) => {
  const s = String(ua || '');
  if (!s) return { client: 'Unknown', os: 'Unknown', device: 'Unknown' };
  const app = /okhttp|Expo|Dalvik|CFNetwork|ReactNative/i.test(s);
  const client = app ? 'SCOMS mobile app'
    : /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera' : /Firefox\//.test(s) ? 'Firefox'
      : /Chrome\//.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : /curl|PostmanRuntime|node-fetch|undici|axios/i.test(s) ? 'API client' : 'Other';
  const os = /Android/.test(s) ? 'Android' : /iPhone|iPad|iOS/.test(s) ? 'iOS' : /Windows/.test(s) ? 'Windows'
    : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : 'Unknown';
  const device = app || /Mobile|Android|iPhone/.test(s) ? 'Mobile' : /iPad|Tablet/.test(s) ? 'Tablet' : 'Desktop';
  return { client, os, device };
};

const audit = (req, action, entityId, details) => prisma.auditLog.create({
  data: { userId: req.user.id, action, module: 'SECURITY', entity: 'Session', entityId, newValues: JSON.stringify(details), ipAddress: req.ip || '' },
}).catch(() => {});

/** GET /sessions?page=&portal=&search= */
const getSessions = async (req, res, next) => {
  try {
    const now = new Date();
    await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }); // housekeeping

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const live = { expiresAt: { gt: now } };
    const search = String(req.query.search || '').trim();
    const where = {
      ...live,
      ...(req.query.portal && { portal: req.query.portal === 'UNKNOWN' ? null : req.query.portal }),
      ...(search && {
        OR: [
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { institution: { name: { contains: search, mode: 'insensitive' } } } },
          { ipAddress: { contains: search } },
        ],
      }),
    };
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [rows, total, all, recent, byPortal, mobile, users] = await Promise.all([
      prisma.refreshToken.findMany({
        where,
        orderBy: { lastUsedAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, portal: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true, expiresAt: true,
          user: { select: { id: true, email: true, role: true, institution: { select: { name: true, code: true } } } },
        },
      }),
      prisma.refreshToken.count({ where }),
      prisma.refreshToken.count({ where: live }),
      prisma.refreshToken.count({ where: { ...live, lastUsedAt: { gte: fifteenMinAgo } } }),
      prisma.refreshToken.groupBy({ by: ['portal'], where: live, _count: { _all: true } }),
      prisma.refreshToken.count({ where: { ...live, OR: MOBILE_HINTS.map((h) => ({ userAgent: { contains: h } })) } }),
      prisma.refreshToken.findMany({ where: live, select: { userId: true }, distinct: ['userId'] }),
    ]);
    return res.status(200).json({
      success: true,
      message: 'Sessions retrieved',
      data: {
        stats: {
          active: all,
          activeLast15Min: recent,
          users: users.length,
          mobile,
          desktop: all - mobile,
          byPortal: Object.fromEntries(byPortal.map((p) => [p.portal || 'UNKNOWN', p._count._all])),
        },
        sessions: rows.map((r) => ({ ...r, ...describeAgent(r.userAgent), current: r.id === req.user.sid })),
      },
      meta: { page, limit: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** DELETE /sessions/:id — sign that device out. */
const revokeSession = async (req, res, next) => {
  try {
    const row = await prisma.refreshToken.findUnique({ where: { id: req.params.id }, select: { id: true, portal: true, user: { select: { email: true } } } });
    if (!row) throw new NotFoundError('Session not found — it may have already ended');
    await prisma.refreshToken.delete({ where: { id: row.id } });
    forgetSessions([row.id]);
    audit(req, 'SESSION_REVOKED', row.id, { user: row.user.email, portal: row.portal });
    return sendSuccess(res, { id: row.id }, `Signed ${row.user.email} out of that session`);
  } catch (err) {
    next(err);
  }
};

/** POST /sessions/revoke-user { userId } — sign one user out everywhere. */
const revokeUserSessions = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new ValidationError('userId is required');
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new NotFoundError('User not found');
    const rows = await prisma.refreshToken.findMany({ where: { userId }, select: { id: true } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    forgetSessions(rows.map((r) => r.id));
    audit(req, 'SESSIONS_REVOKED_ALL', user.id, { user: user.email, sessions: rows.length });
    return sendSuccess(res, { count: rows.length }, `Signed ${user.email} out of ${rows.length} session(s)`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSessions, revokeSession, revokeUserSessions, describeAgent };
