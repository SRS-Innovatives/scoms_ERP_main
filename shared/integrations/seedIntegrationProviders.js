/**
 * Idempotent seed for IntegrationProvider (Phase 12) — mirrors seedModuleRegistry.js's
 * upsert convention exactly. Registers the real active provider for each channel the
 * app already has code for (status computed the same way systemController's
 * LIVE/SIMULATED readout does — an env var check, never fabricated), plus honest
 * NOT_IMPLEMENTED rows for the channels the spec lists that have no code path yet.
 * Running this again after real credentials are added just updates status LIVE — it
 * never invents functionality.
 */
const prisma = require('../database/client');

const isConfigured = (...envVars) =>
  envVars.every((v) => v && !v.includes('your-') && !v.includes('example.com') && !v.includes('scoms.in') && v !== 'rzp_test_key' && v !== 'rzp_test_secret');

const PROVIDERS = [
  {
    channel: 'SMS',
    providerName: 'Fast2SMS',
    isActive: true,
    liveCheck: () => isConfigured(process.env.SMS_API_KEY),
    notes: 'shared/utils/notifications.js — sendSMSNotification()',
  },
  {
    channel: 'EMAIL',
    providerName: 'SMTP (Nodemailer)',
    isActive: true,
    liveCheck: () => isConfigured(process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASSWORD),
    notes: 'shared/utils/notifications.js — sendEmailNotification()',
  },
  {
    channel: 'WHATSAPP',
    providerName: 'Meta WhatsApp Business Cloud API',
    isActive: true,
    liveCheck: () => isConfigured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID),
    notes: 'shared/utils/notifications.js — sendWhatsAppNotification()',
  },
  {
    channel: 'PAYMENT_GATEWAY',
    providerName: 'Razorpay',
    isActive: true,
    liveCheck: () => isConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET),
    notes: 'shared/utils/paymentGateway.js — real HMAC-SHA256 signature verification when live',
  },
  {
    channel: 'CLOUD_STORAGE',
    providerName: 'Amazon S3',
    isActive: false,
    status: 'NOT_IMPLEMENTED',
    notes: 'STORAGE_* env vars are placeholders — no code reads them yet. File uploads are currently parsed in-memory only, never persisted.',
  },
  {
    channel: 'VIDEO_MEETING',
    providerName: 'Not yet selected',
    isActive: false,
    status: 'NOT_IMPLEMENTED',
    notes: 'No video-meeting code path exists in this codebase yet (e.g. for virtual PTM / online classes).',
  },
  {
    channel: 'BIOMETRIC',
    providerName: 'Not yet selected',
    isActive: false,
    status: 'NOT_IMPLEMENTED',
    notes: 'Biometric attendance was explicitly deferred earlier this session pending a hardware vendor decision.',
  },
  {
    channel: 'RFID',
    providerName: 'Not yet selected',
    isActive: false,
    status: 'NOT_IMPLEMENTED',
    notes: 'RFID (smart gate / library card tap) was explicitly deferred earlier this session pending a hardware vendor decision.',
  },
  {
    channel: 'GPS_TRACKING',
    providerName: 'Not yet selected',
    isActive: false,
    status: 'NOT_IMPLEMENTED',
    notes: 'Live bus GPS tracking was explicitly deferred earlier this session pending a hardware vendor decision. TransportRoute/Vehicle records exist; no live location feed does.',
  },
];

const seedIntegrationProviders = async () => {
  for (const p of PROVIDERS) {
    const status = p.status || (p.liveCheck() ? 'LIVE' : 'SIMULATED');
    await prisma.integrationProvider.upsert({
      where: { channel_providerName: { channel: p.channel, providerName: p.providerName } },
      update: { status, isActive: p.isActive, notes: p.notes },
      create: { channel: p.channel, providerName: p.providerName, status, isActive: p.isActive, notes: p.notes },
    });
  }
};

module.exports = { seedIntegrationProviders };
