import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { UploadCloud, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import materialService from '../../services/materialService';
import ErrorState from '../../components/common/ErrorState';

const FILE_TYPES = ['PDF', 'PPT', 'DOC', 'VIDEO', 'LINK'];

export const UploadMaterialPage = () => {
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', subjectId: '', fileType: 'PDF', fileUrl: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    materialService.getMySubjects()
      .then((res) => {
        const data = res.data || [];
        setSubjects(data);
        if (data.length > 0) setForm((prev) => ({ ...prev, subjectId: data[0].id }));
      })
      .catch((err) => { showError(err.message || 'Failed to load your subjects', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await materialService.createMaterial(form);
      success(`Study material "${form.title}" shared with students!`, 'Upload Complete');
      navigate('/staff/materials/library');
    } catch (err) {
      showError(err.message || 'Failed to share material', 'Upload Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (subjects.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl text-center text-xs text-slate-500">
        You aren't assigned to teach any subject yet. Ask your Institute Admin to assign you before sharing materials.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-sky-500" /> Share Class Notes & Learning Resources
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Resource Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Unit 4: Magnetism Solved Formula Sheet & Notes"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Format</label>
            <select
              value={form.fileType}
              onChange={(e) => setForm({ ...form, fileType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Resource Link (Google Drive, YouTube, etc.)</label>
          <input
            type="url"
            required
            placeholder="https://drive.google.com/..."
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          />
          <p className="text-[11px] text-slate-400 mt-1">No file storage yet — share a link to the resource instead of uploading a file directly.</p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What this resource covers..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {submitting ? 'Sharing...' : 'Share Material'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMaterialPage;
