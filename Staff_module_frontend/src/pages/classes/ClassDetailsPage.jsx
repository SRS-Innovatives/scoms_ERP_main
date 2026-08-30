import React, { useEffect, useState } from 'react';
import StudentTable from '../../components/common/StudentTable';
import attendanceService from '../../services/attendanceService';
import profileService from '../../services/profileService';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const toRow = (s, classLabel) => ({
  id: s.id,
  rollNo: s.rollNumber || s.admissionNumber,
  name: `${s.firstName} ${s.lastName}`,
  gender: s.gender === 'MALE' ? 'M' : s.gender === 'FEMALE' ? 'F' : '—',
  class: classLabel,
  attendancePercent: s.attendancePercent ?? 0,
  lastMarks: '—',
  status: s.status === 'ACTIVE' ? 'Active' : s.status,
});

export const ClassDetailsPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [profile, setProfile] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    Promise.all([attendanceService.getMyClasses(), profileService.getMyProfile()])
      .then(([classesRes, profileRes]) => {
        const list = classesRes.data || [];
        setMappings(list);
        setProfile(profileRes.data);
        if (list.length > 0) setSelectedMappingId(list[0].id);
      })
      .catch((err) => showError(err.message || 'Failed to load classes', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const selectedMapping = mappings.find((m) => m.id === selectedMappingId);

  useEffect(() => {
    if (!selectedMapping) return;
    setLoadingRoster(true);
    attendanceService.getRoster(selectedMapping.section.id)
      .then((res) => setRoster(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load roster', 'Load Failed'))
      .finally(() => setLoadingRoster(false));
  }, [selectedMappingId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (mappings.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        You have no assigned classes yet. Ask your Institute Admin to assign you to a subject/section.
      </div>
    );
  }

  const classLabel = selectedMapping ? `${selectedMapping.section?.semester?.course?.name || ''} — ${selectedMapping.section?.name}` : '';

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            Subject Teacher: {profile?.firstName} {profile?.lastName}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{classLabel} • {selectedMapping?.subject?.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedMapping?.section?._count?.students ?? 0} Students Enrolled</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedMappingId}
            onChange={(e) => setSelectedMappingId(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            {mappings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.section?.semester?.course?.name} — {m.section?.name} ({m.subject?.name})
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate('/staff/attendance/take')}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm whitespace-nowrap"
          >
            Take Class Attendance
          </button>
        </div>
      </div>

      {loadingRoster ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <StudentTable
          students={roster.map((s) => toRow(s, classLabel))}
          onViewProfile={() => navigate('/staff/performance/progress')}
          onContactParent={() => navigate('/staff/communication/parent-messages')}
        />
      )}
    </div>
  );
};

export default ClassDetailsPage;
