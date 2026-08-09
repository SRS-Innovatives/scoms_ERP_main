import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { User, Briefcase, Award, Save, CheckCircle } from 'lucide-react';

export const StaffRegistrationPage = () => {
  const { notifySuccess } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Teaching',
    role: 'Assistant Professor',
    dept: 'Computer Science & Engineering',
    email: '',
    phone: '',
    qualification: 'M.E. (CSE)',
    experience: '5 Years',
    salary: '75000',
    doj: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    notifySuccess(`Faculty / Staff registered successfully! Emp ID: T-CSE-045 assigned.`, 'Staff Registered');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Registration Form</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Onboard Teaching Faculty & Non-Teaching Administrative Staff</p>
      </div>

      <FormSection title="1. Employee Personal Details" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. P. Sathishkumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Staff Cadre Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            >
              <option value="Teaching">Teaching Faculty</option>
              <option value="Non-Teaching">Non-Teaching Staff</option>
              <option value="Administrative">Administrative / Management</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation / Role *</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Professor"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <select
              value={formData.dept}
              onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Electronics & Communication Engg">Electronics & Communication Engg</option>
              <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Central Library">Central Library</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="name@srcet.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone *</label>
            <input
              type="text"
              required
              placeholder="+91 98400 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="2. Qualifications & Experience" icon={Award}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Highest Qualification</label>
            <input
              type="text"
              placeholder="e.g. Ph.D. (IIT M), M.E."
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Prior Experience</label>
            <input
              type="text"
              placeholder="e.g. 10 Years Teaching"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gross Salary (Monthly ₹)</label>
            <input
              type="text"
              placeholder="e.g. 95000"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono font-medium"
            />
          </div>
        </div>
        <FileUpload label="Upload Faculty Profile Picture" />
      </FormSection>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Register Staff Employee</span>
        </button>
      </div>
    </form>
  );
};

export default StaffRegistrationPage;
