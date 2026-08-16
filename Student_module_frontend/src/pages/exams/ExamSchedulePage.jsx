import React from 'react';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockExams } from '../../data/mockStudentData';
import { Calendar, MapPin, Download } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ExamSchedulePage = () => {
  const { success } = useNotification();

  const columns = [
    { header: 'Subject Code', key: 'code', render: (v) => <span className="font-mono font-bold text-indigo-600">{v}</span> },
    { header: 'Subject Title', key: 'subject', render: (v) => <span className="font-bold text-slate-900 dark:text-slate-100">{v}</span> },
    { header: 'Exam Category', key: 'examName' },
    { header: 'Date', key: 'date', render: (v) => <span className="font-bold text-rose-600">{v}</span> },
    { header: 'Timings', key: 'time' },
    { header: 'Hall & Room', key: 'room' },
    { header: 'Seat No', key: 'seatNo', render: (v) => <span className="font-mono font-bold">{v}</span> },
    { header: 'Status', key: 'status', render: (v) => <StatusBadge status={v} size="sm" /> }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semester Examination Timetable"
        subtitle="Hall ticket details, seating allotment, and exam room instructions."
        actionLabel="Download Hall Ticket PDF"
        onAction={() => success('Hall ticket PDF generated cleanly.', 'Hall Ticket Downloaded')}
        actionIcon={Download}
      />

      <DataTable columns={columns} data={mockExams} />
    </div>
  );
};

export default ExamSchedulePage;
