/**
 * Super Admin Express App Initialization
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');
const { errorHandler } = require('../../shared');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Base Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SCOMS Super Admin Backend', timestamp: new Date() });
});

// API Routes Mounted at Versioned Endpoint
app.use('/api/v1/super-admin', apiRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
