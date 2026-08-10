import React from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import { mockStudentsList } from '../../data/mockStaffData';

export const EventAttendancePage = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Co-Curricular & Club Attendance Marker</h2>
      <AttendanceTable students={mockStudentsList} />
    </div>
  );
};

export default EventAttendancePage;
