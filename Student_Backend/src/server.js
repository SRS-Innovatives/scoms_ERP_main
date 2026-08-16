/**
 * Student HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

const PORT = process.env.STUDENT_PORT || 5004;

app.listen(PORT, () => {
  logger.info(`🚀 SCOMS Student Backend running on port ${PORT}`);
});
