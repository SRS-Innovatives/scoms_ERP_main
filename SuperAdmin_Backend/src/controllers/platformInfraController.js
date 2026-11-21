/**
 * Super Admin — System → Database & Backups, Storage, API Management.
 * Real figures read live from PostgreSQL and the running server's own configuration.
 * Nothing here is invented: where SCOMS doesn't do something itself (database backups are
 * taken by the hosting provider, Supabase) the page says so instead of pretending.
 */
const { prisma, sendSuccess } = require('../../../shared');
const { RATE_LIMITS } = require('../../../shared/middleware/rateLimiter');
const { FLAGS, getFeatureFlagState } = require('../../../shared/utils/featureFlags');
const { isMaintenanceOn } = require('../../../shared/middleware/maintenanceMode');

const num = (v) => Number(v || 0);
const isSet = (...vals) => vals.every((v) => v && !/^your-|example|placeholder/i.test(String(v)));

/** GET /system/database — size, biggest tables, connections, migrations. */
const getDatabaseOverview = async (req, res, next) => {
  try {
    const [[size], tables, [conn], [ver], migrations, [migCount]] = await Promise.all([
      prisma.$queryRaw`SELECT pg_database_size(current_database())::bigint AS bytes, current_database() AS name`,
      prisma.$queryRaw`
        SELECT c.relname AS name,
               pg_total_relation_size(c.oid)::bigint AS bytes,
               GREATEST(c.reltuples, 0)::bigint AS rows
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY pg_total_relation_size(c.oid) DESC`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE state = 'active')::int AS active FROM pg_stat_activity WHERE datname = current_database()`,
      prisma.$queryRaw`SELECT current_setting('server_version') AS version`,
      prisma.$queryRaw`SELECT migration_name AS name, finished_at AS "finishedAt" FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL`,
    ]);
    const host = (() => { try { return new URL(process.env.DATABASE_URL).hostname; } catch { return null; } })();
    const provider = /supabase/i.test(host || '') ? 'Supabase' : host === 'localhost' || host === '127.0.0.1' ? 'Local PostgreSQL' : 'PostgreSQL';
    return sendSuccess(res, {
      provider,
      name: size.name,
      sizeBytes: num(size.bytes),
      postgresVersion: ver.version,
      tableCount: tables.length,
      connections: { total: conn.total, active: conn.active },
      largestTables: tables.slice(0, 15).map((t) => ({ name: t.name, bytes: num(t.bytes), rows: num(t.rows) })),
      migrations: { applied: migCount.n, latest: migrations },
      backups: provider === 'Supabase'
        ? { managedBy: 'Supabase', note: 'Backups and restores are done by Supabase, not inside SCOMS. Open your Supabase project → Database → Backups to see backup times, download a backup or restore one.', dashboardUrl: 'https://supabase.com/dashboard' }
        : { managedBy: null, note: 'This database is not on Supabase — backups are whatever your database host or server provides; SCOMS does not take its own backups.', dashboardUrl: null },
    }, 'Database overview retrieved');
  } catch (err) {
    next(err);
  }
};

// Files are kept inside the database (data URIs) — these are the columns that hold them.
const FILE_COLUMNS = [
  { table: 'User', column: 'avatar', label: 'Profile photos' },
  { table: 'Institution', column: 'logo', label: 'Institution logos' },
  { table: 'StudentDocument', column: 'fileData', label: 'Student documents' },
  { table: 'GalleryPhoto', column: 'imageData', label: 'Gallery photos' },
  { table: 'Circular', column: 'attachment', label: 'Circular attachments' },
  { table: 'CandidateApplication', column: 'resumeData', label: 'Job application résumés' },
  { table: 'Assignment', column: 'attachmentUrl', label: 'Assignment attachments' },
  { table: 'AssignmentSubmission', column: 'fileUrl', label: 'Assignment submissions' },
  { table: 'StudyMaterial', column: 'fileUrl', label: 'Study materials' },
  { table: 'LeaveRequest', column: 'attachmentUrl', label: 'Leave attachments' },
];
const STORAGE_CACHE_MS = 5 * 60 * 1000;
let storageCache = null;

/** GET /system/storage?refresh=1 — files kept in the database, by kind (cached 5 minutes). */
const getStorageOverview = async (req, res, next) => {
  try {
    if (!storageCache || Date.now() - storageCache.at > STORAGE_CACHE_MS || req.query.refresh === '1') {
      const kinds = [];
      for (const k of FILE_COLUMNS) {
        // identifiers come from the fixed list above, never from the request
        const [r] = await prisma.$queryRawUnsafe(
          `SELECT COUNT("${k.column}")::int AS files,
                  COUNT(*) FILTER (WHERE "${k.column}" LIKE 'data:%')::int AS embedded,
                  COALESCE(SUM(octet_length("${k.column}")), 0)::bigint AS bytes
           FROM "${k.table}" WHERE "${k.column}" IS NOT NULL AND "${k.column}" <> ''`,
        );
        kinds.push({ ...k, files: r.files, embedded: r.embedded, linked: r.files - r.embedded, bytes: num(r.bytes) });
      }
      const [size] = await prisma.$queryRaw`SELECT pg_database_size(current_database())::bigint AS bytes`;
      storageCache = { at: Date.now(), data: { kinds, totalFiles: kinds.reduce((t, k) => t + k.files, 0), totalBytes: kinds.reduce((t, k) => t + k.bytes, 0), databaseBytes: num(size.bytes) } };
    }
    return sendSuccess(res, { ...storageCache.data, measuredAt: new Date(storageCache.at).toISOString() }, 'Storage overview retrieved');
  } catch (err) {
    next(err);
  }
};

/** GET /system/api — the API's real configuration and state. */
const getApiOverview = async (req, res, next) => {
  try {
    const [flagState, maintenance, keyed, aiSettings] = await Promise.all([
      getFeatureFlagState().catch(() => ({})),
      isMaintenanceOn().catch(() => false),
      prisma.institution.findMany({ where: { preAdmissionApiKey: { not: null } }, select: { name: true, code: true, status: true, preAdmissionApiKey: true }, orderBy: { name: 'asc' } }),
      prisma.platformAiSettings.findUnique({ where: { id: 'singleton' }, select: { apiKey: true } }).catch(() => null),
    ]);
    const cors = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean) : ['*'];
    return sendSuccess(res, {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      release: process.env.RENDER_GIT_COMMIT ? process.env.RENDER_GIT_COMMIT.slice(0, 7) : null,
      region: process.env.RENDER_REGION || null,
      apis: [
        { name: 'Super Admin', basePath: '/api/v1/super-admin' },
        { name: 'Institute Admin', basePath: '/api/v1/admin' },
        { name: 'Staff', basePath: '/api/v1/staff' },
        { name: 'Student & Parent', basePath: '/api/v1/student' },
        { name: 'Public (admission forms)', basePath: '/api/v1/public' },
        { name: 'Mobile apps', basePath: '/api/v1/mobile/{student|staff}' },
      ],
      rateLimits: Object.values(RATE_LIMITS).map((l) => ({ label: l.label, max: l.max, windowMinutes: Math.round(l.windowMs / 60000), scope: l.scope })),
      requestBodyLimit: '8 MB',
      cors: { origins: cors, open: cors.includes('*') },
      tokens: { accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m', refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d' },
      maintenanceMode: maintenance,
      featureFlags: FLAGS.map((f) => ({ key: f.key, name: f.name, enabled: flagState[f.key]?.enabled !== false })),
      integrations: {
        email: isSet(process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASSWORD) ? 'LIVE' : 'SIMULATED',
        sms: isSet(process.env.SMS_API_KEY) ? 'LIVE' : 'SIMULATED',
        whatsapp: isSet(process.env.WHATSAPP_ACCESS_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID) ? 'LIVE' : 'SIMULATED',
        payments: isSet(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET) ? 'LIVE' : 'SIMULATED',
        // the key saved on Super Admin → AI Config, or the server's OPENAI_API_KEY
        ai: (aiSettings?.apiKey && aiSettings.apiKey.trim().length >= 10) || isSet(process.env.OPENAI_API_KEY) ? 'LIVE' : 'SIMULATED',
        pushNotifications: isSet(process.env.INTERNAL_PUSH_SECRET) ? 'LIVE' : 'OFF',
      },
      apiKeys: keyed.map((i) => ({ institution: i.name, code: i.code, status: i.status, purpose: 'Public admission form', key: `••••${String(i.preAdmissionApiKey).slice(-4)}` })),
    }, 'API overview retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDatabaseOverview, getStorageOverview, getApiOverview, FILE_COLUMNS };
