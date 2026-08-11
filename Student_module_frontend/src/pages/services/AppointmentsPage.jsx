import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';

export const AppointmentsPage = () => {
  const { success } = useNotification();

  return (
    <div className="space-y-6">
      <PageHeader title="Counselling & Faculty Mentorship Appointments" subtitle="Schedule 1-on-1 career or mental health counselling slots." />

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs max-w-md">
        <h3 className="font-bold text-sm">Book Appointment with Class Teacher</h3>
        <p className="text-slate-500">Dr. Malathi S. (HOD CS) • Available Tue/Thu 03:30 PM - 04:30 PM</p>
        <button
          onClick={() => success('Appointment slot requested for Thursday 04:00 PM', 'Slot Requested')}
          className="w-full py-2.5 font-bold text-white bg-indigo-600 rounded-xl"
        >
          Book 15-Min Slot
        </button>
      </div>
    </div>
  );
};

export default AppointmentsPage;
