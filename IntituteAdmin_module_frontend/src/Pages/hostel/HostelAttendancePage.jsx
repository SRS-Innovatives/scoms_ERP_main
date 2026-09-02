import React, { useState, useEffect, useCallback } from 'react';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Save, Loader2, Moon } from 'lucide-react';
import hostelService from '../../services/hostelService';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LEAVE'];

export const HostelAttendancePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRoster = useCallback(() => {
    setLoading(true);
    hostelService.getAttendance(date)
      .then((res) => {
        const data = res.data || [];
        setRoster(data);
        const initial = {};
        data.forEach((r) => { initial[r.bedId] = r.attendance?.status || 'PRESENT'; });
        setStatusMap(initial);
      })
      .catch((err) => notifyError(`Failed to load hostel roster: ${err.message}`))
      .finally(() => setLoading(false));
  }, [date, notifyError]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = roster.map((r) => ({ bedId: r.bedId, status: statusMap[r.bedId] || 'PRESENT' }));
      await hostelService.markAttendance(records, date);
      notifySuccess('Night curfew roll call recorded successfully!');
      fetchRoster();
    } catch (error) {
      notifyError(`Failed to save roll call: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Night Curfew Roll Call</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Night attendance roll call register for all resident hostellers</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
          <button onClick={handleSave} disabled={saving || roster.length === 0} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Roll Call'}
          </button>
        </div>
      </div>

      {roster.length === 0 ? (
        <EmptyState title="No Resident Hostellers" description="Allocate beds to students under Room Allocation to begin roll call." icon={Moon} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Roll No</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Hostel Block & Room</th>
                <th className="p-3">Night Roll Call (09:00 PM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {roster.map((r) => (
                <tr key={r.bedId}>
                  <td className="p-3 font-mono font-bold text-indigo-600">{r.student?.rollNumber}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.student?.firstName} {r.student?.lastName}</td>
                  <td className="p-3 text-slate-500">{r.hostel?.name} — Room {r.roomNumber}/{r.bedNumber}</td>
                  <td className="p-3">
                    <select
                      value={statusMap[r.bedId] || 'PRESENT'}
                      onChange={(e) => setStatusMap((prev) => ({ ...prev, [r.bedId]: e.target.value }))}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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

export default HostelAttendancePage;
