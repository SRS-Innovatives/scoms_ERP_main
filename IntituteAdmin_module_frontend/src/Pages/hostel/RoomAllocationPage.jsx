import React from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

export const RoomAllocationPage = () => {
  const rooms = [
    { roomNo: 'Room 304', block: 'Kaveri Girls Hostel (3rd Floor)', type: '3-Sharing AC Room', occupant: 'Priyanka M. Sundaram (21AD015)', status: 'Occupied' },
    { roomNo: 'Room 112', block: 'Bhavani Boys Hostel (1st Floor)', type: '4-Sharing Non-AC Room', occupant: 'Vigneshwaran K. Pandian (23ME012)', status: 'Occupied' }
  ];

  const columns = [
    { header: 'Room Number', key: 'roomNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Hostel Block', key: 'block' },
    { header: 'Room Type', key: 'type', render: (val) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span> },
    { header: 'Primary Occupant', key: 'occupant', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Room Allocation Register</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Allocate 2-sharing, 3-sharing & 4-sharing AC/Non-AC rooms to resident students</p>
      </div>

      <DataTable columns={columns} data={rooms} />
    </div>
  );
};

export default RoomAllocationPage;
