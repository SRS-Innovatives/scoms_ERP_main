import React, { useState, useEffect, useCallback } from 'react';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { FileText, Plus, Edit, Trash2, Lock, Loader2 } from 'lucide-react';
import templateService from '../../services/templateService';

const CHANNELS = ['SMS', 'EMAIL', 'WHATSAPP'];
const emptyForm = { channel: 'SMS', category: '', title: '', subject: '', body: '' };

export const TemplateLibraryPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('SMS');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    templateService.getAll()
      .then((res) => setTemplates(res.data || []))
      .catch((err) => notifyError(`Failed to load templates: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, channel: channelFilter });
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingId(t.id);
    setForm({ channel: t.channel, category: t.category, title: t.title, subject: t.subject || '', body: t.body });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await templateService.update(editingId, { title: form.title, subject: form.subject, body: form.body });
        notifySuccess(`Template "${form.title}" updated successfully!`);
      } else {
        await templateService.create(form);
        notifySuccess(`Template "${form.title}" created successfully!`);
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      notifyError(`Failed to save template: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await templateService.remove(deleteTarget.id);
      notifySuccess(`Template "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      notifyError(`Failed to delete: ${err.message}`);
      setDeleteTarget(null);
    }
  };

  const filtered = templates.filter((t) => t.channel === channelFilter);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Message Template Library</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">20 ready-made templates per channel, plus your own custom ones — used when composing SMS/Email/WhatsApp broadcasts</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
          <Plus className="w-4 h-4" /> New Custom Template
        </button>
      </div>

      <div className="flex gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => setChannelFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${channelFilter === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            {c} ({templates.filter((t) => t.channel === c).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Templates" icon={FileText} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    {t.title}
                    {t.isSystem && <Lock className="w-3 h-3 text-slate-400" title="System template — read-only" />}
                  </h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t.category.replace(/_/g, ' ')}</p>
                </div>
                {!t.isSystem && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditModal(t)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {t.subject && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject: {t.subject}</p>}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-4">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={modalOpen}
        title={editingId ? 'Edit Custom Template' : 'New Custom Template'}
        submitLabel={editingId ? 'Save Changes' : 'Create Template'}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          ...(editingId ? [] : [
            { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS.map((c) => ({ value: c, label: c })) },
            { name: 'category', label: 'Category (e.g. FEE_DUE_REMINDER)', required: true },
          ]),
          { name: 'title', label: 'Title', required: true, span: 'full' },
          ...(form.channel === 'EMAIL' ? [{ name: 'subject', label: 'Email Subject', required: true, span: 'full' }] : []),
          { name: 'body', label: 'Message Body', type: 'textarea', required: true, span: 'full' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Template"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default TemplateLibraryPage;
