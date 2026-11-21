/**
 * Files stored as base64 data URIs in the database — profile photos (User.avatar),
 * institution logos (Institution.logo), gallery photos, study materials and assignment
 * submissions. Sending that text inside API responses (login, /auth/me, dashboards,
 * student lists — one photo per row — gallery albums, material lists...) made responses
 * huge and meant the browser re-downloaded the same file on every call, uncacheable.
 * Responses now carry a short URL instead:
 *
 *   GET /api/v1/media/:kind/:id?v=&s=       (see ./mediaRoutes.js)
 *
 * which returns the real file bytes with a one-year browser cache.
 *
 *   ?v = version → the URL changes whenever the file changes, so a long cache can never
 *        serve a stale file (content hash for photos/logos; timestamp for uploads that
 *        are only ever replaced as a whole)
 *   ?s = HMAC signature of kind+id+v → <img>/<a> tags can't send the Bearer token, so the
 *        link itself is the permission: only the server can mint one, and it only does
 *        so inside responses the caller was already allowed to see. Links can't be
 *        guessed or enumerated, and a link for one kind can't be reused for another.
 */
const crypto = require('crypto');

// Shared by every backend process (the JWT secret already is), so a link minted by one
// backend verifies on another. Random fallback = safe default if neither is set.
const SECRET = process.env.MEDIA_URL_SECRET || process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString('hex');

const MEDIA_PREFIX = '/api/v1/media/';
// Photos/logos: raster formats only. An SVG can carry script, so it is never served
// from the API's own origin — an SVG logo simply stays inline in the response as before.
const DATA_URI = /^data:(image\/(?:png|jpe?g|webp|gif));base64,/;

const versionOf = (dataUri) => crypto.createHash('sha1').update(dataUri).digest('base64url').slice(0, 12);
const sign = (kind, id, v) => crypto.createHmac('sha256', SECRET).update(`${kind}.${id}.${v}`).digest('base64url').slice(0, 22);

const verify = (kind, id, v, s) => {
  if (typeof v !== 'string' || typeof s !== 'string') return false;
  const expected = Buffer.from(sign(kind, id, v));
  const given = Buffer.from(s);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

/** Absolute signed URL (the frontends live on another origin) for kind/id at version v. */
const signedUrl = (req, kind, id, v) => {
  const origin = req ? `${req.protocol}://${req.get('host')}` : '';
  return `${origin}${MEDIA_PREFIX}${kind}/${encodeURIComponent(id)}?v=${v}&s=${sign(kind, id, v)}`;
};
const avatarUrl = (req, userId, dataUri) => signedUrl(req, 'avatar', userId, versionOf(dataUri));
const logoUrl = (req, institutionId, dataUri) => signedUrl(req, 'logo', institutionId, versionOf(dataUri));

/**
 * Rewrites every photo/logo data URI inside a response body to its cached URL, in place.
 *  - `avatar` exists only on User: a user row itself (has `id`) or nested as
 *    `user: { avatar }` under a Student/Staff row (has `userId`).
 *  - `logo` exists only on Institution: an institution row (has `id`), nested as
 *    `institution: { logo }` under a row that has `institutionId`, or a bare
 *    `institution` summary of the caller's own institution (req.institutionId).
 * Anything whose owner can't be determined is left as it was.
 */
const rewriteMedia = (node, req, parent = null, key = null, depth = 0) => {
  if (!node || typeof node !== 'object' || depth > 8) return;
  if (Array.isArray(node)) {
    for (const item of node) rewriteMedia(item, req, parent, key, depth + 1);
    return;
  }
  if (node instanceof Date || Buffer.isBuffer(node)) return;

  if (typeof node.avatar === 'string' && DATA_URI.test(node.avatar)) {
    const userId = (key === 'user' && parent?.userId) || node.id;
    if (userId) node.avatar = avatarUrl(req, userId, node.avatar);
  }
  if (typeof node.logo === 'string' && DATA_URI.test(node.logo)) {
    const institutionId = node.id
      || (key === 'institution' && (parent?.institutionId || req?.institutionId))
      || null;
    if (institutionId) node.logo = logoUrl(req, institutionId, node.logo);
  }

  for (const k of Object.keys(node)) {
    const child = node[k];
    if (child && typeof child === 'object') rewriteMedia(child, req, node, k, depth + 1);
  }
};

/**
 * Uploaded files kept as base64 in a column. They are only ever replaced as a whole (a
 * resubmission), so the link is versioned by a timestamp column instead of a content
 * hash — list queries never have to load the file at all.
 */
const FILE_KINDS = {
  gallery: { table: 'GalleryPhoto', column: 'imageData', version: 'createdAt' },
  material: { table: 'StudyMaterial', column: 'fileUrl', version: 'createdAt' },
  submission: { table: 'AssignmentSubmission', column: 'fileUrl', version: 'submittedAt' },
  staffdoc: { table: 'StaffDocument', column: 'fileData', version: 'uploadedAt' },
  studentdoc: { table: 'StudentDocument', column: 'fileData', version: 'uploadedAt' },
};
const fileVersion = (ver) => String(new Date(ver).getTime());

/**
 * For rows fetched WITHOUT their file column (omit/select): id → what the client should
 * get in that field — a signed link for an uploaded (data URI) file, the stored value
 * itself for a short external link (e.g. a video URL a teacher pasted), or null.
 * Only the first 100 characters of each value are read — never the file itself.
 */
const fileLinks = async (prisma, req, kind, ids) => {
  const k = FILE_KINDS[kind];
  const out = new Map();
  if (!k || ids.length === 0) return out;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", substr("${k.column}", 1, 100) AS "head", length("${k.column}") AS "len", "${k.version}" AS "ver"
       FROM "${k.table}" WHERE "id" = ANY($1::text[])`,
    ids
  );
  const externalIds = [];
  for (const r of rows) {
    if (!r.head) out.set(r.id, null);
    else if (r.head.startsWith('data:')) out.set(r.id, signedUrl(req, kind, r.id, fileVersion(r.ver)));
    else if (Number(r.len) <= 100) out.set(r.id, r.head);
    else externalIds.push(r.id);
  }
  if (externalIds.length) {
    const ext = await prisma.$queryRawUnsafe(`SELECT "id", "${k.column}" AS "value" FROM "${k.table}" WHERE "id" = ANY($1::text[])`, externalIds);
    ext.forEach((r) => out.set(r.id, r.value));
  }
  return out;
};

/** Sets row[field] = its link for every row (rows were fetched without the file column). */
const attachFileLinks = async (prisma, req, kind, rows, field) => {
  const links = await fileLinks(prisma, req, kind, rows.map((r) => r.id));
  for (const r of rows) r[field] = links.get(r.id) ?? null;
  return rows;
};

/**
 * Whether each row has a value in a large column, without loading it: id → boolean.
 * For lists that only need to show "has attachment" (the detail endpoint returns the file).
 */
const PRESENCE_COLUMNS = {
  'Assignment.attachmentUrl': true,
  'LeaveRequest.attachmentUrl': true,
  'CandidateApplication.resumeData': true,
};
const hasValue = async (prisma, table, column, ids) => {
  if (!PRESENCE_COLUMNS[`${table}.${column}`]) throw new Error(`hasValue: ${table}.${column} not allowed`);
  const out = new Map();
  if (ids.length === 0) return out;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", ("${column}" IS NOT NULL AND "${column}" <> '') AS "has" FROM "${table}" WHERE "id" = ANY($1::text[])`,
    ids
  );
  rows.forEach((r) => out.set(r.id, r.has));
  return out;
};

/** A media URL a client echoed back (it was given one, not a new upload) means "unchanged". */
const isMediaUrl = (value) => typeof value === 'string' && value.includes(MEDIA_PREFIX);

module.exports = {
  DATA_URI, FILE_KINDS, versionOf, fileVersion, verify, signedUrl, avatarUrl, logoUrl,
  rewriteMedia, fileLinks, attachFileLinks, hasValue, isMediaUrl,
  // names used by the profile-photo call sites
  rewriteAvatars: rewriteMedia,
  isAvatarUrl: isMediaUrl,
};
