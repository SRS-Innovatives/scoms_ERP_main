import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { Loader2, ArrowLeft, X, Plus, Trash2, GitBranch, Link2, Building2, Pencil } from 'lucide-react';
import moduleRegistryService from '../../services/moduleRegistryService';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

const MODULE_STATUSES = ['DRAFT', 'TESTING', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'DEPRECATED'];
const ASSIGNMENT_STATUSES = ['AVAILABLE', 'INSTALLED', 'ENABLED', 'DISABLED', 'SUSPENDED', 'TRIAL', 'EXPIRED'];

const Card = ({ title, action, children }) => (
  <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const CONFIG_FIELD_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT'];
const emptyConfigField = { key: '', label: '', type: 'TEXT', options: '' };

const AddVersionModal = ({ open, onClose, onSubmit, submitting }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [configFields, setConfigFields] = useState([]);
  if (!open) return null;

  const updateField = (idx, patch) => setConfigFields((fields) => fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const removeField = (idx) => setConfigFields((fields) => fields.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!version.trim()) return;
    const fields = configFields
      .filter((f) => f.key.trim())
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim() || f.key.trim(),
        type: f.type,
        ...(f.type === 'SELECT' ? { options: f.options.split(',').map((o) => o.trim()).filter(Boolean) } : {}),
      }));
    onSubmit({
      version: version.trim(),
      changelog: changelog.trim() || undefined,
      configSchema: fields.length ? { fields } : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">New Version</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Version (e.g. 1.1.0)</label>
        <input value={version} onChange={(e) => setVersion(e.target.value)}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium mb-3" />
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Changelog</label>
        <textarea rows={3} value={changelog} onChange={(e) => setChangelog(e.target.value)}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium mb-4" />

        <div className="flex items-center justify-between mb-2">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">Config Fields (optional — what institutions can configure)</label>
          <button onClick={() => setConfigFields((f) => [...f, { ...emptyConfigField }])} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
            <Plus className="w-3 h-3" /> Add Field
          </button>
        </div>
        {configFields.length === 0 ? (
          <p className="text-[11px] text-slate-400 mb-2">No configurable fields — institutions won't see any settings for this version.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {configFields.map((field, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="key (e.g. gpsEnabled)" value={field.key} onChange={(e) => updateField(idx, { key: e.target.value })}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white" />
                  <input placeholder="Label" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <select value={field.type} onChange={(e) => updateField(idx, { type: e.target.value })}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white">
                    {CONFIG_FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {field.type === 'SELECT' && (
                    <input placeholder="options, comma-separated" value={field.options} onChange={(e) => updateField(idx, { options: e.target.value })}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white" />
                  )}
                  <button onClick={() => removeField(idx)} className="ml-auto text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !version.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Version'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModuleModal = ({ open, module, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ name: '', description: '', category: '' });
  useEffect(() => {
    if (module) setForm({ name: module.name || '', description: module.description || '', category: module.category || '' });
  }, [module]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Module Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Display Name</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium mb-3" />
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Description</label>
        <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium mb-3" />
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Category</label>
        <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium" />
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button
            onClick={() => form.name.trim() && onSubmit(form)}
            disabled={submitting || !form.name.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddDependencyModal = ({ open, onClose, onSubmit, submitting, options }) => {
  const [dependsOnModuleId, setDependsOnModuleId] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Dependency</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Requires module</label>
        <select value={dependsOnModuleId} onChange={(e) => setDependsOnModuleId(e.target.value)}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium">
          <option value="">Select a module...</option>
          {options.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.key})</option>)}
        </select>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button
            onClick={() => dependsOnModuleId && onSubmit(dependsOnModuleId)}
            disabled={submitting || !dependsOnModuleId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Dependency'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignInstitutionModal = ({ open, onClose, onSubmit, submitting, institutions }) => {
  const [institutionId, setInstitutionId] = useState('');
  const [status, setStatus] = useState('ENABLED');
  if (!open) return null;
  const available = institutions.filter((i) => !i.assignmentStatus || i.assignmentStatus === 'DISABLED');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign to Institution</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Institution</label>
        <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium mb-3">
          <option value="">Select an institution...</option>
          {available.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
        </select>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium">
          {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button
            onClick={() => institutionId && onSubmit({ institutionId, status })}
            disabled={submitting || !institutionId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModuleRegistryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  const [module, setModule] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'edit' | 'version' | 'dependency' | 'assign'

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      moduleRegistryService.getModuleById(id),
      moduleRegistryService.getModules(),
      moduleRegistryService.getAssignableInstitutions(id),
    ])
      .then(([modRes, allRes, instRes]) => {
        setModule(modRes.data);
        setAllModules(allRes.data || []);
        setInstitutions(instRes.data || []);
      })
      .catch((err) => { showError(err.message, 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [id, showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusChange = async (status) => {
    setBusy(true);
    try {
      await moduleRegistryService.updateModuleStatus(id, status);
      success(`Module is now ${status}`, 'Status Updated');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Update Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleEditModule = async (data) => {
    setBusy(true);
    try {
      await moduleRegistryService.updateModule(id, data);
      success('Module details updated', 'Saved');
      setModal(null);
      fetchAll();
    } catch (err) {
      showError(err.message, 'Update Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAddVersion = async (data) => {
    setBusy(true);
    try {
      await moduleRegistryService.createModuleVersion(id, data);
      success(`Version ${data.version} added`, 'Version Added');
      setModal(null);
      fetchAll();
    } catch (err) {
      showError(err.message, 'Add Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAddDependency = async (dependsOnModuleId) => {
    setBusy(true);
    try {
      await moduleRegistryService.addModuleDependency(id, dependsOnModuleId);
      success('Dependency added', 'Dependency Added');
      setModal(null);
      fetchAll();
    } catch (err) {
      showError(err.message, 'Add Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    setBusy(true);
    try {
      await moduleRegistryService.removeModuleDependency(dependencyId);
      success('Dependency removed', 'Removed');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Remove Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (data) => {
    setBusy(true);
    try {
      await moduleRegistryService.assignModuleToInstitution(id, data);
      success('Institution assignment saved', 'Assigned');
      setModal(null);
      fetchAll();
    } catch (err) {
      showError(err.message, 'Assign Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAssignmentStatusChange = async (assignmentId, status) => {
    setBusy(true);
    try {
      await moduleRegistryService.updateModuleAssignment(assignmentId, status);
      success('Assignment updated', 'Updated');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Update Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    setBusy(true);
    try {
      await moduleRegistryService.removeModuleAssignment(assignmentId);
      success('Assignment removed — institution falls back to standard access', 'Removed');
      fetchAll();
    } catch (err) {
      showError(err.message, 'Remove Failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>;
  }
  if (error) {
    return <ErrorState onRetry={fetchAll} />;
  }
  if (!module) {
    return <EmptyState title="Module Not Found" message="This module may have been removed." />;
  }

  const dependencyOptions = allModules.filter(
    (m) => m.id !== module.id && !module.dependencies.some((d) => d.dependsOnModule.id === m.id)
  );

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/super-admin/modules')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Module Registry
      </button>

      <PageHeader
        title={module.name}
        subtitle={module.description || `Key: ${module.key}`}
        badge={module.moduleType}
        actionLabel="Edit Details"
        actionIcon={Pencil}
        onAction={() => setModal('edit')}
      />

      <Card
        title="Lifecycle"
        action={
          <select
            value={module.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={busy}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200"
          >
            {MODULE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={module.status} />
          <span className="text-xs text-slate-500">Current version: <span className="font-mono font-semibold">{module.currentVersion}</span></span>
        </div>
      </Card>

      <Card
        title="Versions"
        action={<button onClick={() => setModal('version')} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"><Plus className="w-3.5 h-3.5" /> Add Version</button>}
      >
        {module.versions.length === 0 ? (
          <p className="text-xs text-slate-400">No versions yet.</p>
        ) : (
          <div className="space-y-2">
            {module.versions.map((v) => (
              <div key={v.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <GitBranch className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">{v.version}</p>
                  {v.changelog && <p className="text-[11px] text-slate-500 mt-0.5">{v.changelog}</p>}
                  {v.configSchema?.fields?.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Config: {v.configSchema.fields.map((f) => f.key).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Dependencies"
        action={<button onClick={() => setModal('dependency')} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"><Plus className="w-3.5 h-3.5" /> Add Dependency</button>}
      >
        {module.dependencies.length === 0 ? (
          <p className="text-xs text-slate-400">This module has no prerequisites.</p>
        ) : (
          <div className="space-y-2">
            {module.dependencies.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{d.dependsOnModule.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{d.dependsOnModule.key}</span>
                </div>
                <button onClick={() => handleRemoveDependency(d.id)} disabled={busy} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Institution Assignments"
        action={<button onClick={() => setModal('assign')} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"><Plus className="w-3.5 h-3.5" /> Assign to Institution</button>}
      >
        {module.assignments.length === 0 ? (
          <p className="text-xs text-slate-400">Not assigned to any institution yet.</p>
        ) : (
          <div className="space-y-2">
            {module.assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{a.institution.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{a.institution.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={a.status}
                    onChange={(e) => handleAssignmentStatusChange(a.id, e.target.value)}
                    disabled={busy}
                    className="px-2 py-1 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => handleRemoveAssignment(a.id)} disabled={busy} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EditModuleModal open={modal === 'edit'} module={module} onClose={() => setModal(null)} onSubmit={handleEditModule} submitting={busy} />
      <AddVersionModal open={modal === 'version'} onClose={() => setModal(null)} onSubmit={handleAddVersion} submitting={busy} />
      <AddDependencyModal open={modal === 'dependency'} onClose={() => setModal(null)} onSubmit={handleAddDependency} submitting={busy} options={dependencyOptions} />
      <AssignInstitutionModal open={modal === 'assign'} onClose={() => setModal(null)} onSubmit={handleAssign} submitting={busy} institutions={institutions} />
    </div>
  );
};

export default ModuleRegistryDetailPage;
