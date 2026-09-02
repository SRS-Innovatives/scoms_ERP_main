import React, { useEffect, useState } from 'react';
import StudentTable from '../../components/common/StudentTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import attendanceService from '../../services/attendanceService';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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

export const StudentListPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [classOptions, setClassOptions] = useState([{ value: 'All', label: 'All Classes' }]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getMyClasses()
      .then(async (res) => {
        const mappings = res.data || [];
        setClassOptions([
          { value: 'All', label: 'All Classes' },
          ...mappings.map((m) => ({ value: m.section.id, label: `${m.section?.semester?.course?.name || ''} — ${m.section?.name}` })),
        ]);
        const rows = await Promise.all(mappings.map(async (m) => {
          const classLabel = `${m.section?.semester?.course?.name || ''} — ${m.section?.name}`;
          try {
            const rosterRes = await attendanceService.getRoster(m.section.id);
            return (rosterRes.data || []).map((s) => ({ ...toRow(s, classLabel), sectionId: m.section.id }));
          } catch {
            return [];
          }
        }));
        // de-dupe students shared across multiple subject mappings of the same section
        const flat = rows.flat();
        const unique = Array.from(new Map(flat.map((s) => [s.id, s])).values());
        setAllStudents(unique);
      })
      .catch((err) => showError(err.message || 'Failed to load students', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  const filtered = allStudents.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo?.includes(search);
    const matchClass = filterClass === 'All' || s.sectionId === filterClass;
    return matchSearch && matchClass;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Student Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Complete student roster for assigned sections.</p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search student by name or roll number..."
        filterOptions={classOptions}
        filterValue={filterClass}
        onFilterChange={setFilterClass}
      />

      {allStudents.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-8">No assigned classes yet.</p>
      ) : (
        <StudentTable
          students={filtered}
          onViewProfile={() => navigate('/staff/performance/progress')}
          onContactParent={() => navigate('/staff/communication/parent-messages')}
        />
      )}
    </div>
  );
};

export default StudentListPage;
