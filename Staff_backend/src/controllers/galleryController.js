/**
 * Staff — Photo Gallery Controller (view all albums, contribute photos to existing ones)
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const validateImageData = (imageData) => {
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
    throw new ValidationError('imageData must be a base64 image data URI');
  }
  const approxBytes = (imageData.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) throw new ValidationError('Image is too large — please use a photo under 6MB');
};

const getAlbums = async (req, res, next) => {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { institutionId: req.institutionId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
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
      createdBy: a.createdBy,
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
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { album, photos }, 'Album photos retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const addPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageData, caption } = req.body;
    validateImageData(imageData);

    const album = await prisma.galleryAlbum.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!album) throw new NotFoundError('Album not found');

    const photo = await prisma.galleryPhoto.create({
      data: { albumId: id, imageData, caption: caption || null, uploadedById: req.user.staffId || null },
    });
    return sendSuccess(res, { id: photo.id, caption: photo.caption, createdAt: photo.createdAt }, 'Photo uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlbums, getAlbumPhotos, addPhoto };
