import React, { useState } from 'react';
import AttendanceTable from '../../components/common/AttendanceTable';
import { mockStudentsList } from '../../data/mockStaffData';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Clock, BookOpen, Save, Send } from 'lucide-react';

export const TakeAttendancePage = () => {
  const { success } = useNotification();
  const [selectedDate, setSelectedDate] = useState('2026-08-11');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 3 (10:15 AM - 11:00 AM)');
  const [selectedClass, setSelectedClass] = useState('Class 12-A');
  const [selectedSubject, setSelectedSubject] = useState('Advanced Physics');

  const handleSaveAttendance = () => {
    success(`Attendance for ${selectedClass} (${selectedSubject}) recorded cleanly!`, 'Attendance Saved');
  };

  const handleSendSms = (count) => {
    success(`SMS notification triggered to parents of ${count} absent students.`, 'SMS Broadcast Sent');
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Controls */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          Mark Classroom Attendance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" /> Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Select Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            >
              <option value="Period 1 (08:30 AM - 09:15 AM)">Period 1 (08:30 AM - 09:15 AM)</option>
              <option value="Period 2 (09:20 AM - 10:05 AM)">Period 2 (09:20 AM - 10:05 AM)</option>
              <option value="Period 3 (10:15 AM - 11:00 AM)">Period 3 (10:15 AM - 11:00 AM)</option>
              <option value="Period 6-7 (01:00 PM - 02:30 PM)">Period 6-7 Lab (01:00 PM - 02:30 PM)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Class & Section</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            >
              <option value="Class 12-A">Class 12-A</option>
              <option value="Class 11-B">Class 11-B</option>
              <option value="Class 10-A">Class 10-A</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-200"
            >
              <option value="Advanced Physics">Advanced Physics</option>
              <option value="Physics Lab Practicals">Physics Lab Practicals</option>
              <option value="Electrostatics">Electrostatics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Interactive Table */}
      <AttendanceTable
        students={mockStudentsList}
        onSendSms={handleSendSms}
      />

      {/* Bottom Save Action Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ensure all student attendance toggles are verified before saving.
        </span>
        <button
          onClick={handleSaveAttendance}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
        >
          <Save className="w-4 h-4" /> Save Attendance Log
        </button>
      </div>
    </div>
  );
};

export default TakeAttendancePage;
