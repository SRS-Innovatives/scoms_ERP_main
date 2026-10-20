/**
 * Student HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

// PORT is injected by the host (Render etc.); the named var is for running all backends locally
const PORT = process.env.PORT || process.env.STUDENT_PORT || 5004;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Student Backend running on port ${PORT}`);
});
