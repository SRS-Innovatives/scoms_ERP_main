/**
 * Super Admin Platform Settings Controller
 */
const { prisma, sendSuccess } = require('../../../shared');

const DEFAULTS = {
  id: 'global',
  appName: 'SCOMS Platform',
  timezone: 'Asia/Kolkata',
  currency: 'INR (₹)',
  localization: 'English',
  maintenanceMode: false,
};

const getSettings = async (req, res, next) => {
  try {
    // Upsert-on-read so the very first call self-heals the singleton row instead of 404ing
    const settings = await prisma.platformSetting.upsert({
      where: { id: 'global' },
      create: DEFAULTS,
      update: {},
    });

    return sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { appName, timezone, currency, localization, maintenanceMode } = req.body;

    const settings = await prisma.platformSetting.upsert({
      where: { id: 'global' },
      create: {
        ...DEFAULTS,
        ...(appName !== undefined && { appName }),
        ...(timezone !== undefined && { timezone }),
        ...(currency !== undefined && { currency }),
        ...(localization !== undefined && { localization }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        updatedBy: req.user?.id || null,
      },
      update: {
        ...(appName !== undefined && { appName }),
        ...(timezone !== undefined && { timezone }),
        ...(currency !== undefined && { currency }),
        ...(localization !== undefined && { localization }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        updatedBy: req.user?.id || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'PLATFORM_SETTINGS_UPDATED',
        module: 'SETTINGS',
        entity: 'PlatformSetting',
        entityId: settings.id,
        newValues: req.body,
      },
    }).catch(() => {});

    return sendSuccess(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
