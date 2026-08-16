/**
 * Student Express App
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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SCOMS Student Backend', timestamp: new Date() });
});

app.use('/api/v1/student', apiRoutes);
app.use(errorHandler);

module.exports = app;
