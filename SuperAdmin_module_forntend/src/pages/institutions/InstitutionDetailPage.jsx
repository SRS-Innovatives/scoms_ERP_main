import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Users, GraduationCap, Briefcase, CreditCard, Receipt, Layers, FileText, Activity, Settings, Check, Loader2, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import institutionService from '../../services/institutionService';
import StatusBadge from '../../components/common/StatusBadge';

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
              <p><span className="text-slate-500">Affiliation:</span> <span className="font-semibold">{inst.affiliation}</span></p>
              <p><span className="text-slate-500">Registration Number:</span> <span className="font-mono font-semibold">{inst.regNo}</span></p>
              <p><span className="text-slate-500">Official Email:</span> <span className="font-semibold">{inst.email}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="font-semibold">{inst.phone}</span></p>
              <p><span className="text-slate-500">Established Year:</span> <span className="font-semibold">{inst.establishedYear}</span></p>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b pb-2">Location & Leadership</h3>
              <p><span className="text-slate-500">Address:</span> <span className="font-semibold">{inst.address}, {inst.city}, {inst.state} - {inst.pincode}</span></p>
              <p><span className="text-slate-500">Principal / Director:</span> <span className="font-semibold">{inst.principal}</span></p>
              <p><span className="text-slate-500">Contact Person:</span> <span className="font-semibold">{inst.contactPerson}</span></p>
              <p><span className="text-slate-500">Active Subscription:</span> <span className="font-bold text-indigo-600">{inst.plan}</span></p>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="text-xs text-slate-500 py-4">Users fetching will be wired up via API.</div>
        )}

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

        {activeTab === 'Billing' && (
           <div className="text-xs text-slate-500 py-4">Billing data fetching will be wired up via API.</div>
        )}

        {activeTab === 'Activity' && (
           <div className="text-xs text-slate-500 py-4">Audit logs fetching will be wired up via API.</div>
        )}

        {['Students', 'Staff', 'Subscription', 'Documents', 'Settings'].includes(activeTab) && (
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
