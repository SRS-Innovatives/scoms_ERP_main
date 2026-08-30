/**
 * Super Admin — System & Health Controller
 *
 * Aggregates the real /health payload (DB ping latency, process uptime, memory) from
 * all 4 backend services, plus a real integration-mode readout (Live vs Simulated) for
 * SMS/Email/WhatsApp/Payments — derived from the same env-var checks each gateway uses
 * internally, never fabricated uptime/latency numbers.
 */
const { getHealthPayload, sendSuccess } = require('../../../shared');

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
      whatsapp: isConfigured(process.env.WHATSAPP_API_KEY) ? 'LIVE' : 'SIMULATED',
      payments: isConfigured(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET) ? 'LIVE' : 'SIMULATED',
    };

    return sendSuccess(res, { overallStatus: allUp ? 'OPERATIONAL' : 'DEGRADED', services, integrations }, 'System health retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSystemHealth };
