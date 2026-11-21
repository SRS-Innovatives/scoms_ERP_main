/**
 * Feature Flags — platform-wide switches the Super Admin flips in Modules → Feature Flags.
 * Stored on PlatformSetting.featureFlags as { key: { enabled, updatedAt, updatedBy } }; a key
 * that isn't stored is ON, so every feature works until someone switches it off.
 *
 * Read through the hot cache (dropped the moment PlatformSetting is written), so checking a
 * flag costs nothing per request. If the settings can't be read, flags count as ON (fail
 * open) — a database hiccup never switches features off by itself.
 *
 * Where each flag is enforced:
 *   online_payments  Student_Backend feePaymentController.initiateOnlinePayment and the public
 *                    pre-admission application-fee initiate (payments already started still
 *                    complete — verify is never blocked)
 *   sms / whatsapp / email  shared/utils/notifications.js — the send is skipped and logged
 *                    with status DISABLED
 *   mobile_apps      scoms-app-backend/src/app.js — the mobile API answers 503 FEATURE_DISABLED
 */
const prisma = require('../database/client');
const { cached } = require('./hotCache');

const FLAGS = [
  {
    key: 'online_payments',
    name: 'Online fee payments',
    description: 'Students paying fees online (Razorpay) and the public admission form taking the application fee online.',
    whenOff: 'Nobody can start a new online payment — they are asked to pay at the fee office. Payments already in progress still complete.',
  },
  {
    key: 'sms',
    name: 'SMS sending',
    description: 'Every SMS the platform sends — fee reminders, broadcasts, login credentials, alerts.',
    whenOff: 'No SMS goes out from any institution; each attempt is logged as "Disabled by platform".',
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp sending',
    description: 'Every WhatsApp message the platform sends.',
    whenOff: 'No WhatsApp message goes out from any institution; each attempt is logged as "Disabled by platform".',
  },
  {
    key: 'email',
    name: 'Email sending',
    description: 'Every email the platform sends — credentials, password resets, broadcasts, alerts.',
    whenOff: 'No email goes out from any institution (including password-reset emails); each attempt is logged as "Disabled by platform".',
  },
  {
    key: 'mobile_apps',
    name: 'Mobile apps access',
    description: 'The SCOMS student and staff mobile apps.',
    whenOff: 'The apps show "temporarily unavailable — please use the website"; the web portals keep working.',
  },
];
const KEYS = new Set(FLAGS.map((f) => f.key));

const getFeatureFlagState = () => cached('platformSettings', 'featureFlags', async () => {
  const row = await prisma.platformSetting.findUnique({ where: { id: 'global' }, select: { featureFlags: true } });
  return row?.featureFlags && typeof row.featureFlags === 'object' ? row.featureFlags : {};
});

/** Whether a flag is ON (missing = ON; read errors = ON). */
const isFeatureOn = async (key) => {
  try {
    const state = await getFeatureFlagState();
    return state[key]?.enabled !== false;
  } catch {
    return true;
  }
};

module.exports = { FLAGS, KEYS, isFeatureOn, getFeatureFlagState };
