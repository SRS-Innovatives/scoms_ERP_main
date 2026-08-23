import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Eye, Edit, ShieldAlert, CheckCircle, Trash2, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import institutionService from '../../services/institutionService';

export const InstitutionListPage = () => {
  const navigate = useNavigate();
  const { success, warning } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await institutionService.getInstitutions();
      if (res?.data) {
        setInstitutions(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch institutions", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      key: 'code',
      render: (val) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val}</span>
    },
    {
      header: 'Institution Name',
      key: 'name',
      render: (val, row) => (
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100">{val}</h4>
          <p className="text-[11px] text-slate-500">{row.city}, {row.state}</p>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'type',
      render: (val) => <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-xs">{val}</span>
    },
    {
      header: 'Affiliation',
      key: 'affiliation',
      render: (val) => val || 'N/A'
    },
    {
      header: 'Plan',
      key: 'planName',
      render: (val, row) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{row.planName || val || 'N/A'}</span>
    },
    {
      header: 'Students',
      key: 'studentsCount',
      render: (val, row) => <span className="font-bold text-slate-800 dark:text-slate-200">{(row._count?.students || 0).toLocaleString()}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/super-admin/institutions/${id}`)}
            title="View Institution Details"
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => warning(`Status update toggled for ${row.name}`, 'Institution Status')}
            title="Toggle Status"
            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Management"
        subtitle="Control and monitor all registered schools, colleges, and universities."
        actionLabel="Onboard New Institution"
        onAction={() => navigate('/super-admin/institutions/new')}
        badge={`${institutions.length} Registered`}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={institutions}
          searchPlaceholder="Search institution name, code, state, city..."
          filterOptions={[
            { value: 'School', label: 'Schools' },
            { value: 'College', label: 'Colleges' },
            { value: 'University', label: 'Universities' }
          ]}
          onExport={() => success('Exported institution master dataset to Excel.', 'Export Ready')}
        />
      )}
    </div>
  );
};

export default InstitutionListPage;
