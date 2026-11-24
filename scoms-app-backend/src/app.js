/**
 * SCOMS Mobile Gateway — one Express process serving both the Student and Staff
 * mobile apps. Deliberately does NOT reimplement any business logic: it requires
 * Student_Backend's and Staff_backend's own fully-wired routers directly, so every
 * controller, the shared auth/RBAC middleware, and the tenant-scoping rules stay
 * byte-identical to what the existing web apps already use — same Postgres DB via
 * the same shared Prisma client, no duplicated code to drift out of sync.
 *
 * The web apps keep talking to Student_Backend (5004) and Staff_backend (5003)
 * directly and are completely unaffected by this file's existence.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, getHealthPayload } = require('../../shared');

const mobileRoutes = require('./mobileRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' })); // raised from the 100kb default — profile photos are sent as base64 data URIs

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Mobile Backend'));
});

// Signed file links (uploaded study materials, gallery photos, documents, avatars). The
// reused controllers build them on THIS host (shared/media/mediaUrl.js signedUrl), so the
// gateway must serve them too. Each URL carries its own signature, so no auth header.
app.use('/api/v1/media', require('../../shared/media/mediaRoutes'));

// /api/v1/mobile/{student,staff}/* and /internal/push — see mobileRoutes.js (the combined
// production server mounts the same router)
app.use(mobileRoutes);

app.use(errorHandler);

module.exports = app;
