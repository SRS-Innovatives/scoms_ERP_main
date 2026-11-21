/**
 * Super Admin — Feature Flags (Modules → Feature Flags).
 * Platform-wide switches defined in shared/utils/featureFlags.js; each really turns its
 * feature on or off everywhere. Every change is saved on PlatformSetting.featureFlags and
 * audit-logged.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');
const { FLAGS, KEYS } = require('../../../shared/utils/featureFlags');

const loadState = async () => {
  const row = await prisma.platformSetting.upsert({ where: { id: 'global' }, create: { id: 'global' }, update: {}, select: { featureFlags: true } });
  return row.featureFlags && typeof row.featureFlags === 'object' ? row.featureFlags : {};
};

const describe = async (state) => {
  const userIds = [...new Set(Object.values(state).map((v) => v?.updatedBy).filter(Boolean))];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } }) : [];
  const email = new Map(users.map((u) => [u.id, u.email]));
  return FLAGS.map((f) => ({
    ...f,
    enabled: state[f.key]?.enabled !== false,
    updatedAt: state[f.key]?.updatedAt || null,
    updatedBy: state[f.key]?.updatedBy ? email.get(state[f.key].updatedBy) || null : null,
  }));
};

/** GET /feature-flags */
const getFeatureFlags = async (req, res, next) => {
  try {
    return sendSuccess(res, await describe(await loadState()), 'Feature flags retrieved');
  } catch (err) {
    next(err);
  }
};

/** PUT /feature-flags/:key { enabled } */
const setFeatureFlag = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!KEYS.has(key)) throw new NotFoundError('Unknown feature flag');
    if (typeof req.body.enabled !== 'boolean') throw new ValidationError('enabled must be true or false');
    const state = await loadState();
    const before = state[key]?.enabled !== false;
    const next = { ...state, [key]: { enabled: req.body.enabled, updatedAt: new Date().toISOString(), updatedBy: req.user.id } };
    await prisma.platformSetting.update({ where: { id: 'global' }, data: { featureFlags: next } });
    prisma.auditLog.create({
      data: {
        userId: req.user.id, action: 'FEATURE_FLAG_CHANGED', module: 'SETTINGS', entity: 'FeatureFlag', entityId: key,
        oldValues: JSON.stringify({ enabled: before }), newValues: JSON.stringify({ enabled: req.body.enabled }), ipAddress: req.ip || '',
      },
    }).catch(() => {});
    const flag = FLAGS.find((f) => f.key === key);
    return sendSuccess(res, await describe(next), `${flag.name} switched ${req.body.enabled ? 'ON' : 'OFF'}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFeatureFlags, setFeatureFlag };
