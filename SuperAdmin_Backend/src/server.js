/**
 * Super Admin HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

const PORT = process.env.SUPER_ADMIN_PORT || 5001;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Super Admin Backend running on port ${PORT}`);
});
