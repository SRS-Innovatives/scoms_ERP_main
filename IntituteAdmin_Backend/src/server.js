/**
 * Institute Admin HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');
const { startNotificationSchedulerJob } = require('./jobs/notificationSchedulerJob');

// PORT is injected by the host (Render etc.); the named var is for running all backends locally
const PORT = process.env.PORT || process.env.INSTITUTE_ADMIN_PORT || 5002;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Institute Admin Backend running on port ${PORT}`);
  startNotificationSchedulerJob();
});
