/**
 * Real health-check payload shared by all 4 backends' /health endpoint — actually measured
 * process uptime, memory usage, and a live DB round-trip latency (SELECT 1), not fabricated
 * "99.99% uptime" style numbers.
 */
const prisma = require('../database/client');

const getHealthPayload = async (serviceName) => {
  let dbLatencyMs = null;
  let dbStatus = 'DOWN';

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'UP';
  } catch (err) {
    dbStatus = 'DOWN';
  }

  const mem = process.memoryUsage();

  return {
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    service: serviceName,
    timestamp: new Date(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rssMB: Number((mem.rss / 1024 / 1024).toFixed(1)),
      heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
  };
};

module.exports = { getHealthPayload };
