import React, { useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import FormInput from '../../components/common/FormInput';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { User, Phone, GraduationCap, Users, ShieldCheck, Camera, Save } from 'lucide-react';

export const MyProfilePage = () => {
  const { student, setStudent } = useStudentAuth();
  const { success } = useNotification();
  const [activeTab, setActiveTab] = useState('Personal');

  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    address: student?.address || '',
    city: student?.city || '',
    district: student?.district || '',
    state: student?.state || '',
    pincode: student?.pincode || '',
    fatherName: student?.fatherName || '',
    motherName: student?.motherName || '',
    parentPhone: student?.parentPhone || ''
  });

  const handleSave = (e) => {
    e.preventDefault();
    setStudent({ ...student, ...formData });
    success('Student profile details updated cleanly.', 'Profile Saved');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Summary */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <img src={student?.photo} alt={student?.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-500 shadow-md" />
          <button
            onClick={() => success('Photo upload dialog triggered.', 'Update Photo')}
            className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{student?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {student?.admissionNo}
            </span>
          </div>
          <p className="text-xs text-slate-500">{student?.course} • {student?.department} ({student?.semester})</p>
          <p className="text-xs text-slate-500">{student?.institution}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {['Personal', 'Contact', 'Academic', 'Parent/Guardian'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab} Information
          </button>
        ))}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        {activeTab === 'Personal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Student Full Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
            <FormInput label="Admission Number (Read-Only)" value={student?.admissionNo} disabled />
            <FormInput label="Register Number (Read-Only)" value={student?.regNo} disabled />
            <FormInput label="Date of Birth" type="date" value={student?.dob} disabled />
            <FormInput label="Gender" value={student?.gender} disabled />
            <FormInput label="Blood Group" value={student?.bloodGroup} disabled />
          </div>
        )}

        {activeTab === 'Contact' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Email Address" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
            <FormInput label="Mobile Number" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            <FormInput label="City" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} />
            <FormInput label="State" value={formData.state} onChange={(v) => setFormData({ ...formData, state: v })} />
            <div className="sm:col-span-2">
              <FormInput label="Full Residence Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} />
            </div>
          </div>
        )}

        {activeTab === 'Academic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Institution" value={student?.institution} disabled />
            <FormInput label="Department" value={student?.department} disabled />
            <FormInput label="Course" value={student?.course} disabled />
            <FormInput label="Current Semester" value={student?.semester} disabled />
            <FormInput label="Section & Roll No" value={`Sec ${student?.section} (Roll ${student?.rollNo})`} disabled />
            <FormInput label="Class Teacher" value={student?.classTeacher} disabled />
          </div>
        )}

        {activeTab === 'Parent/Guardian' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Father's Name" value={formData.fatherName} onChange={(v) => setFormData({ ...formData, fatherName: v })} />
            <FormInput label="Mother's Name" value={formData.motherName} onChange={(v) => setFormData({ ...formData, motherName: v })} />
            <FormInput label="Parent Mobile Contact" value={formData.parentPhone} onChange={(v) => setFormData({ ...formData, parentPhone: v })} />
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">
            <Save className="w-4 h-4" /> Save Profile Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyProfilePage;
