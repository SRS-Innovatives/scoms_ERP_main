import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { UserRound, Loader2 } from 'lucide-react';
import transportService from '../../services/transportService';

export const DriverManagementPage = () => {
  const { notifyError } = useNotification();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transportService.getVehicles()
      .then((res) => setVehicles((res.data || []).filter((v) => v.driverName)))
      .catch((err) => notifyError(`Failed to load driver directory: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const isExpired = (date) => date && new Date(date) < new Date();

  const columns = [
    { header: 'Driver Name & Phone', key: 'driverName', render: (val, row) => <span className="font-bold text-slate-900 dark:text-white">{val} <span className="font-mono text-slate-500 font-normal">({row.driverPhone || '—'})</span></span> },
    { header: 'License No', key: 'driverLicenseNumber', render: (val) => <span className="font-mono text-xs font-bold">{val || '—'}</span> },
    { header: 'License Expiry', key: 'licenseExpiryDate', render: (val) => val ? <span className={`font-mono ${isExpired(val) ? 'text-rose-600 font-bold' : ''}`}>{new Date(val).toLocaleDateString('en-IN')}</span> : '—' },
    { header: 'Assigned Bus', key: 'vehicleNumber', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Duty Status', key: 'id', sortable: false, render: () => <StatusBadge status="Active" text="On Route Duty" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Driver Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Driver license verification and vehicle assignment — add/edit drivers via Fleet & Vehicle Management</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : vehicles.length === 0 ? (
        <EmptyState title="No Drivers on Record" description="Add driver details when registering a vehicle under Fleet & Vehicle Management." icon={UserRound} />
      ) : (
        <DataTable columns={columns} data={vehicles} />
      )}
    </div>
  );
};

export default DriverManagementPage;
