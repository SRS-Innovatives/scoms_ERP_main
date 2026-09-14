/**
 * Institute Admin — Photo Gallery Controller
 *
 * Photos are stored as base64 data URIs directly in the database — the same
 * convention this codebase already uses for Institution.logo — rather than requiring
 * a cloud storage integration that doesn't exist yet.
 */
const { prisma, sendSuccess, NotFoundError, ValidationError } = require('../../../shared');

const VALID_CATEGORIES = ['EVENTS', 'SPORTS', 'ACADEMICS', 'CULTURAL', 'GENERAL'];
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB decoded, comfortably under the 8mb JSON body limit

const validateImageData = (imageData) => {
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
    throw new ValidationError('imageData must be a base64 image data URI');
  }
  // Rough size check on the base64 payload (base64 is ~4/3 the size of the raw bytes)
  const approxBytes = (imageData.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) throw new ValidationError('Image is too large — please use a photo under 6MB');
};

const getAlbums = async (req, res, next) => {
  try {
    const { category } = req.query;
    const albums = await prisma.galleryAlbum.findMany({
      where: { institutionId: req.institutionId, ...(category && { category }) },
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

const createAlbum = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    if (!title) throw new ValidationError('title is required');
    if (category && !VALID_CATEGORIES.includes(category)) throw new ValidationError(`category must be one of ${VALID_CATEGORIES.join(', ')}`);

    const album = await prisma.galleryAlbum.create({
      data: {
        institutionId: req.institutionId,
        title,
        description: description || null,
        category: category || 'GENERAL',
        createdById: req.user.staffId || null,
      },
    });
    return sendSuccess(res, album, 'Album created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.galleryAlbum.findFirst({ where: { id, institutionId: req.institutionId } });
    if (!existing) throw new NotFoundError('Album not found');
    await prisma.galleryAlbum.delete({ where: { id } });
    return sendSuccess(res, null, 'Album deleted successfully');
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

const deletePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;
    const existing = await prisma.galleryPhoto.findFirst({ where: { id: photoId, album: { institutionId: req.institutionId } } });
    if (!existing) throw new NotFoundError('Photo not found');
    await prisma.galleryPhoto.delete({ where: { id: photoId } });
    return sendSuccess(res, null, 'Photo deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlbums, getAlbumPhotos, createAlbum, deleteAlbum, addPhoto, deletePhoto };
