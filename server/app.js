/**
 * SCOMS Combined API — every portal's backend in ONE Express process.
 *
 * Why: on Render's free plan each web service is a separate always-on container, and
 * the free instance-hours (750/month per workspace) cover only ONE service running all
 * month. Four services meant four cold starts, four Prisma connection pools against
 * the same database, and four times the memory — for one app. This server mounts the
 * exact same routers the four backends use (no business logic is duplicated), so:
 *
 *   /api/v1/super-admin/*  → SuperAdmin_Backend routes
 *   /api/v1/admin/*        → IntituteAdmin_Backend routes
 *   /api/v1/public/*       → IntituteAdmin_Backend public pre-admission routes
 *   /api/v1/staff/*        → Staff_backend routes
 *   /api/v1/student/*      → Student_Backend routes
 *   /api/v1/mobile/*       → the two mobile apps (scoms-app-backend/src/mobileRoutes.js)
 *
 * Point all four VITE_*_API_URL values (or just SCOMS_API_URL, see scripts/build-web.mjs)
 * at this one service. The per-portal servers still work for local development.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler, getHealthPayload } = require('../shared');

const superAdminRoutes = require('../SuperAdmin_Backend/src/routes/apiRoutes');
const instituteAdminRoutes = require('../IntituteAdmin_Backend/src/routes/apiRoutes');
const publicRoutes = require('../IntituteAdmin_Backend/src/routes/publicRoutes');
const staffRoutes = require('../Staff_backend/src/routes/apiRoutes');
const studentRoutes = require('../Student_Backend/src/routes/apiRoutes');
const mediaRoutes = require('../shared/media/mediaRoutes');
const { blockDuringMaintenance } = require('../shared/middleware/maintenanceMode');

const app = express();

// Render/Vercel sit behind one proxy hop: without this every user shares the proxy's IP,
// so the login rate limiter (10 per 15 min) would lock out the whole platform at once.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS_ORIGINS: comma-separated frontend URLs allowed in production; unset = allow all (local dev)
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : '*';

app.use(helmet());
// gzip JSON responses — lists of students/fees/marks shrink 5–10x, saving bandwidth
// (Render free egress is capped) and load time on slow mobile connections
app.use(compression());
// Public pre-admission API is called from each institution's own website — always open
app.use('/api/v1/public', cors());
app.use(cors({ origin: corsOrigins, maxAge: 86400 })); // cache preflights for a day: one OPTIONS round trip instead of one per request
app.use(express.json({ limit: '8mb' })); // institution logos / profile photos are sent as base64 data URIs

app.get('/health', async (req, res) => {
  res.json(await getHealthPayload('SCOMS Combined API'));
});

// Profile photos + institution logos as cacheable image files (signed links — see shared/media/mediaUrl.js)
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
// Platform Maintenance Mode (Super Admin → System) — 503 for these portals while it is on
app.use(['/api/v1/public', '/api/v1/admin', '/api/v1/staff', '/api/v1/student'], blockDuringMaintenance);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', instituteAdminRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/student', studentRoutes);

// The mobile apps (scoms-app-student, scoms-app-staff): /api/v1/mobile/{student,staff}/*,
// served by this same process — the same router the standalone gateway uses
// (scoms-app-backend/src/mobileRoutes.js). Loading it also makes push delivery in-process
// for notifications written by ANY portal here (shared/utils/notificationCenter.js).
app.use(require('../scoms-app-backend/src/mobileRoutes'));

app.use(errorHandler);

module.exports = app;
