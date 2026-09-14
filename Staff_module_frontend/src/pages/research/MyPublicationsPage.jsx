import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { FlaskConical, Plus, Loader2, ExternalLink, Edit, Trash2, X, Save } from 'lucide-react';
import researchService from '../../services/researchService';

const TYPE_OPTIONS = [
  { value: 'JOURNAL', label: 'Journal Article' },
  { value: 'CONFERENCE', label: 'Conference Paper' },
  { value: 'PATENT', label: 'Patent' },
  { value: 'BOOK_CHAPTER', label: 'Book Chapter' },
];

const emptyForm = { title: '', publicationType: 'JOURNAL', journalName: '', publicationDate: '', doiOrLink: '', coAuthors: '', description: '' };

export const MyPublicationsPage = () => {
  const { success, error: showError } = useNotification();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    researchService.getAll()
      .then((res) => setPublications(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load publications', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (pub) => {
    setEditingId(pub.id);
    setForm({
      title: pub.title,
      publicationType: pub.publicationType,
      journalName: pub.journalName || '',
      publicationDate: pub.publicationDate?.slice(0, 10) || '',
      doiOrLink: pub.doiOrLink || '',
      coAuthors: pub.coAuthors || '',
      description: pub.description || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await researchService.update(editingId, form);
        success('Publication updated successfully.');
      } else {
        await researchService.create(form);
        success('Publication added successfully.');
      }
      setFormOpen(false);
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to save publication', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pub) => {
    try {
      await researchService.remove(pub.id);
      success('Publication removed.');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to delete publication', 'Delete Failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Publications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Papers, patents, conference talks and book chapters you've recorded</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all">
          <Plus className="w-4 h-4" /> Add Publication
        </button>
      </div>

      {formOpen && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-500" /> {editingId ? 'Edit Publication' : 'New Publication'}
            </h3>
            <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Deep Learning Approaches for Predictive Maintenance"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select value={form.publicationType} onChange={(e) => setForm({ ...form, publicationType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200">
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Publication Date</label>
                <input type="date" required value={form.publicationDate} onChange={(e) => setForm({ ...form, publicationDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Journal / Conference / Patent Office</label>
                <input type="text" value={form.journalName} onChange={(e) => setForm({ ...form, journalName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">DOI / Patent No. / Link</label>
                <input type="text" value={form.doiOrLink} onChange={(e) => setForm({ ...form, doiOrLink: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Co-Authors</label>
              <input type="text" value={form.coAuthors} onChange={(e) => setForm({ ...form, coAuthors: e.target.value })} placeholder="Names of other authors, comma-separated"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Abstract / Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50">
                <Save className="w-4 h-4" /> {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Publication'}
              </button>
            </div>
          </form>
        </div>
      )}

      {publications.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <FlaskConical className="w-8 h-8 text-slate-300" /> No publications recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publications.map((pub) => (
            <div key={pub.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {TYPE_OPTIONS.find((t) => t.value === pub.publicationType)?.label || pub.publicationType}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(pub)} className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(pub)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{pub.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{pub.journalName || '—'} • {new Date(pub.publicationDate).toLocaleDateString('en-IN')}</p>
              {pub.coAuthors && <p className="text-[11px] text-slate-400">Co-authors: {pub.coAuthors}</p>}
              {pub.doiOrLink && (
                <a href={pub.doiOrLink.startsWith('http') ? pub.doiOrLink : `https://${pub.doiOrLink}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPublicationsPage;
