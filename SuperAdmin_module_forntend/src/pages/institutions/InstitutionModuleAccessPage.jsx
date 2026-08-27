import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import {
  Building2, Search, Check, Loader2, Save, Undo, Info,
  GraduationCap, Users, CheckSquare, Calendar, Award, CreditCard,
  MessageSquare, BookOpen, Bus, Home, Package, FileCheck, BarChart3
} from 'lucide-react';
import institutionService from '../../services/institutionService';

// Must match shared/constants/institutionModules.js MODULE_CATALOG keys
const MODULE_ICONS = {
  student: GraduationCap,
  staff: Users,
  attendance: CheckSquare,
  timetable: Calendar,
  examination: Award,
  fee: CreditCard,
  communication: MessageSquare,
  library: BookOpen,
  transport: Bus,
  hostel: Home,
  inventory: Package,
  certificates: FileCheck,
  reports: BarChart3,
};

export const InstitutionModuleAccessPage = () => {
  const { success, error: showError, warning } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedInst, setSelectedInst] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [initialModules, setInitialModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [instRes, catalogRes] = await Promise.all([
        institutionService.getInstitutions({ limit: 100 }),
        institutionService.getModuleCatalog(),
      ]);
      const catalogList = catalogRes.data || [];
      setCatalog(catalogList);
      if (instRes?.data) {
        setInstitutions(instRes.data);
        if (instRes.data.length > 0) {
          selectInstitution(instRes.data[0], catalogList);
        }
      }
    } catch (err) {
      console.error("Failed to load institutions/module catalog", err);
      showError("Failed to fetch institutions or module catalog.", "Loading Error");
    } finally {
      setLoading(false);
    }
  };

  // Institutions that predate module assignment (or were never explicitly set) default to
  // every module enabled — must match shared/constants/institutionModules.js resolveEnabledModules
  const resolveEnabled = (inst, catalogList) => {
    if (Array.isArray(inst.modules) && inst.modules.length > 0) {
      const validKeys = catalogList.map((m) => m.key);
      return inst.modules.filter((m) => validKeys.includes(m));
    }
    return catalogList.map((m) => m.key);
  };

  const selectInstitution = (inst, catalogList = catalog) => {
    setSelectedInst(inst);
    const resolved = resolveEnabled(inst, catalogList);
    setSelectedModules(resolved);
    setInitialModules(resolved);
  };

  const handleToggleModule = (moduleKey) => {
    setSelectedModules(prev =>
      prev.includes(moduleKey)
        ? prev.filter(m => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleReset = () => {
    if (selectedInst) {
      setSelectedModules(initialModules);
      warning("Module mapping reset to original configuration.", "Reset Done");
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedInst) return;
    try {
      setSaving(true);
      const res = await institutionService.updateInstitutionModules(selectedInst.id, selectedModules);

      success(`Module access updated for ${selectedInst.name}. Their Institute Admin sidebar reflects this immediately on next login/refresh.`, "Modules Saved");
      setInstitutions(prev =>
        prev.map(i => i.id === selectedInst.id ? { ...i, modules: res.data.modules } : i)
      );
      setSelectedInst(prev => ({ ...prev, modules: res.data.modules }));
      setInitialModules(selectedModules);
    } catch (err) {
      console.error("Failed to save modules mapping", err);
      showError(err.message || "Could not save modules configuration.", "Update Failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredInsts = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inst.city && inst.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasChanges = selectedInst &&
    (JSON.stringify([...initialModules].sort()) !== JSON.stringify([...selectedModules].sort()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Modules Mapping"
        subtitle="Assign which optional modules each institution has access to. Changes take effect immediately for that institution's admin/staff/student portals."
        badge={`${institutions.length} Total`}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Panel: Institution Selector */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Institution</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredInsts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No institutions match search</p>
              ) : (
                filteredInsts.map(inst => {
                  const isSelected = selectedInst?.id === inst.id;
                  const activeModulesCount = resolveEnabled(inst, catalog).length;

                  return (
                    <button
                      key={inst.id}
                      onClick={() => selectInstitution(inst)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {inst.code}
                        </span>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {inst.type}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold truncate w-full ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {inst.name}
                      </h4>
                      <div className="flex justify-between items-center w-full mt-1">
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          {activeModulesCount} / {catalog.length} Active Modules
                        </span>
                        <StatusBadge status={inst.status} size="sm" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Feature Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {selectedInst ? (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/40">
                      Active Target: {selectedInst.code}
                    </span>
                    <h2 className="text-lg font-black text-slate-950 dark:text-slate-50 mt-1">{selectedInst.name}</h2>
                    <p className="text-xs text-slate-500">{selectedInst.city}, {selectedInst.state} • Plan: {selectedInst.planName || 'Free'}</p>
                  </div>
                  {hasChanges && (
                    <div className="animate-pulse bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                      Pending Changes Detected
                    </div>
                  )}
                </div>

                {/* Section 1: Always-included baseline (non-toggleable) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Core Platform Access</h3>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-0.2 rounded font-bold">Always Included</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { title: 'Dashboard & Overview', desc: 'Institute admin home dashboard with live stats.' },
                      { title: 'Institution Setup', desc: 'Academic year, department, course, semester, section, subject setup.' },
                      { title: 'Platform Settings', desc: 'Roles, permissions, and institute-level settings.' },
                    ].map((core, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5 opacity-80">
                        <div className="mt-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 p-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{core.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">{core.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Optional Modules (real, persisted, drives Institute Admin sidebar) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Optional Modules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catalog.map(mod => {
                      const IconComp = MODULE_ICONS[mod.key] || Package;
                      const isEnabled = selectedModules.includes(mod.key);

                      return (
                        <div
                          key={mod.key}
                          onClick={() => handleToggleModule(mod.key)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex gap-3 select-none ${
                            isEnabled
                              ? 'bg-emerald-500/5 border-emerald-500 dark:border-emerald-600/60 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center border ${
                            isEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{mod.label}</h4>
                              <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ${
                                isEnabled ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                              }`}>
                                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ${
                                  isEnabled ? 'transform translate-x-3.5' : ''
                                }`}></div>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">{mod.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Floating Bottom Sticky Action Footer */}
                {hasChanges && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl animate-fade-in shadow-lg">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        You have modified the module mapping of {selectedInst.name}.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        disabled={saving}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 hover:dark:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Undo className="w-3.5 h-3.5" /> Revert
                      </button>

                      <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save Mapping
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Select an Institution</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click on an institution from the list to view and configure its mapped feature flags and active premium scopes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionModuleAccessPage;
