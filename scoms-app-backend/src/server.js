require('dotenv').config();
const app = require('./app');
const { logger } = require('../../shared');

const PORT = process.env.MOBILE_PORT || 5005;

app.listen(PORT, () => {
  logger.info(`SCOMS Mobile Backend running on port ${PORT}`);
});
