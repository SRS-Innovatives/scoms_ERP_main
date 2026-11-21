/**
 * Platform Maintenance Mode — enforced.
 *
 * The Super Admin switches it on in System → Maintenance Mode (PlatformSetting.maintenanceMode).
 * While it is on, every Institute Admin, Staff, Student, public (pre-admission) and mobile
 * request is answered with 503 + code MAINTENANCE_MODE, so the portals can show an
 * "Under maintenance" screen. The Super Admin API is never mounted behind this, so the
 * Super Admin can always get in and switch it off.
 *
 * The flag is read through the hot cache (shared/utils/hotCache.js), which drops it the moment
 * PlatformSetting is written — no database round trip per request, and switching takes
 * effect immediately in the combined server (within the cache TTL across separate processes).
 * If the settings can't be read, requests are let through (fail open), never blocked by a
 * database hiccup.
 */
const prisma = require('../database/client');
const { cached } = require('../utils/hotCache');

const MESSAGE = 'SCOMS is under maintenance right now. Please try again in a little while.';

const isMaintenanceOn = () => cached('platformSettings', 'maintenance', async () => {
  const row = await prisma.platformSetting.findUnique({ where: { id: 'global' }, select: { maintenanceMode: true } });
  return !!row?.maintenanceMode;
});

const blockDuringMaintenance = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // CORS preflight
  try {
    if (await isMaintenanceOn()) {
      res.set('Retry-After', '300');
      return res.status(503).json({ success: false, message: MESSAGE, code: 'MAINTENANCE_MODE' });
    }
  } catch {
    // fail open — a settings read error must never lock everyone out
  }
  return next();
};

module.exports = { blockDuringMaintenance, isMaintenanceOn, MAINTENANCE_MESSAGE: MESSAGE };
