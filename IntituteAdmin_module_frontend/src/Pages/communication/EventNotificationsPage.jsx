import React from 'react';
import DataTable from '../../components/common/DataTable';
import { Calendar, Bell } from 'lucide-react';

export const EventNotificationsPage = () => {
  const events = [
    { title: 'INNOVISION 2025 Tech Symposium', date: '12-Sep-2025', venue: 'Main Auditorium', status: 'Upcoming' },
    { title: 'Annual Sports Meet & Athletic Championship', date: '25-Oct-2025', venue: 'College Sports Complex', status: 'Scheduled' }
  ];

  const columns = [
    { header: 'Event Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Event Date', key: 'date', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Venue', key: 'venue' },
    { header: 'Status', key: 'status', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">{val}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Campus Events Calendar & Reminders</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Technical symposiums, annual sports, cultural events & parent-teacher meetings</p>
      </div>

      <DataTable columns={columns} data={events} />
    </div>
  );
};

export default EventNotificationsPage;
