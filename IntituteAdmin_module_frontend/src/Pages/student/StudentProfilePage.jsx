import React from 'react';
import { studentsList } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import { CreditCard, FileText, Phone, Mail, MapPin, Award, ShieldCheck, Bus, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentProfilePage = () => {
  const navigate = useNavigate();
  const student = studentsList[0]; // Kavitha R. Sharma

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs glass-card">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={student.photo}
            alt={student.name}
            className="w-28 h-28 rounded-2xl object-cover border-4 border-indigo-100 dark:border-slate-800 shadow-md shrink-0"
          />

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h1>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Roll: {student.rollNo} | Register No: {student.regNo}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={student.status} />
                <StatusBadge status={student.feeStatus} text={`Fees: ${student.feeStatus}`} />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {student.course} ({student.yearSem} - Sec {student.section})
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-indigo-500" /> {student.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> {student.email}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {student.address}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate('/admin/fee/collect')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Collect Fees
            </button>
            <button
              onClick={() => navigate('/admin/student/id-card')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              View ID Card
            </button>
          </div>
        </div>
      </div>

      {/* Grid Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Personal & Category Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal & Statutory Info
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold">{student.dob}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Blood Group:</span> <span className="font-semibold">{student.bloodGroup}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Aadhaar Card No:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.aadhaarNo}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Community / Caste:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{student.casteCommunity}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Scholarship Scheme:</span> <span className="font-bold text-emerald-700 dark:text-emerald-400">{student.scholarship}</span></div>
          </div>
        </div>

        {/* Parent & Guardian Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Parent & Emergency Contact
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Father's Name:</span> <span className="font-semibold">{student.fatherName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Occupation:</span> <span className="font-semibold">{student.fatherOcc}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Mother's Name:</span> <span className="font-semibold">{student.motherName}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Parent Mobile (SMS):</span> <span className="font-mono font-bold text-indigo-600">{student.parentPhone}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Bus / Hostel:</span> <span className="font-semibold">{student.transport} / {student.hostel}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
