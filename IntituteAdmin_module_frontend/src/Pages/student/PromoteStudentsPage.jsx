import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import FormSection from '../../components/common/FormSection';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { ArrowUpRight, Users, Loader2 } from 'lucide-react';
import studentService from '../../services/studentService';
import sectionService from '../../services/sectionService';

export const PromoteStudentsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [sections, setSections] = useState([]);
  const [fromSectionId, setFromSectionId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    sectionService.getAll()
      .then((res) => {
        const data = res.data || [];
        setSections(data);
        if (data.length > 0) setFromSectionId(data[0].id);
      })
      .catch((err) => notifyError(`Failed to load sections: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const loadStudents = useCallback(() => {
    if (!fromSectionId) { setStudents([]); return; }
    setLoadingStudents(true);
    studentService.getAll({ sectionId: fromSectionId, limit: 200 })
      .then((res) => setStudents(res.data || []))
      .catch((err) => notifyError(`Failed to load students: ${err.message}`))
      .finally(() => setLoadingStudents(false));
  }, [fromSectionId, notifyError]);

  useEffect(() => { loadStudents(); setSelectedIds([]); }, [loadStudents]);

  const columns = [
    { header: 'Roll No', key: 'rollNumber', render: (val) => <span className="font-mono font-bold text-indigo-600">{val || '—'}</span> },
    { header: 'Student Name', key: 'firstName', sortable: false, render: (_v, row) => <span className="font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</span> },
    { header: 'Current Section', key: 'section', sortable: false, render: (val) => val?.name || '—' },
  ];

  const handlePromote = async () => {
    if (!toSectionId) {
      notifyError('Select a target section to promote into.');
      return;
    }
    const idsToPromote = selectedIds.length > 0 ? selectedIds : students.map((s) => s.id);
    if (idsToPromote.length === 0) {
      notifyError('No students to promote.');
      return;
    }
    setPromoting(true);
    try {
      const res = await studentService.promote(idsToPromote, toSectionId);
      notifySuccess(`${res.data.promotedCount} student(s) promoted successfully!`, 'Promotion Complete');
      loadStudents();
    } catch (err) {
      notifyError(`Failed to promote students: ${err.message}`);
    } finally {
      setPromoting(false);
    }
  };

  const sectionLabel = (s) => `${s.semester?.course?.name || ''} — ${s.semester?.name || ''} — ${s.name} (${s._count?.students ?? 0} students)`;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Batch Promotion Module</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Bulk-move students from one section to another (e.g. next semester's section)</p>
      </div>

      {sections.length === 0 ? (
        <EmptyState title="No Sections Set Up" description="Create sections under Institution Setup before promoting students." icon={Users} />
      ) : (
        <>
          <FormSection title="Select Section Transition" subtitle="Choose the current section and the target section to promote into">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">From Section</label>
                <select value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium">
                  {sections.map((s) => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Promote To Section</label>
                <select value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium">
                  <option value="">Select target section...</option>
                  {sections.filter((s) => s.id !== fromSectionId).map((s) => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePromote}
                  disabled={promoting}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{promoting ? 'Promoting...' : `Promote ${selectedIds.length || 'All'} Student(s)`}</span>
                </button>
              </div>
            </div>
          </FormSection>

          {loadingStudents ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
          ) : students.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No students in this section.
            </div>
          ) : (
            <DataTable
              selectable
              selectedIds={selectedIds}
              onSelectRow={(id, checked) => {
                if (checked) setSelectedIds([...selectedIds, id]);
                else setSelectedIds(selectedIds.filter((x) => x !== id));
              }}
              columns={columns}
              data={students}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PromoteStudentsPage;
