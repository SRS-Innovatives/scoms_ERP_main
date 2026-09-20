import React, { useEffect, useState, useCallback } from 'react';
import PrintLayout from '../../components/print/PrintLayout';
import attendanceService from '../../services/attendanceService';
import profileService from '../../services/profileService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const PrintAttendanceRegister = () => {
  const { error: showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([attendanceService.getMyClasses(), profileService.getMyProfile()])
      .then(([classesRes, profileRes]) => {
        const mappingsData = classesRes.data || [];
        const seen = new Map();
        mappingsData.forEach((m) => { if (!seen.has(m.section.id)) seen.set(m.section.id, m); });
        const unique = Array.from(seen.values());
        setMappings(unique);
        if (unique.length > 0) setSectionId(unique[0].section.id);
        setProfile(profileRes.data);
      })
      .catch((err) => { showError(err.message || 'Failed to load classes', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!sectionId) return;
    setLoadingRoster(true);
    attendanceService.getRoster(sectionId)
      .then((res) => setRoster(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load roster', 'Load Failed'))
      .finally(() => setLoadingRoster(false));
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (mappings.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no assigned classes yet.
      </div>
    );
  }

  const selected = mappings.find((m) => m.section.id === sectionId);
  const classLabel = `${selected?.section?.semester?.course?.name || ''} — ${selected?.section?.name}`;
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          {mappings.map((m) => (
            <option key={m.section.id} value={m.section.id}>{m.section?.semester?.course?.name} — {m.section?.name}</option>
          ))}
        </select>
      </div>

      {loadingRoster ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>
      ) : (
        <PrintLayout title={`MONTHLY ATTENDANCE REGISTER - ${classLabel.toUpperCase()}`} documentNo={`ATT-REG-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}>
          <div className="text-xs space-y-4">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-2">
              <span>Subject Teacher: {profile?.firstName} {profile?.lastName}</span>
              <span>Month: {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</span>
              <span>Total Strength: {roster.length} Students</span>
            </div>

            <table className="w-full text-left border border-slate-400">
              <thead className="bg-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-400">Roll No</th>
                  <th className="p-2 border border-slate-400">Student Name</th>
                  <th className="p-2 border border-slate-400 text-center">Attd %</th>
                  <th className="p-2 border border-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2 border border-slate-300 font-bold">{s.rollNumber || s.admissionNumber}</td>
                    <td className="p-2 border border-slate-300 font-semibold">{s.firstName} {s.lastName}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{s.attendancePercent !== null ? `${s.attendancePercent}%` : 'No data'}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{s.status === 'ACTIVE' ? 'Active' : s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrintLayout>
      )}
    </div>
  );
};

export default PrintAttendanceRegister;
