import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  category: string; // EVENTS, SPORTS, ACADEMICS, CULTURAL, GENERAL
  createdAt: string;
  photoCount: number;
  /** signed link to the newest photo, or null for an empty album */
  coverImage: string | null;
}

export interface GalleryPhoto {
  id: string;
  caption: string | null;
  createdAt: string;
  /** signed, cacheable link to the image */
  imageData: string | null;
}

export async function fetchAlbums(): Promise<GalleryAlbum[]> {
  const { data } = await apiClient.get<ApiEnvelope<GalleryAlbum[]>>('/gallery/albums');
  return data.data ?? [];
}

export async function fetchAlbumPhotos(albumId: string): Promise<GalleryPhoto[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ photos: GalleryPhoto[] }>>(`/gallery/albums/${albumId}/photos`);
  return data.data?.photos ?? [];
}
