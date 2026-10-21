/**
 * Institute Admin Express App
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { errorHandler, getHealthPayload } = require('../../shared');

const app = express();

// CORS_ORIGINS: comma-separated frontend URLs allowed in production; unset = allow all (local dev)
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : '*';

app.use(helmet());
// Public pre-admission API is called from each institution's own website — always open
app.use('/api/v1/public', cors());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '8mb' })); // raised from the 100kb default — the institution logo is sent as a base64 data URI

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Institute Admin Backend'));
});

app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', apiRoutes);
app.use(errorHandler);

module.exports = app;
