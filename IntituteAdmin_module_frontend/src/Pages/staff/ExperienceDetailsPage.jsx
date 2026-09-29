import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Briefcase, Loader2 } from 'lucide-react';
import staffService from '../../services/staffService';
import ErrorState from '../../components/common/ErrorState';

const durationLabel = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const years = ((end - new Date(from)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  return `${years} Years`;
};

export const ExperienceDetailsPage = () => {
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
          (s.experiences || []).map((ex) => ({ ...ex, staffName: `${s.firstName} ${s.lastName}`, empId: s.employeeCode }))
        );
        setRows(flattened);
      })
      .catch((err) => { notifyError(`Failed to load experience records: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Faculty Name', key: 'staffName', render: (val, row) => <span className="font-bold text-slate-900 dark:text-white">{val} <span className="font-mono text-[10px] text-slate-400">({row.empId})</span></span> },
    { header: 'Institution / Company', key: 'organization', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Role Held', key: 'roleTitle', render: (val) => <span className="font-semibold text-indigo-600">{val}</span> },
    { header: 'Service Period', key: 'fromDate', sortable: false, render: (_, row) => <span className="font-mono">{new Date(row.fromDate).toLocaleDateString('en-IN')} – {row.toDate ? new Date(row.toDate).toLocaleDateString('en-IN') : 'Present'}</span> },
    { header: 'Duration', key: 'toDate', sortable: false, render: (_, row) => <span className="font-mono font-bold">{durationLabel(row.fromDate, row.toDate)}</span> },
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Experience & Service History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Prior teaching, industrial & research experience records — add via each staff member's profile</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No Experience Records" description="Add experience records from an individual staff member's profile page." icon={Briefcase} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
};

export default ExperienceDetailsPage;
