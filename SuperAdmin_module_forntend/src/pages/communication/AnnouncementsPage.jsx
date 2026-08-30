import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import FormInput from '../../components/common/FormInput';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Megaphone, Send, Loader2, Globe, Trash2 } from 'lucide-react';
import announcementService from '../../services/announcementService';
import institutionService from '../../services/institutionService';

export const AnnouncementsPage = () => {
  const { success, error: showError } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [priority, setPriority] = useState('NORMAL');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, instRes] = await Promise.all([
        announcementService.getAll(),
        institutionService.getInstitutions({ limit: 200 }),
      ]);
      setAnnouncements(annRes.data || []);
      setInstitutions(instRes.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load announcements', 'Load Failed');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementService.create({ title, content, institutionId: institutionId || undefined, priority });
      success(
        `"${title}" broadcast to ${institutionId ? institutions.find((i) => i.id === institutionId)?.name : 'all institutions'}.`,
        'Broadcast Published'
      );
      setTitle('');
      setContent('');
      setInstitutionId('');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to publish announcement', 'Broadcast Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, titleText) => {
    try {
      await announcementService.remove(id);
      success(`"${titleText}" removed.`, 'Deleted');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to delete', 'Delete Failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform System Broadcasts" subtitle="Send real notices across the platform — to every institution, or one specific institution." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleBroadcast} className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs h-fit">
          <FormInput label="Announcement Title" required value={title} onChange={setTitle} placeholder="e.g. Scheduled System Upgrade" />
          <Select
            label="Target"
            value={institutionId}
            onChange={setInstitutionId}
            options={[{ value: '', label: 'All Registered Institutions' }, ...institutions.map((i) => ({ value: i.id, label: i.name }))]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: 'NORMAL', label: 'Normal' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type announcement details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Publishing...' : 'Broadcast Now'}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState title="No Announcements Yet" message="Broadcasts you publish will appear here for every institution to see." />
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{a.title}</h4>
                  </div>
                  <button onClick={() => handleDelete(a.id, a.title)} className="p-1 text-slate-400 hover:text-rose-500 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Globe className="w-3 h-3" /> {a.institution?.name || 'All Institutions'}
                  </span>
                  <span>·</span>
                  <span>{new Date(a.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
