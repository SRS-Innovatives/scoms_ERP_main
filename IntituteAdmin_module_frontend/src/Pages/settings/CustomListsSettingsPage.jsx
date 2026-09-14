import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import customListService from '../../services/customListService';
import { ListPlus, Trash2, Loader2, Plus } from 'lucide-react';

const TABS = [
  { key: 'LEAVE_TYPE', label: 'Leave Types', hint: 'Offered on every staff and student leave application form' },
  { key: 'DISCIPLINE_CATEGORY', label: 'Discipline Categories', hint: 'Severity levels used when logging a student discipline incident' },
  { key: 'EXAM_TYPE', label: 'Exam Types', hint: 'Offered when creating a new exam under Examination Setup' },
];

export const CustomListsSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [activeTab, setActiveTab] = useState('LEAVE_TYPE');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customListService.getList(activeTab);
      setEntries(res.data || []);
    } catch (error) {
      notifyError(`Failed to load list: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await customListService.create(activeTab, newLabel.trim());
      notifySuccess(`"${newLabel.trim()}" added`);
      setNewLabel('');
      fetchAll();
    } catch (error) {
      notifyError(error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (entry) => {
    setBusyId(entry.id);
    try {
      await customListService.update(entry.id, { isActive: !entry.isActive });
      fetchAll();
    } catch (error) {
      notifyError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.label}"? Existing records that used it stay unchanged, but it won't be offered on new ones.`)) return;
    setBusyId(entry.id);
    try {
      await customListService.remove(entry.id);
      notifySuccess('Entry deleted');
      fetchAll();
    } catch (error) {
      notifyError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const currentTab = TABS.find((t) => t.key === activeTab);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Custom Lists</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage the picklists your institution's forms offer — add, rename, retire, or bring back any entry, any time
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === t.key ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 -mt-2">{currentTab?.hint}</p>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={`Add a new ${currentTab?.label.toLowerCase().replace(/s$/, '')}...`}
          className="flex-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
        />
        <button type="submit" disabled={adding || !newLabel.trim()} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <ListPlus className="w-4 h-4 text-slate-300" />
                <div>
                  <p className={`text-sm font-semibold ${entry.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{entry.label}</p>
                  <p className="text-[10px] font-mono text-slate-400">{entry.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={entry.isActive} disabled={busyId === entry.id} onChange={() => handleToggleActive(entry)} className="w-4 h-4 rounded text-indigo-600" />
                  Active
                </label>
                <button onClick={() => handleDelete(entry)} disabled={busyId === entry.id} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomListsSettingsPage;
