import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2, Users } from 'lucide-react';
import staffService from '../../services/staffService';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'];

export const StaffAttendancePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoster = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getAttendance(date)
      .then((res) => {
        const data = res.data || [];
        setRoster(data);
        const initial = {};
        data.forEach((r) => { initial[r.id] = r.attendance?.status || 'PRESENT'; });
        setStatusMap(initial);
      })
      .catch((err) => { notifyError(`Failed to load staff attendance register: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [date, notifyError]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = roster.map((r) => ({ staffId: r.id, status: statusMap[r.id] || 'PRESENT' }));
      await staffService.markAttendance(records, date);
      notifySuccess('Staff attendance recorded successfully!');
      fetchRoster();
    } catch (error) {
      notifyError(`Failed to save attendance: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Faculty Attendance Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daily attendance marking for teaching & admin staff</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
          <button onClick={handleSave} disabled={saving || roster.length === 0} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : error ? (
        <ErrorState onRetry={fetchRoster} />
      ) : roster.length === 0 ? (
        <EmptyState title="No Active Staff" description="Register staff members first to mark attendance." icon={Users} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Emp ID</th>
                <th className="p-3">Faculty Name</th>
                <th className="p-3">Designation & Dept</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {roster.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-mono font-bold text-indigo-600">{r.employeeCode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.firstName} {r.lastName}</td>
                  <td className="p-3 text-slate-500">{r.designation} • {r.department?.name || '—'}</td>
                  <td className="p-3">
                    <select
                      value={statusMap[r.id] || 'PRESENT'}
                      onChange={(e) => setStatusMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffAttendancePage;
