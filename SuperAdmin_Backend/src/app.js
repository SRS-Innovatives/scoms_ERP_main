/**
 * Super Admin Express App Initialization
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');
const { errorHandler, getHealthPayload } = require('../../shared');

const app = express();

// CORS_ORIGINS: comma-separated frontend URLs allowed in production; unset = allow all (local dev)
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : '*';

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '8mb' })); // raised from the 100kb default — institution logos are sent as base64 data URIs

// Base Route
app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Super Admin Backend'));
});

// API Routes Mounted at Versioned Endpoint
app.use('/api/v1/super-admin', apiRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
