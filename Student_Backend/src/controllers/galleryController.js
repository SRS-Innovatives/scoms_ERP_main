/**
 * Student — Photo Gallery Controller (view-only)
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');
const { attachFileLinks } = require('../../../shared/media/mediaUrl');

const getAlbums = async (req, res, next) => {
  try {
    // The cover is the newest photo as a signed, cacheable LINK — it used to be that photo's
    // full base64 image inline, so the album list grew by megabytes per album.
    const albums = await prisma.galleryAlbum.findMany({
      where: { institutionId: req.institutionId },
      select: {
        id: true, title: true, description: true, category: true, createdAt: true,
        photos: { take: 1, orderBy: { createdAt: 'desc' }, select: { id: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const covers = albums.filter((a) => a.photos[0]).map((a) => ({ id: a.photos[0].id }));
    await attachFileLinks(prisma, req, 'gallery', covers, 'url');
    const coverById = new Map(covers.map((c) => [c.id, c.url]));
    const shaped = albums.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      createdAt: a.createdAt,
      photoCount: a._count.photos,
      coverImage: a.photos[0] ? coverById.get(a.photos[0].id) || null : null,
    }));
    return sendSuccess(res, shaped, 'Albums retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getAlbumPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const album = await prisma.galleryAlbum.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!album) throw new NotFoundError('Album not found');

    const photos = await prisma.galleryPhoto.findMany({
      where: { albumId: id },
      select: { id: true, caption: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    // Photos go out as cacheable links, not inline base64 (shared/media/mediaUrl.js)
    await attachFileLinks(prisma, req, 'gallery', photos, 'imageData');
    return sendSuccess(res, { album, photos }, 'Album photos retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlbums, getAlbumPhotos };
