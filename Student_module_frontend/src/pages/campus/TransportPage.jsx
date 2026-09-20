import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Bus, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import campusService from '../../services/campusService';
import ErrorState from '../../components/common/ErrorState';

export const TransportPage = () => {
  const { error: showError } = useNotification();
  const [mapping, setMapping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    campusService.getMyTransport()
      .then((res) => setMapping(res.data))
      .catch((err) => { showError(err.message || 'Failed to load transport assignment', 'Load Failed'); setError(true); })
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
      <PageHeader title="College Transport & Bus Pass" subtitle="Your assigned route, boarding stop, and vehicle details." />

      {!mapping ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 max-w-2xl">
          You are not currently assigned to a transport route. Contact your Institute Admin to opt in.
        </div>
      ) : (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{mapping.route?.routeName}</h3>
                <p className="text-xs text-slate-500">{mapping.route?.startPoint} → {mapping.route?.endPoint}</p>
                {mapping.route?.vehicle && <p className="text-xs text-slate-500">Vehicle No: {mapping.route.vehicle.vehicleNumber}</p>}
              </div>
            </div>
            <StatusBadge status="Active Pass" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <p className="text-slate-400 uppercase text-[10px]">Assigned Boarding Stop</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{mapping.pickupPoint}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px]">Driver Contact</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{mapping.route?.vehicle?.driverName || '—'} {mapping.route?.vehicle?.driverPhone ? `(${mapping.route.vehicle.driverPhone})` : ''}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase text-[10px]">Monthly Fee</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">₹{mapping.route?.monthlyFare?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportPage;
