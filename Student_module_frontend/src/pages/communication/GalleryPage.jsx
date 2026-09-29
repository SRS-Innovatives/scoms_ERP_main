import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Images, ArrowLeft, Loader2 } from 'lucide-react';
import galleryService from '../../services/galleryService';
import ErrorState from '../../components/common/ErrorState';

export const GalleryPage = () => {
  const { error: showError } = useNotification();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const fetchAlbums = useCallback(() => {
    setLoading(true);
    setError(false);
    galleryService.getAlbums()
      .then((res) => setAlbums(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load albums', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const openAlbumView = (album) => {
    setLoadingPhotos(true);
    setOpenAlbum({ album, photos: [] });
    galleryService.getAlbumPhotos(album.id)
      .then((res) => setOpenAlbum({ album: res.data.album, photos: res.data.photos }))
      .catch((err) => showError(err.message || 'Failed to load photos', 'Load Failed'))
      .finally(() => setLoadingPhotos(false));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAlbums} />;
  }

  if (openAlbum) {
    return (
      <div className="space-y-6">
        <button onClick={() => setOpenAlbum(null)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4" /> Back to Albums
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{openAlbum.album.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{openAlbum.album.description}</p>
        </div>

        {loadingPhotos ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : openAlbum.photos.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No photos in this album yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {openAlbum.photos.map((photo) => (
              <button key={photo.id} onClick={() => setLightbox(photo)} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-800">
                <img src={photo.imageData} alt={photo.caption || ''} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        )}

        {lightbox && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
            <img src={lightbox.imageData} alt={lightbox.caption || ''} className="max-w-full max-h-full rounded-xl" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Photo Gallery</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Campus & event albums shared by your institution</p>
      </div>

      {albums.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No albums have been shared yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {albums.map((album) => (
            <button key={album.id} onClick={() => openAlbumView(album)} className="text-left rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {album.coverImage ? (
                  <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <Images className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{album.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{album.category} · {album.photoCount} photo{album.photoCount === 1 ? '' : 's'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
