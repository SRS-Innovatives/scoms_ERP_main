/**
 * Signed-in sessions.
 *
 * Every login creates one RefreshToken row — one session on one device — recording the
 * portal, IP address, browser/app (user agent) and when it was last used. Its id travels as
 * `sid` inside every access token issued for it, and token renewal keeps the same row (the
 * token value rotates, the session does not), so the Super Admin can see real sessions and
 * revoke one: requireAuth rejects any access token whose session no longer exists.
 *
 * The "does this session still exist" check is cached per session for SESSION_CHECK_MS, so
 * it costs at most one small query per session per minute (which also refreshes
 * lastUsedAt). A revoke takes effect immediately in this process and within that window in
 * any other process. Tokens issued before sessions carried a `sid` are left alone until they
 * expire, so deploying this signs nobody out.
 */
const prisma = require('../database/client');
const { randomUUID } = require('crypto');
const { generateRefreshToken } = require('./jwt');

const SESSION_DAYS = 7;
const SESSION_CHECK_MS = 60 * 1000;
const MAX_CACHE = 50000;

const PORTALS = [
  ['/api/v1/mobile/student', 'MOBILE_STUDENT'],
  ['/api/v1/mobile/staff', 'MOBILE_STAFF'],
  ['/api/v1/super-admin', 'SUPER_ADMIN'],
  ['/api/v1/admin', 'INSTITUTE_ADMIN'],
  ['/api/v1/staff', 'STAFF'],
  ['/api/v1/student', 'STUDENT'],
];

/** Which portal a request came through (from its URL). */
const portalOf = (req) => {
  const url = req.originalUrl || req.url || '';
  const hit = PORTALS.find(([prefix]) => url.startsWith(prefix));
  return hit ? hit[1] : null;
};

/** The caller's real IP — behind Render's proxy that's the first X-Forwarded-For entry. */
const clientIp = (req) => {
  const fwd = req.headers?.['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || '').split(',')[0];
  return (first || req.ip || req.socket?.remoteAddress || '').trim().replace(/^::ffff:/, '').slice(0, 64) || null;
};

/** Creates the session row for a login → { sid, refreshToken }. */
const createSession = async (db, { userId, payload, req }) => {
  // jti makes every refresh token unique — two logins in the same second used to produce the
  // identical token and the second one failed on the unique key
  const refreshToken = generateRefreshToken({ ...payload, jti: randomUUID() });
  const row = await db.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      portal: portalOf(req),
      ipAddress: clientIp(req),
      userAgent: (req.get ? req.get('user-agent') : req.headers?.['user-agent'])?.slice(0, 400) || null,
    },
    select: { id: true },
  });
  return { sid: row.id, refreshToken };
};

// ---- the per-request check -------------------------------------------------
const cache = new Map(); // sid → { active, checkedAt }

const isSessionActive = async (sid) => {
  const now = Date.now();
  const hit = cache.get(sid);
  if (hit && now - hit.checkedAt < SESSION_CHECK_MS) return hit.active;
  let active = false;
  try {
    const row = await prisma.refreshToken.findUnique({ where: { id: sid }, select: { expiresAt: true } });
    active = !!row && row.expiresAt > new Date();
    if (active) prisma.refreshToken.update({ where: { id: sid }, data: { lastUsedAt: new Date() } }).catch(() => {});
  } catch {
    active = hit ? hit.active : true; // database hiccup: keep the last answer, never lock everyone out
  }
  if (cache.size > MAX_CACHE) cache.clear();
  cache.set(sid, { active, checkedAt: now });
  return active;
};

/** Forget cached answers for these sessions (after a revoke or logout) — immediate in this process. */
const forgetSessions = (sids) => sids.forEach((s) => cache.delete(s));

module.exports = { createSession, isSessionActive, forgetSessions, portalOf, clientIp, SESSION_DAYS };
