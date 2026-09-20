import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import campusService from '../../services/campusService';
import ErrorState from '../../components/common/ErrorState';

export const HostelPage = () => {
  const { error: showError } = useNotification();
  const [bed, setBed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    campusService.getMyHostel()
      .then((res) => setBed(res.data))
      .catch((err) => { showError(err.message || 'Failed to load hostel allocation', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Hostel Room Allocation" subtitle="Your room, bed, warden contact, and mess fee." />

      {!bed ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl">
          You are not currently allocated a hostel bed. Contact your Institute Admin to request one.
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{bed.hostel?.name}</h3>
              <p className="text-xs text-slate-500">Room No. {bed.roomNumber} • Bed {bed.bedNumber}</p>
            </div>
            <StatusBadge status="Allotted" />
          </div>

          <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p><span className="text-slate-400">Type:</span> <span className="font-bold">{bed.hostel?.type}</span></p>
            {bed.hostel?.warden && <p><span className="text-slate-400">Warden:</span> <span className="font-bold">{bed.hostel.warden}</span></p>}
            {bed.hostel?.messType && <p><span className="text-slate-400">Mess:</span> <span className="font-bold">{bed.hostel.messType}</span></p>}
            <p><span className="text-slate-400">Monthly Fee:</span> <span className="font-bold">₹{bed.monthlyFee?.toLocaleString()}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelPage;
