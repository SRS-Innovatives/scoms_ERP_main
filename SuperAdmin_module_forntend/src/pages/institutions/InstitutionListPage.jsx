import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { Eye, Edit, ShieldAlert, CheckCircle, Trash2, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import institutionService from '../../services/institutionService';

export const InstitutionListPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTarget, setStatusTarget] = useState(null); // { id, name, nextStatus }
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const openStatusConfirm = (row) => {
    const nextStatus = row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusTarget({ id: row.id, name: row.name, currentStatus: row.status, nextStatus });
  };

  const handleExport = () => {
    if (institutions.length === 0) {
      showError('No institutions to export.', 'Export Failed');
      return;
    }
    const headers = ['Code', 'Name', 'Type', 'City', 'State', 'Affiliation', 'Plan', 'Students', 'Status'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = institutions.map((i) => [
      i.code, i.name, i.type, i.city, i.state, i.affiliation || '', i.planName || '', i._count?.students || 0, i.status,
    ].map(escapeCsv).join(','));
    const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scoms-institutions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success(`Exported ${institutions.length} institution(s) to CSV.`, 'Export Complete');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    setUpdatingStatus(true);
    try {
      const res = await institutionService.updateInstitutionStatus(statusTarget.id, statusTarget.nextStatus);
      setInstitutions((prev) => prev.map((i) => (i.id === statusTarget.id ? { ...i, status: res.data.status } : i)));
      success(
        `${statusTarget.name} is now ${statusTarget.nextStatus === 'ACTIVE' ? 'Active' : 'Suspended'}.`,
        'Status Updated'
      );
      setStatusTarget(null);
    } catch (error) {
      showError(error.message || 'Failed to update institution status', 'Update Failed');
    } finally {
      setUpdatingStatus(false);
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
          {row.status === 'ACTIVE' ? (
            <button
              onClick={() => openStatusConfirm(row)}
              title="Suspend Institution"
              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => openStatusConfirm(row)}
              title="Activate Institution"
              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
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
          onExport={handleExport}
        />
      )}

      <ConfirmDialog
        isOpen={!!statusTarget}
        title={statusTarget?.nextStatus === 'ACTIVE' ? 'Activate Institution' : 'Suspend Institution'}
        message={
          statusTarget?.nextStatus === 'ACTIVE'
            ? `Reactivate "${statusTarget?.name}"? Its admin, staff, and students will regain access immediately.`
            : `Suspend "${statusTarget?.name}"? Its admin, staff, and students will immediately lose access to the portal.`
        }
        confirmText={updatingStatus ? 'Updating...' : statusTarget?.nextStatus === 'ACTIVE' ? 'Activate' : 'Suspend'}
        type={statusTarget?.nextStatus === 'ACTIVE' ? 'info' : 'warning'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default InstitutionListPage;
