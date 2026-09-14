/**
 * Student — Photo Gallery Controller (view-only)
 */
const { prisma, sendSuccess, NotFoundError } = require('../../../shared');

const getAlbums = async (req, res, next) => {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { institutionId: req.institutionId },
      include: {
        photos: { take: 1, orderBy: { createdAt: 'desc' }, select: { imageData: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const shaped = albums.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      createdAt: a.createdAt,
      photoCount: a._count.photos,
      coverImage: a.photos[0]?.imageData || null,
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
      select: { id: true, imageData: true, caption: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { album, photos }, 'Album photos retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlbums, getAlbumPhotos };
