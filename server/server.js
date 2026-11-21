/**
 * SCOMS Combined API — HTTP entry point (see ./app.js). Production start command:
 *   node server/server.js
 */

require('dotenv').config();
const app = require('./app');
const { logger, prisma } = require('../shared');
const { startNotificationSchedulerJob } = require('../IntituteAdmin_Backend/src/jobs/notificationSchedulerJob');
const { startFeeReminderJob } = require('../IntituteAdmin_Backend/src/jobs/feeReminderJob');

const PORT = process.env.PORT || process.env.COMBINED_PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Combined API (super-admin, admin, public, staff, student) running on port ${PORT}`);
  startNotificationSchedulerJob();
  startFeeReminderJob();
});

// Render sends SIGTERM on every deploy/restart: finish in-flight requests and release the
// database connections cleanly instead of leaving them for the pooler to time out.
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
