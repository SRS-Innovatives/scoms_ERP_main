import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import affiliationService from '../../services/affiliationService';
import { Building2, Loader2 } from 'lucide-react';

const TYPE_LABELS = { COLLEGE: 'College', AUTONOMOUS_COLLEGE: 'Autonomous College' };

/** A University's real, structural view of the Colleges affiliated to it — populated from
 * the actual affiliatedUniversityId link set at onboarding, not a text label. Only makes
 * sense for a UNIVERSITY-type institution; anyone else sees why this page doesn't apply. */
export const AffiliatedCollegesPage = () => {
  const { notifyError } = useNotification();
  const { institution } = useInstitution();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notApplicable, setNotApplicable] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setNotApplicable(false);
    affiliationService.getAffiliatedColleges()
      .then((res) => setColleges(res.data || []))
      .catch((err) => {
        if (err.message?.includes('Only a University')) setNotApplicable(true);
        else notifyError(`Failed to load affiliated colleges: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const columns = [
    { header: 'Institution', key: 'name', render: (val, row) => (
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{val}</p>
        <p className="text-[10px] text-slate-400 font-mono">{row.code}</p>
      </div>
    ) },
    { header: 'Type', key: 'type', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">{TYPE_LABELS[val] || val}</span> },
    { header: 'Location', key: 'city', render: (val, row) => [val, row.state].filter(Boolean).join(', ') || '—' },
    { header: 'Students', key: '_count', sortable: false, render: (val) => val?.students ?? 0 },
    { header: 'Staff', key: '_countStaff', sortable: false, render: (_, row) => row._count?.staff ?? 0 },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val === 'ACTIVE' ? 'Active' : val} size="sm" /> },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (notApplicable) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <Building2 className="w-8 h-8 text-slate-300" />
        Affiliated Colleges only applies to a University-type institution.
        {institution?.type && <p className="mt-1">This institution is registered as <b>{TYPE_LABELS[institution.type] || institution.type}</b>.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Affiliated Colleges</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Colleges and Autonomous Colleges that named this university as their affiliation, real institutions onboarded in SCOMS</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
          {colleges.length} Affiliated
        </span>
      </div>

      {colleges.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
          No colleges have named this university as their affiliation yet — that link is set by the Super Admin when a College or Autonomous College is onboarded.
        </div>
      ) : (
        <DataTable columns={columns} data={colleges} loading={loading} />
      )}
    </div>
  );
};

export default AffiliatedCollegesPage;
