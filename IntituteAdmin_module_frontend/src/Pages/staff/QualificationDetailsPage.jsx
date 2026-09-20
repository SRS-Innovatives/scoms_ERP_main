import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Award, GraduationCap, Loader2 } from 'lucide-react';
import staffService from '../../services/staffService';
import ErrorState from '../../components/common/ErrorState';

export const QualificationDetailsPage = () => {
  const { notifyError } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getAll()
      .then((res) => {
        const flattened = (res.data || []).flatMap((s) =>
          (s.qualifications || []).map((q) => ({ ...q, staffName: `${s.firstName} ${s.lastName}`, empId: s.employeeCode }))
        );
        setRows(flattened);
      })
      .catch((err) => { notifyError(`Failed to load qualifications: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Faculty Name', key: 'staffName', render: (val, row) => <span className="font-bold text-slate-900 dark:text-white">{val} <span className="font-mono text-[10px] text-slate-400">({row.empId})</span></span> },
    { header: 'Degree / Diploma', key: 'degree', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'University / Board', key: 'institutionName' },
    { header: 'Year of Passing', key: 'yearOfPassing', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Grade / Class', key: 'grade', render: (val) => <span className="font-semibold text-emerald-700">{val || '—'}</span> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Qualification Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Academic degrees and qualification records — add via each staff member's profile</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No Qualifications on Record" description="Add qualifications from an individual staff member's profile page." icon={Award} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
};

export default QualificationDetailsPage;
