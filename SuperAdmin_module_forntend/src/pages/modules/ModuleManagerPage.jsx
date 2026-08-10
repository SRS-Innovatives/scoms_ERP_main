import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { Layers, Check, X, Sliders } from 'lucide-react';

export const ModuleManagerPage = () => {
  const { success } = useNotification();

  const allModules = [
    { key: "student_mgmt", title: "Student Management", desc: "Enrollments, admissions, profiles, parent links", enabled: true },
    { key: "staff_mgmt", title: "Staff & HR Management", desc: "Teaching/non-teaching rosters, qualifications, biometric links", enabled: true },
    { key: "attendance_mgmt", title: "Attendance Engine", desc: "Daily class attendance, SMS alerts for absentees, monthly grid", enabled: true },
    { key: "fee_mgmt", title: "Fee & Challan Management", desc: "Fee structures, offline receipts, online Razorpay link", enabled: true },
    { key: "exam_mgmt", title: "Examinations & Marks", desc: "Exam schedules, hall tickets, mark sheets, grade sheets", enabled: true },
    { key: "question_bank", title: "Question Bank & Paper Gen", desc: "Bloom's taxonomy questions, automated question paper PDF assembly", enabled: true },
    { key: "assignment_mgmt", title: "Assignment & Homework", desc: "Homework submission, evaluation notes, file attachments", enabled: true },
    { key: "study_material", title: "Study Material Library", desc: "E-books, lecture PDFs, videos, download logs", enabled: true },
    { key: "library_mgmt", title: "Library Counter", desc: "Book issues, returns, student status, fine collection", enabled: true },
    { key: "hostel_mgmt", title: "Hostel Management", desc: "Room allotments, mess attendance, warden logs", enabled: true },
    { key: "transport_mgmt", title: "Transport & Bus Tracking", desc: "Bus routes, stops, vehicle tracking, driver info", enabled: true },
    { key: "payroll_mgmt", title: "Payroll & Salary Slips", desc: "Salary slips, Provident Fund, ESI, Tax calculations", enabled: true },
    { key: "ai_assistant", title: "AI Assistant & Paper Creator", desc: "GPT-4o & Gemini 1.5 automated question generator & doubt solver", enabled: true }
  ];

  const [modules, setModules] = useState(allModules);

  const toggleModule = (key) => {
    setModules(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
    success('Global module status updated!', 'Module Toggle');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SCOMS Platform Module Registry"
        subtitle="Enable or disable core modules globally or configure plan-based access controls."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div key={mod.key} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </span>
                <button
                  onClick={() => toggleModule(mod.key)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${
                    mod.enabled
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {mod.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{mod.enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{mod.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleManagerPage;
