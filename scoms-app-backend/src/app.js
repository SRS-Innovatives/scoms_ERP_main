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

const studentRoutes = require('../../Student_Backend/src/routes/apiRoutes');
const staffRoutes = require('../../Staff_backend/src/routes/apiRoutes');

// The one piece of API surface that's genuinely mobile-only (push device-token
// registration) — has no equivalent on the web app, so it's built here using this
// folder's own Prisma client/schema instead of extending the reused routers above.
// Organized as modules/<name>/{routes,controller,service}.js, same pattern the
// frontend apps use, so any future mobile-only module drops in the same shape.
const pushNotificationRoutes = require('./modules/pushNotifications');
const internalPushRoutes = require('./modules/pushNotifications/internalRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' })); // raised from the 100kb default — profile photos are sent as base64 data URIs

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Mobile Backend'));
});

app.use('/api/v1/mobile/student', studentRoutes);
app.use('/api/v1/mobile/student', pushNotificationRoutes); // falls through here with req.user already set by studentRoutes' own requireAuth
app.use('/api/v1/mobile/staff', staffRoutes);
app.use('/api/v1/mobile/staff', pushNotificationRoutes); // same router, same fall-through, mounted a second time under the staff prefix

// Server-to-server only (secret-header authenticated) — every backend's
// shared/utils/notificationCenter.js calls this after writing an in-app
// notification, so registered devices actually receive a push for it.
app.use('/internal/push', internalPushRoutes);

app.use(errorHandler);

module.exports = app;
