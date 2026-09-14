// Photo Gallery Service — /api/v1/student/gallery/* (view-only)
import apiCall from './api';

export const galleryService = {
  getAlbums: async () => apiCall('/gallery/albums'),
  getAlbumPhotos: async (albumId) => apiCall(`/gallery/albums/${albumId}/photos`),
};

export default galleryService;
