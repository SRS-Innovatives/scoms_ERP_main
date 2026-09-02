/**
 * Staff Express App
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');
const { errorHandler, getHealthPayload } = require('../../shared');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Staff Backend'));
});

app.use('/api/v1/staff', apiRoutes);
app.use(errorHandler);

module.exports = app;
