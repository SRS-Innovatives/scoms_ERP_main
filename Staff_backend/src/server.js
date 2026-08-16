/**
 * Staff HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

const PORT = process.env.STAFF_PORT || 5003;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Staff Backend running on port ${PORT}`);
});
