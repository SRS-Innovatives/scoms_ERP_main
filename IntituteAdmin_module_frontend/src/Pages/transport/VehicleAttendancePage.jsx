import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { Loader2 } from 'lucide-react';
import transportService from '../../services/transportService';

export const VehicleAttendancePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);

  const fetchTrips = useCallback(() => {
    setLoading(true);
    transportService.getTrips(date)
      .then((res) => setTrips(res.data || []))
      .catch((err) => notifyError(`Failed to load trip log: ${err.message}`))
      .finally(() => setLoading(false));
  }, [date, notifyError]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleMarkComplete = async (vehicleId, session) => {
    setBusyKey(`${vehicleId}-${session}`);
    try {
      await transportService.markTripComplete({ vehicleId, session, date });
      notifySuccess(`${session === 'MORNING' ? 'Morning' : 'Evening'} trip marked complete.`);
      fetchTrips();
    } catch (error) {
      notifyError(`Failed to update trip status: ${error.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const tripCell = (row, session) => {
    const trip = row[session.toLowerCase()];
    const key = `${row.id}-${session}`;
    if (trip?.status === 'COMPLETED') {
      return <StatusBadge status="Completed" text={`${session} TRIP COMPLETE`} />;
    }
    return (
      <button onClick={() => handleMarkComplete(row.id, session)} disabled={busyKey === key} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
        {busyKey === key ? 'Marking...' : `Mark ${session === 'MORNING' ? 'Morning' : 'Evening'} Complete`}
      </button>
    );
  };

  const columns = [
    { header: 'Bus Number', key: 'vehicleNumber', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Route', key: 'routeName' },
    { header: 'Morning Trip', key: 'morning', sortable: false, render: (_, row) => tripCell(row, 'MORNING') },
    { header: 'Evening Trip', key: 'evening', sortable: false, render: (_, row) => tripCell(row, 'EVENING') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Trip & Boarding Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Daily morning/evening trip completion status per vehicle</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <DataTable columns={columns} data={trips} />
      )}
    </div>
  );
};

export default VehicleAttendancePage;
