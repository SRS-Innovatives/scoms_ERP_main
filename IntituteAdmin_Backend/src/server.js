/**
 * Institute Admin HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

const PORT = process.env.INSTITUTE_ADMIN_PORT || 5002;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Institute Admin Backend running on port ${PORT}`);
});
