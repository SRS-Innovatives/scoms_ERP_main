import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Loader2, Layers, Plus, X, ChevronRight } from 'lucide-react';
import moduleRegistryService from '../../services/moduleRegistryService';
import { useNotification } from '../../context/NotificationContext';

const MODULE_TYPES = ['CORE', 'STANDARD', 'PLUGIN', 'CUSTOM'];

const CreateModuleModal = ({ open, onClose, onCreated }) => {
  const { success, error: showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', description: '', category: '', moduleType: 'STANDARD' });

  if (!open) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.key.trim() || !form.name.trim()) {
      showError('Key and name are required', 'Missing Fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await moduleRegistryService.createModule({
        ...form,
        key: form.key.trim(),
        name: form.name.trim(),
      });
      success(`"${form.name}" created as a draft`, 'Module Created');
      onCreated(res.data);
      setForm({ key: '', name: '', description: '', category: '', moduleType: 'STANDARD' });
    } catch (err) {
      showError(err.message, 'Create Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">New Module Definition</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Key (immutable, e.g. "transport")</label>
            <input value={form.key} onChange={set('key')} placeholder="lowercase_key"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Display Name</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Transport & Bus Tracking"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Description</label>
            <textarea rows={2} value={form.description} onChange={set('description')} placeholder="What this module does"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Category</label>
              <input value={form.category} onChange={set('category')} placeholder="e.g. Academics"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Type</label>
              <select value={form.moduleType} onChange={set('moduleType')}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium">
                {MODULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Module'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModuleManagerPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    moduleRegistryService.getModules()
      .then((res) => setModules(res.data || []))
      .catch((err) => showError(err.message, 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const columns = [
    {
      header: 'Module', key: 'name',
      render: (v, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{v}</p>
          <p className="text-[10px] font-mono text-slate-400">{row.key}</p>
        </div>
      ),
    },
    { header: 'Type', key: 'moduleType', render: (v) => <StatusBadge status={v} size="sm" /> },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} /> },
    { header: 'Version', key: 'currentVersion' },
    {
      header: 'Institutions', key: '_count', sortable: false,
      render: (v) => `${v?.assignments ?? 0} assigned`,
    },
    {
      header: '', key: 'id', sortable: false,
      render: (_, row) => (
        <button
          onClick={() => navigate(`/super-admin/modules/${row.id}`)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Manage <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SCOMS Platform Module Registry"
        subtitle="Define modules, version them, declare dependencies and assign them to institutions."
        actionLabel="New Module"
        actionIcon={Plus}
        onAction={() => setShowCreate(true)}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : modules.length === 0 ? (
        <EmptyState icon={Layers} title="No Modules Defined Yet" message="Create your first module definition to start assigning it to institutions." />
      ) : (
        <DataTable columns={columns} data={modules} searchPlaceholder="Search modules..." />
      )}

      <CreateModuleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(mod) => { setShowCreate(false); fetchAll(); if (mod?.id) navigate(`/super-admin/modules/${mod.id}`); }}
      />
    </div>
  );
};

export default ModuleManagerPage;
