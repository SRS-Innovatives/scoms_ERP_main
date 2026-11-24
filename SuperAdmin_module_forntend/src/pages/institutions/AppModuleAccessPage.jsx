import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Building2, Search, Loader2, Save, Undo, Info, Smartphone, Lock, Eye, EyeOff } from 'lucide-react';
import institutionService from '../../services/institutionService';

// Must match shared/appModules/catalog.js APPS.
const APP_TABS = [
  { key: 'STUDENT_APP', label: 'Student / Parent App', available: true },
  { key: 'STAFF_APP', label: 'Staff App', available: true },
];

// Fallback labels; the server sends `columns` with labels too.
const ROLE_LABELS = {
  STUDENT: 'Student', PARENT: 'Parent', ALL_STAFF: 'All staff',
  TEACHER: 'Teacher', HOD: 'HOD', PRINCIPAL: 'Principal', VICE_PRINCIPAL: 'Vice Principal', STAFF: 'Staff',
  ACCOUNTANT: 'Accountant', LIBRARIAN: 'Librarian', TRANSPORT_MANAGER: 'Transport', HOSTEL_WARDEN: 'Hostel Warden',
  EXAM_ADMIN: 'Exam Admin', PLACEMENT_OFFICER: 'Placement',
};

const hiddenKeysOf = (matrix) => {
  const set = new Set();
  matrix?.modules.forEach((m) =>
    Object.entries(m.roles).forEach(([role, r]) => {
      if (r.applicable && !r.visible) set.add(`${role}:${m.key}`);
    }),
  );
  return set;
};

const sameSet = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));

const Toggle = ({ on, disabled, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-pressed={on}
    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
      disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : on ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
    }`}
  >
    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on && !disabled ? 'translate-x-4' : ''}`} />
  </button>
);

export const AppModuleAccessPage = () => {
  const { success, error: showError, warning } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [selectedInst, setSelectedInst] = useState(null);
  const [app, setApp] = useState('STUDENT_APP');
  const [matrix, setMatrix] = useState(null);
  const [hidden, setHidden] = useState(new Set());
  const [initialHidden, setInitialHidden] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await institutionService.getInstitutions({ limit: 100 });
        const list = res?.data || [];
        setInstitutions(list);
        if (list.length > 0) setSelectedInst(list[0]);
      } catch (err) {
        showError(err.message || 'Failed to fetch institutions.', 'Loading Error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyMatrix = (data) => {
    const h = hiddenKeysOf(data);
    setMatrix(data);
    setHidden(h);
    setInitialHidden(new Set(h));
  };

  useEffect(() => {
    if (!selectedInst) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMatrix(true);
        const res = await institutionService.getInstitutionAppModules(selectedInst.id, app);
        if (!cancelled) applyMatrix(res.data);
      } catch (err) {
        if (!cancelled) {
          setMatrix(null);
          showError(err.message || 'Failed to load app module access.', 'Loading Error');
        }
      } finally {
        if (!cancelled) setLoadingMatrix(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInst?.id, app]);

  const hasChanges = !sameSet(hidden, initialHidden);

  const toggle = (role, moduleKey) => {
    const k = `${role}:${moduleKey}`;
    setHidden((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(k)) nextSet.delete(k); else nextSet.add(k);
      return nextSet;
    });
  };

  const setRoleAll = (role, visible) => {
    setHidden((prev) => {
      const nextSet = new Set(prev);
      matrix.modules.forEach((m) => {
        if (!m.roles[role]?.applicable || !m.institutionEnabled) return;
        const k = `${role}:${m.key}`;
        if (visible) nextSet.delete(k); else nextSet.add(k);
      });
      return nextSet;
    });
  };

  const handleSelectInstitution = (inst) => {
    if (hasChanges && !window.confirm('Discard unsaved changes for this institution?')) return;
    setSelectedInst(inst);
  };

  const handleRevert = () => {
    setHidden(new Set(initialHidden));
    warning('App module access reset to the saved configuration.', 'Reset Done');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = [...hidden].map((k) => {
        const [role, moduleKey] = k.split(':');
        return { role, moduleKey };
      });
      const res = await institutionService.updateInstitutionAppModules(selectedInst.id, app, payload);
      applyMatrix(res.data);
      success(`Saved for ${selectedInst.name}. The app picks it up the next time it refreshes — no re-login needed.`, 'App Modules Saved');
    } catch (err) {
      showError(err.message || 'Could not save app module access.', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map();
    (matrix?.modules || []).forEach((m) => {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group).push(m);
    });
    return [...map.entries()];
  }, [matrix]);

  const roles = matrix?.roles || [];
  const columnLabel = (key) => matrix?.columns?.find((c) => c.key === key)?.label || ROLE_LABELS[key] || key;
  // The staff app has one column for all staff; each module lists which roles actually get it.
  const showForRoles = matrix?.app === 'STAFF_APP';
  const allColumnRoles = matrix?.columns?.[0]?.roles?.length || 0;

  const visibleCount = (role) =>
    (matrix?.modules || []).filter((m) => m.institutionEnabled && m.roles[role]?.applicable && !hidden.has(`${role}:${m.key}`)).length;

  const filteredInsts = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase();
    return inst.name.toLowerCase().includes(q) || inst.code.toLowerCase().includes(q) || (inst.city || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Module Access"
        subtitle="Choose which modules students, parents and staff see in the SCOMS mobile apps, per institution. This can only hide modules — anything the institution doesn't have under Institution Modules stays off."
        badge={`${institutions.length} Total`}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Institution selector */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Institution</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredInsts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No institutions match search</p>
              ) : (
                filteredInsts.map((inst) => {
                  const isSelected = selectedInst?.id === inst.id;
                  return (
                    <button
                      key={inst.id}
                      onClick={() => handleSelectInstitution(inst)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                          {inst.code}
                        </span>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{inst.type}</span>
                      </div>
                      <h4 className={`text-xs font-bold truncate w-full ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{inst.name}</h4>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Matrix */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedInst ? (
              <div className="glass-card p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Select an Institution</h3>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/40">
                      {selectedInst.code}
                    </span>
                    <h2 className="text-lg font-black text-slate-950 dark:text-slate-50 mt-1">{selectedInst.name}</h2>
                  </div>
                  {hasChanges && (
                    <div className="animate-pulse bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                      Unsaved changes
                    </div>
                  )}
                </div>

                {/* App tabs */}
                <div className="flex gap-2 flex-wrap">
                  {APP_TABS.map((t) => (
                    <button
                      key={t.key}
                      disabled={!t.available}
                      onClick={() => {
                        if (t.key === app) return;
                        if (hasChanges && !window.confirm('Discard unsaved changes?')) return;
                        setApp(t.key);
                      }}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                        app === t.key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> {t.label}
                      {!t.available && <span className="text-[9px] font-semibold opacity-80">(coming next)</span>}
                    </button>
                  ))}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Login, Dashboard, Profile, Notifications and Settings are always available. A module marked
                    <Lock className="inline w-3 h-3 mx-1" />needs to be turned on for this institution under Institution Modules first.
                    Hidden modules disappear from the app and their API is blocked for that role.
                    {app === 'STAFF_APP' && (
                      <> In the Staff App one switch covers all staff; the tags under each module show which roles
                      actually get it (decided by their permissions). Messages and SMS start off.</>
                    )}
                  </p>
                </div>

                {loadingMatrix || !matrix ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 pr-3 font-bold uppercase tracking-wider text-[10px]">Module</th>
                          {roles.map((role) => (
                            <th key={role} className="py-2 px-3 text-center w-32">
                              <div className="font-bold uppercase tracking-wider text-[10px]">{columnLabel(role)}</div>
                              <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{visibleCount(role)} visible</div>
                              <div className="flex justify-center gap-1 mt-1">
                                <button onClick={() => setRoleAll(role, true)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={`Show all for ${columnLabel(role)}`}>
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setRoleAll(role, false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={`Hide all for ${columnLabel(role)}`}>
                                  <EyeOff className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map(([group, mods]) => (
                          <React.Fragment key={group}>
                            <tr>
                              <td colSpan={1 + roles.length} className="pt-4 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{group}</td>
                            </tr>
                            {mods.map((m) => (
                              <tr key={m.key} className={`border-b border-slate-100 dark:border-slate-800/60 ${m.institutionEnabled ? '' : 'opacity-50'}`}>
                                <td className="py-2.5 pr-3">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    {!m.institutionEnabled && <Lock className="w-3 h-3 text-slate-400" />}
                                    {m.label}
                                  </div>
                                  {!m.institutionEnabled && (
                                    <div className="text-[10px] text-slate-500">Institution module “{m.requires}” is off</div>
                                  )}
                                  {showForRoles && Array.isArray(m.forRoles) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {allColumnRoles > 0 && m.forRoles.length >= allColumnRoles ? (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">Every staff role</span>
                                      ) : (
                                        m.forRoles.map((r) => (
                                          <span key={r} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {ROLE_LABELS[r] || r}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </td>
                                {roles.map((role) => {
                                  const r = m.roles[role];
                                  const disabled = !r?.applicable || !m.institutionEnabled;
                                  const on = r?.applicable && !hidden.has(`${role}:${m.key}`);
                                  return (
                                    <td key={role} className="py-2.5 px-3 text-center">
                                      {r?.applicable ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <Toggle
                                            on={on}
                                            disabled={disabled}
                                            onClick={() => toggle(role, m.key)}
                                            title={disabled ? 'Enable this module for the institution first' : on ? 'Visible — click to hide' : 'Hidden — click to show'}
                                          />
                                          {r.defaultVisible === false && (
                                            <span className="text-[9px] font-semibold text-slate-400" title="Starts hidden for this role until you turn it on">
                                              default off
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400" title="Not applicable to this role">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {hasChanges && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg sticky bottom-4">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">You have unsaved changes for {selectedInst.name}.</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRevert}
                        disabled={saving}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Undo className="w-3.5 h-3.5" /> Revert
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Save className="w-3.5 h-3.5" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppModuleAccessPage;
