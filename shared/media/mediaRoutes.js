/**
 * Serves database-stored files as real, cacheable files (see ./mediaUrl.js):
 *   GET /api/v1/media/avatar/:userId?v=&s=            profile photo
 *   GET /api/v1/media/logo/:institutionId?v=&s=       institution logo
 *   GET /api/v1/media/gallery/:photoId?v=&s=          gallery photo
 *   GET /api/v1/media/material/:materialId?v=&s=      study material file
 *   GET /api/v1/media/submission/:submissionId?v=&s=  assignment submission file
 * No login header needed: the HMAC signature in the link is the permission.
 */
const express = require('express');
const prisma = require('../database/client');
const { DATA_URI, FILE_KINDS, versionOf, fileVersion, verify } = require('./mediaUrl');

const router = express.Router();

// Any uploaded file: data:<type>[;params];base64,<data>
const ANY_DATA_URI = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)((?:;[^,;]*)*);base64,/i;
// Shown in the browser; every other type is sent as a download (never rendered on the
// API's origin — e.g. an uploaded HTML/SVG file can't run script here)
const INLINE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf']);
const EXT = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-powerpoint': 'ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx', 'video/mp4': 'mp4' };

const KINDS = {
  avatar: {
    load: async (id) => {
      const u = await prisma.user.findUnique({ where: { id }, select: { avatar: true } });
      return u?.avatar && { dataUri: u.avatar, version: versionOf(u.avatar) };
    },
    imageOnly: true,
    cache: 'private', // personal photo — browser only, never a shared cache
  },
  logo: {
    load: async (id) => {
      const i = await prisma.institution.findUnique({ where: { id }, select: { logo: true } });
      return i?.logo && { dataUri: i.logo, version: versionOf(i.logo) };
    },
    imageOnly: true,
    cache: 'public',
  },
};
for (const [kind, k] of Object.entries(FILE_KINDS)) {
  KINDS[kind] = {
    load: async (id) => {
      const rows = await prisma.$queryRawUnsafe(`SELECT "${k.column}" AS "value", "${k.version}" AS "ver" FROM "${k.table}" WHERE "id" = $1`, id);
      const row = rows[0];
      return row?.value && { dataUri: row.value, version: fileVersion(row.ver) };
    },
    imageOnly: false,
    cache: 'private', // institution-internal content
  };
}

router.get('/:kind/:id', async (req, res, next) => {
  try {
    const kind = KINDS[req.params.kind];
    const { id } = req.params;
    const { v, s } = req.query;
    if (!kind || !verify(req.params.kind, id, v, s)) return res.status(404).end();

    const file = await kind.load(id);
    if (!file) return res.status(404).end();
    const match = file.dataUri.match(kind.imageOnly ? DATA_URI : ANY_DATA_URI);
    if (!match) return res.status(404).end();

    const type = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const bytes = Buffer.from(file.dataUri.slice(match[0].length), 'base64');
    const current = file.version === v;
    const inline = INLINE_TYPES.has(type);

    res.set({
      'Content-Type': type,
      'Content-Length': bytes.length,
      'Content-Disposition': inline ? 'inline' : `attachment; filename="${req.params.kind}-${id.slice(0, 8)}.${EXT[type] || 'bin'}"`,
      // Same URL ⇒ same bytes, so cache for a year. An old link (file replaced since)
      // still returns the current file, but is not cached.
      'Cache-Control': current ? `${kind.cache}, max-age=31536000, immutable` : 'no-cache',
      ETag: `"${file.version}"`,
      // helmet defaults this to same-origin, which would block <img>/<a> use from the
      // frontends' own origin (Vercel); ACAO lets a frontend fetch() it as a Blob
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });
    // A served file can never run script on the API origin. (Not for PDFs: Chrome's PDF
    // viewer refuses sandboxed documents — those keep helmet's default policy instead.)
    if (type !== 'application/pdf') res.set('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
    return res.end(bytes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
