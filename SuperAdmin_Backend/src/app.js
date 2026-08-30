/**
 * Super Admin Express App Initialization
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

// Base Route
app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Super Admin Backend'));
});

// API Routes Mounted at Versioned Endpoint
app.use('/api/v1/super-admin', apiRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
