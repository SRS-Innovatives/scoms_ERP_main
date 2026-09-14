// Photo Gallery Service — /api/v1/staff/gallery/*
import apiCall from './api';

export const galleryService = {
  getAlbums: async () => apiCall('/gallery/albums'),
  getAlbumPhotos: async (albumId) => apiCall(`/gallery/albums/${albumId}/photos`),
  addPhoto: async (albumId, payload) => apiCall(`/gallery/albums/${albumId}/photos`, { method: 'POST', body: payload }),
};

export default galleryService;
