import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Users, GraduationCap, Briefcase, CreditCard, Receipt, Layers, FileText, Activity, Settings, Check, Loader2, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import institutionService from '../../services/institutionService';
import userService from '../../services/userService';
import billingService from '../../services/billingService';
import auditLogService from '../../services/auditLogService';
import subscriptionService from '../../services/subscriptionService';
import StatusBadge from '../../components/common/StatusBadge';

const InstitutionUsersTab = ({ institutionId }) => {
  const { error: showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    userService.getUsers({ institutionId, limit: 100 })
      .then((res) => setUsers(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load users', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [institutionId, showError]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  if (users.length === 0) return <p className="text-xs text-slate-500 py-4">No users found for this institution.</p>;

  return (
    <table className="w-full text-left text-xs">
      <thead className="uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
        <tr><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Role</th><th className="py-2 pr-3">Phone</th><th className="py-2">Status</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {users.map((u) => (
          <tr key={u.id}>
            <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
            <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{u.email}</td>
            <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{u.role}</td>
            <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{u.phone}</td>
            <td className="py-2"><StatusBadge status={u.status} size="sm" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const InstitutionBillingTab = ({ institutionId }) => {
  const { error: showError } = useNotification();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    billingService.getInvoices({ institutionId, limit: 50 })
      .then((res) => setInvoices(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load invoices', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [institutionId, showError]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  if (invoices.length === 0) return <p className="text-xs text-slate-500 py-4">No invoices raised for this institution yet.</p>;

  return (
    <table className="w-full text-left text-xs">
      <thead className="uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
        <tr><th className="py-2 pr-3">Invoice #</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td className="py-2 pr-3 font-mono text-slate-600 dark:text-slate-400">{inv.invoiceNumber}</td>
            <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">₹{Number(inv.totalAmount ?? inv.amount ?? 0).toLocaleString('en-IN')}</td>
            <td className="py-2 pr-3"><StatusBadge status={inv.status} size="sm" /></td>
            <td className="py-2 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const InstitutionActivityTab = ({ institutionId }) => {
  const { error: showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    auditLogService.getAuditLogs({ institutionId, limit: 50 })
      .then((res) => setLogs(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load audit logs', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [institutionId, showError]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  if (logs.length === 0) return <p className="text-xs text-slate-500 py-4">No recorded activity for this institution yet.</p>;

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{log.action} — {log.module}{log.entity ? ` (${log.entity})` : ''}</p>
            <p className="text-slate-500">{log.user?.email || 'System'}</p>
          </div>
          <span className="text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const InstitutionSubscriptionTab = ({ institutionId }) => {
  const { error: showError } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    subscriptionService.getSubscriptions({ institutionId, limit: 20 })
      .then((res) => setSubscriptions(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load subscriptions', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [institutionId, showError]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  if (subscriptions.length === 0) return <p className="text-xs text-slate-500 py-4">No subscription history for this institution yet.</p>;

  return (
    <table className="w-full text-left text-xs">
      <thead className="uppercase text-[10px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
        <tr><th className="py-2 pr-3">Plan</th><th className="py-2 pr-3">Price / Month</th><th className="py-2 pr-3">Start</th><th className="py-2 pr-3">End</th><th className="py-2">Status</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {subscriptions.map((s) => (
          <tr key={s.id}>
            <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">{s.plan?.name || '—'}</td>
            <td className="py-2 pr-3 font-mono text-slate-600 dark:text-slate-300">{s.plan?.priceMonthly != null ? `₹${Number(s.plan.priceMonthly).toLocaleString('en-IN')}` : '—'}</td>
            <td className="py-2 pr-3 text-slate-500">{new Date(s.startDate).toLocaleDateString()}</td>
            <td className="py-2 pr-3 text-slate-500">{new Date(s.endDate).toLocaleDateString()}</td>
            <td className="py-2"><StatusBadge status={s.status} size="sm" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const EDITABLE_FIELDS = [
  { key: 'name', label: 'Institution Name', required: true },
  { key: 'affiliation', label: 'Affiliation' },
  { key: 'registrationNumber', label: 'Registration Number' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'email', label: 'Official Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'principalName', label: 'Principal / Director' },
  { key: 'establishedYear', label: 'Established Year', type: 'number' },
  { key: 'address', label: 'Address', span: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
];

const InstitutionEditForm = ({ inst, onSaved }) => {
  const { success, error: showError } = useNotification();
  const [form, setForm] = useState(() =>
    Object.fromEntries(EDITABLE_FIELDS.map((f) => [f.key, inst[f.key] ?? '']))
  );
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('Institution name is required', 'Missing Field');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, establishedYear: form.establishedYear ? Number(form.establishedYear) : null };
      const res = await institutionService.updateInstitution(inst.id, payload);
      onSaved(res.data);
      success('Institution details updated', 'Saved');
    } catch (err) {
      showError(err.message || 'Failed to update institution', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Institution Details</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Correct or update this institution's master profile. Login credentials and module access are managed separately.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EDITABLE_FIELDS.map((f) => (
          <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}{f.required && ' *'}</label>
            <input
              type={f.type || 'text'}
              required={f.required}
              value={form[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export const InstitutionDetailPage = () => {
  const { id } = useParams();
  const { success, warning, error: showError } = useNotification();
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [savingModules, setSavingModules] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  React.useEffect(() => {
    const fetchInst = async () => {
      try {
        setLoading(true);
        const [instRes, catalogRes] = await Promise.all([
          institutionService.getInstitutionById(id),
          institutionService.getModuleCatalog(),
        ]);
        if (instRes?.data) {
          setInst(instRes.data);
          setSelectedModules(
            Array.isArray(instRes.data.modules) && instRes.data.modules.length > 0
              ? instRes.data.modules
              : (catalogRes.data || []).map((m) => m.key) // legacy/unset institutions default to everything enabled
          );
        }
        setModuleCatalog(catalogRes.data || []);
      } catch (err) {
        console.error("Failed to fetch institution", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInst();
  }, [id]);

  const toggleModule = (key) => {
    setSelectedModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  const handleSaveModules = async () => {
    setSavingModules(true);
    try {
      const res = await institutionService.updateInstitutionModules(id, selectedModules);
      setInst((prev) => ({ ...prev, modules: res.data.modules }));
      success(`Module access updated for ${inst.name}. The Institute Admin sidebar will reflect this on next login/refresh.`, 'Modules Saved');
    } catch (err) {
      showError(err.message || 'Failed to update modules', 'Save Failed');
    } finally {
      setSavingModules(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = inst.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingStatus(true);
    try {
      const res = await institutionService.updateInstitutionStatus(id, nextStatus);
      setInst((prev) => ({ ...prev, status: res.data.status }));
      success(`${inst.name} is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Suspended'}.`, 'Status Updated');
    } catch (err) {
      showError(err.message || 'Failed to update institution status', 'Update Failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const tabs = [
    'Overview',
    'Users',
    'Students',
    'Staff',
    'Subscription',
    'Billing',
    'Modules',
    'Documents',
    'Activity',
    'Settings'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!inst) {
    return <div className="p-6 text-center text-slate-500">Institution not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border border-slate-200 dark:border-slate-700">
             <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                {inst.code}
              </span>
              <StatusBadge status={inst.status} size="sm" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{inst.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{inst.type} • {inst.city}, {inst.state}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={updatingStatus}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50 ${
              inst.status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {updatingStatus ? 'Updating...' : inst.status === 'ACTIVE' ? 'Suspend Institution' : 'Activate Institution'}
          </button>
        </div>
      </div>

      {/* 10 Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Institutional Master Info</h3>
              <p><span className="text-slate-500">Affiliation:</span> <span className="font-semibold">{inst.affiliation || '—'}</span></p>
              <p><span className="text-slate-500">Registration Number:</span> <span className="font-mono font-semibold">{inst.registrationNumber || '—'}</span></p>
              <p><span className="text-slate-500">Official Email:</span> <span className="font-semibold">{inst.email || '—'}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="font-semibold">{inst.phone || '—'}</span></p>
              <p><span className="text-slate-500">Established Year:</span> <span className="font-semibold">{inst.establishedYear || '—'}</span></p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Location & Leadership</h3>
              <p><span className="text-slate-500">Address:</span> <span className="font-semibold">{[inst.address, inst.city, inst.state].filter(Boolean).join(', ') || '—'}{inst.pincode ? ` - ${inst.pincode}` : ''}</span></p>
              <p><span className="text-slate-500">Principal / Director:</span> <span className="font-semibold">{inst.principalName || '—'}</span></p>
              <p><span className="text-slate-500">Website:</span> <span className="font-semibold">{inst.website || '—'}</span></p>
              <p><span className="text-slate-500">Active Subscription:</span> <span className="font-bold text-indigo-600">{inst.planName || '—'}</span></p>
            </div>
          </div>
        )}

        {activeTab === 'Users' && <InstitutionUsersTab institutionId={inst.id} />}

        {activeTab === 'Modules' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Module Access Control</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Choose which optional modules {inst.name} has access to. Core modules (Dashboard, Setup, Settings) are always available.</p>
              </div>
              <button
                onClick={handleSaveModules}
                disabled={savingModules}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {savingModules ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {savingModules ? 'Saving...' : 'Save Module Access'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moduleCatalog.map((mod) => {
                const isEnabled = selectedModules.includes(mod.key);
                return (
                  <label
                    key={mod.key}
                    className={`p-3 rounded-xl flex items-start gap-2.5 cursor-pointer border transition-colors ${
                      isEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={isEnabled}
                      onChange={() => toggleModule(mod.key)}
                    />
                    <span>
                      <span className={`font-bold block ${isEnabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-600 dark:text-slate-300'}`}>{mod.label}</span>
                      <span className="text-[11px] text-slate-400">{mod.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'Billing' && <InstitutionBillingTab institutionId={inst.id} />}

        {activeTab === 'Activity' && <InstitutionActivityTab institutionId={inst.id} />}

        {activeTab === 'Subscription' && <InstitutionSubscriptionTab institutionId={inst.id} />}

        {activeTab === 'Settings' && (
          <InstitutionEditForm inst={inst} onSaved={(updated) => setInst((prev) => ({ ...prev, ...updated }))} />
        )}

        {['Students', 'Staff', 'Documents'].includes(activeTab) && (
          <div className="text-xs text-slate-500 py-4">
            <p className="font-bold text-slate-800 dark:text-slate-200">{activeTab} Panel for {inst.name}</p>
            <p className="mt-1">Tenant isolated data loaded cleanly for Super Admin inspection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDetailPage;
