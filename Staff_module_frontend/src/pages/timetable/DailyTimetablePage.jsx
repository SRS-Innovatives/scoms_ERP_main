import React from 'react';
import ScheduleTimeline from '../../components/common/ScheduleTimeline';
import { mockTodaySchedule } from '../../data/mockStaffData';

export const DailyTimetablePage = () => {
  return (
    <div className="space-y-6">
      <ScheduleTimeline schedules={mockTodaySchedule} />
    </div>
  );
};

export default DailyTimetablePage;
