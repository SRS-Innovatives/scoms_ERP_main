import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { transportRoutes } from '../../data/mockData';

export const VehicleAttendancePage = () => {
  const columns = [
    { header: 'Bus Number', key: 'busNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Route', key: 'routeName' },
    { header: 'Morning Arrival Time', key: 'id', render: () => <span className="font-mono">08:20 AM (On Time)</span> },
    { header: 'Evening Departure Time', key: 'id', render: () => <span className="font-mono">04:40 PM</span> },
    { header: 'Trip Status', key: 'id', render: () => <StatusBadge status="Completed" text="MORNING TRIP COMPLETE" /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bus Trip & Boarding Attendance</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">RFID bus boarding tap logs for student safety</p>
      </div>

      <DataTable columns={columns} data={transportRoutes} />
    </div>
  );
};

export default VehicleAttendancePage;
