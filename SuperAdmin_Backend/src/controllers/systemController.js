/**
 * Super Admin — System & Health Controller
 *
 * Aggregates the real /health payload (DB ping latency, process uptime, memory) from
 * all 4 backend services, plus a real integration-mode readout (Live vs Simulated) for
 * SMS/Email/WhatsApp/Payments — derived from the same env-var checks each gateway uses
 * internally, never fabricated uptime/latency numbers.
 */
const { getHealthPayload, sendSuccess, prisma, NotFoundError, ValidationError } = require('../../../shared');

const SERVICES = [
  { key: 'superAdmin', name: 'Super Admin Backend', port: 5001 },
  { key: 'instituteAdmin', name: 'Institute Admin Backend', port: 5002 },
  { key: 'staff', name: 'Staff Backend', port: 5003 },
  { key: 'student', name: 'Student Backend', port: 5004 },
];

const checkService = async (service) => {
  if (service.port === 5001) {
    // This service — measure directly instead of round-tripping through HTTP to itself.
    return { ...service, reachable: true, ...(await getHealthPayload(service.name)) };
  }

  try {
    const start = Date.now();
    const res = await fetch(`http://localhost:${service.port}/health`, { signal: AbortSignal.timeout(3000) });
    const responseMs = Date.now() - start;
    if (!res.ok) return { ...service, reachable: false, responseMs, error: `HTTP ${res.status}` };
    const payload = await res.json();
    return { ...service, reachable: true, responseMs, ...payload };
  } catch (err) {
    return { ...service, reachable: false, error: err.message };
  }
};

const isConfigured = (...envVars) => envVars.every((v) => v && !v.includes('your-') && !v.includes('example.com') && !v.includes('scoms.in') && v !== 'rzp_test_key' && v !== 'rzp_test_secret');

const getSystemHealth = async (req, res, next) => {
  try {
    const services = await Promise.all(SERVICES.map(checkService));
    const allUp = services.every((s) => s.reachable && s.database?.status === 'UP');

    const integrations = {
      email: isConfigured(process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASSWORD) ? 'LIVE' : 'SIMULATED',
      sms: isConfigured(process.env.SMS_API_KEY) ? 'LIVE' : 'SIMULATED',
      whatsapp: isConfigured(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID) ? 'LIVE' : 'SIMULATED',
      payments: isConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET) ? 'LIVE' : 'SIMULATED',
    };

    return sendSuccess(res, { overallStatus: allUp ? 'OPERATIONAL' : 'DEGRADED', services, integrations }, 'System health retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// Integration Hub (Phase 12) — the real registry version of the `integrations` object
// above. Metadata only: registering/updating a row here never changes any actual
// send/payment code, which stays exactly as it is regardless of what's registered.
// ============================================================
const CHANNELS = ['SMS', 'EMAIL', 'WHATSAPP', 'PAYMENT_GATEWAY', 'CLOUD_STORAGE', 'VIDEO_MEETING', 'BIOMETRIC', 'RFID', 'GPS_TRACKING'];
const STATUSES = ['LIVE', 'SIMULATED', 'NOT_IMPLEMENTED'];

const getIntegrationProviders = async (req, res, next) => {
  try {
    const providers = await prisma.integrationProvider.findMany({ orderBy: [{ channel: 'asc' }, { isActive: 'desc' }] });
    return sendSuccess(res, providers, 'Integration providers retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/** Documents a known-but-not-yet-wired provider option for a channel (e.g. "Stripe" as
 * a future alternative to Razorpay) — this is the adapter-seam registry the spec asks
 * for. It never activates real functionality; isActive stays false unless a SuperAdmin
 * later flips it, and even then no code path changes — that would be a real, separate
 * integration build. */
const registerProvider = async (req, res, next) => {
  try {
    const { channel, providerName, status = 'NOT_IMPLEMENTED', notes } = req.body;
    if (!channel || !CHANNELS.includes(channel)) throw new ValidationError(`channel must be one of ${CHANNELS.join(', ')}`);
    if (!providerName) throw new ValidationError('providerName is required');
    if (!STATUSES.includes(status)) throw new ValidationError(`status must be one of ${STATUSES.join(', ')}`);

    const existing = await prisma.integrationProvider.findUnique({ where: { channel_providerName: { channel, providerName } } });
    if (existing) throw new ValidationError(`"${providerName}" is already registered for ${channel}`);

    const provider = await prisma.integrationProvider.create({
      data: { channel, providerName, status, isActive: false, notes: notes || null },
    });
    return sendSuccess(res, provider, 'Integration provider registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.integrationProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Integration provider not found');

    const { status, notes } = req.body;
    if (status !== undefined && !STATUSES.includes(status)) throw new ValidationError(`status must be one of ${STATUSES.join(', ')}`);

    const provider = await prisma.integrationProvider.update({
      where: { id },
      data: { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
    });
    return sendSuccess(res, provider, 'Integration provider updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSystemHealth, getIntegrationProviders, registerProvider, updateProvider };
