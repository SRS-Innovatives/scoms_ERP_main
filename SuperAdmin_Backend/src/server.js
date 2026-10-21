/**
 * Super Admin HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

// PORT is injected by the host (Render etc.); the named var is for running all backends locally
const PORT = process.env.PORT || process.env.SUPER_ADMIN_PORT || 5001;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Super Admin Backend running on port ${PORT}`);
});
