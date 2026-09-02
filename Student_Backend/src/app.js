/**
 * Student Express App
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');
const { errorHandler, getHealthPayload } = require('../../shared');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' })); // raised from the 100kb default — profile photos are sent as base64 data URIs

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Student Backend'));
});

app.use('/api/v1/student', apiRoutes);
app.use(errorHandler);

module.exports = app;
