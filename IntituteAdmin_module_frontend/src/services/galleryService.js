// Photo Gallery Service — /api/v1/admin/gallery/*
import apiCall from './api';

const getAlbums = (category) => apiCall(`/gallery/albums${category ? `?category=${category}` : ''}`);
const getAlbumPhotos = (albumId) => apiCall(`/gallery/albums/${albumId}/photos`);
const createAlbum = (payload) => apiCall('/gallery/albums', { method: 'POST', body: payload });
const deleteAlbum = (albumId) => apiCall(`/gallery/albums/${albumId}`, { method: 'DELETE' });
const addPhoto = (albumId, payload) => apiCall(`/gallery/albums/${albumId}/photos`, { method: 'POST', body: payload });
const deletePhoto = (photoId) => apiCall(`/gallery/photos/${photoId}`, { method: 'DELETE' });

export const galleryService = { getAlbums, getAlbumPhotos, createAlbum, deleteAlbum, addPhoto, deletePhoto };
export default galleryService;
