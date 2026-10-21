/**
 * Staff HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

// PORT is injected by the host (Render etc.); the named var is for running all backends locally
const PORT = process.env.PORT || process.env.STAFF_PORT || 5003;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Staff Backend running on port ${PORT}`);
});
