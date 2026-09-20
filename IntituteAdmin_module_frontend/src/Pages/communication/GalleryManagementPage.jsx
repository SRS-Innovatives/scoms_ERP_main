import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { Images, Plus, Trash2, Upload, ArrowLeft, Loader2, X } from 'lucide-react';
import galleryService from '../../services/galleryService';

const CATEGORIES = ['EVENTS', 'SPORTS', 'ACADEMICS', 'CULTURAL', 'GENERAL'];
const emptyForm = { title: '', description: '', category: 'GENERAL' };

const fileToDataUri = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const GalleryManagementPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [openAlbum, setOpenAlbum] = useState(null); // { album, photos } | null
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteAlbumTarget, setDeleteAlbumTarget] = useState(null);
  const [deletePhotoTarget, setDeletePhotoTarget] = useState(null);

  const fetchAlbums = useCallback(() => {
    setLoading(true);
    setError(false);
    galleryService.getAlbums()
      .then((res) => setAlbums(res.data || []))
      .catch((err) => { notifyError(`Failed to load albums: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const openAlbumView = (album) => {
    setLoadingPhotos(true);
    setOpenAlbum({ album, photos: [] });
    galleryService.getAlbumPhotos(album.id)
      .then((res) => setOpenAlbum({ album: res.data.album, photos: res.data.photos }))
      .catch((err) => notifyError(`Failed to load photos: ${err.message}`))
      .finally(() => setLoadingPhotos(false));
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await galleryService.createAlbum(form);
      notifySuccess(`Album "${form.title}" created!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAlbums();
    } catch (err) {
      notifyError(`Failed to create album: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumTarget) return;
    try {
      await galleryService.deleteAlbum(deleteAlbumTarget.id);
      notifySuccess(`Album "${deleteAlbumTarget.title}" deleted.`);
      setDeleteAlbumTarget(null);
      setOpenAlbum(null);
      fetchAlbums();
    } catch (err) {
      notifyError(`Failed to delete album: ${err.message}`);
      setDeleteAlbumTarget(null);
    }
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
        notifyError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }
    setUploading(false);
    if (successCount > 0) {
      notifySuccess(`${successCount} photo(s) uploaded successfully!`);
      openAlbumView(openAlbum.album);
      fetchAlbums();
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoTarget) return;
    try {
      await galleryService.deletePhoto(deletePhotoTarget);
      notifySuccess('Photo deleted.');
      setDeletePhotoTarget(null);
      openAlbumView(openAlbum.album);
      fetchAlbums();
    } catch (err) {
      notifyError(`Failed to delete photo: ${err.message}`);
      setDeletePhotoTarget(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchAlbums} />;
  }

  // --- Album detail view ---
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
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Photos'}
              <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => handleUploadPhotos(e.target.files)} />
            </label>
            <button onClick={() => setDeleteAlbumTarget(openAlbum.album)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loadingPhotos ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : openAlbum.photos.length === 0 ? (
          <EmptyState title="No Photos Yet" description="Upload photos to this album." icon={Images} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {openAlbum.photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-800">
                <img src={photo.imageData} alt={photo.caption || ''} className="w-full h-full object-cover" />
                <button
                  onClick={() => setDeletePhotoTarget(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {photo.uploadedBy && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                    {photo.uploadedBy.firstName} {photo.uploadedBy.lastName}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteAlbumTarget}
          title="Delete Album"
          message={`Delete "${deleteAlbumTarget?.title}" and all its photos? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteAlbum}
          onCancel={() => setDeleteAlbumTarget(null)}
        />
        <ConfirmDialog
          isOpen={!!deletePhotoTarget}
          title="Delete Photo"
          message="Delete this photo? This cannot be undone."
          confirmText="Delete"
          onConfirm={handleDeletePhoto}
          onCancel={() => setDeletePhotoTarget(null)}
        />
      </div>
    );
  }

  // --- Album list view ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Photo Gallery</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Campus & event albums — visible to Staff and Students too</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
          <Plus className="w-4 h-4" /> New Album
        </button>
      </div>

      {albums.length === 0 ? (
        <EmptyState title="No Albums Yet" description="Create an album to start uploading event or campus photos." actionLabel="New Album" onAction={() => setModalOpen(true)} icon={Images} />
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

      <FormModal
        isOpen={modalOpen}
        title="New Album"
        icon={Images}
        submitLabel="Create Album"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateAlbum}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Album Title', required: true, span: 'full' },
          { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default GalleryManagementPage;
