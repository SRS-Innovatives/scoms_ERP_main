import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Images, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import galleryService from '../../services/galleryService';

const fileToDataUri = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const GalleryPage = () => {
  const { success, error: showError } = useNotification();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const fetchAlbums = useCallback(() => {
    setLoading(true);
    galleryService.getAlbums()
      .then((res) => setAlbums(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load albums', 'Load Failed'))
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

  const handleUploadPhotos = async (fileList) => {
    if (!fileList || fileList.length === 0 || !openAlbum) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(fileList)) {
      try {
        const imageData = await fileToDataUri(file);
        await galleryService.addPhoto(openAlbum.album.id, { imageData });
        successCount++;
      } catch (err) {
        showError(`Failed to upload ${file.name}: ${err.message}`, 'Upload Failed');
      }
    }
    setUploading(false);
    if (successCount > 0) {
      success(`${successCount} photo(s) uploaded successfully!`, 'Upload Complete');
      openAlbumView(openAlbum.album);
      fetchAlbums();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (openAlbum) {
    return (
      <div className="space-y-6">
        <button onClick={() => setOpenAlbum(null)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4" /> Back to Albums
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{openAlbum.album.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{openAlbum.album.description}</p>
          </div>
          <label className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Add Photos'}
            <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => handleUploadPhotos(e.target.files)} />
          </label>
        </div>

        {loadingPhotos ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : openAlbum.photos.length === 0 ? (
          <EmptyState title="No Photos Yet" message="Be the first to add photos to this album." icon={Images} />
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
        <p className="text-xs text-slate-500 dark:text-slate-400">Campus & event albums — you can add photos to existing albums</p>
      </div>

      {albums.length === 0 ? (
        <EmptyState title="No Albums Yet" message="Institute Admin hasn't created any albums yet." icon={Images} />
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
