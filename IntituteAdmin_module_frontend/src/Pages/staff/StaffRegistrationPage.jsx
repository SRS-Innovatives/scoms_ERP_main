import React, { useState, useEffect } from 'react';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import { useNotification } from '../../context/NotificationContext';
import { User, Briefcase, Award, Save, CheckCircle, IdCard } from 'lucide-react';
import apiCall from '../../services/api';
import customFieldService from '../../services/customFieldService';
import { useNavigate } from 'react-router-dom';

export const StaffRegistrationPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    staffType: 'TEACHING',
    role: 'TEACHER',
    departmentId: '',
    email: '',
    phone: '',
    designation: '',
    qualification: '',
    experience: '',
    joiningDate: ''
  });
  const [customFields, setCustomFields] = useState({});
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const setCustomField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCustomFields((prev) => ({ ...prev, [key]: value }));
  };

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
    customFieldService.getApproved('STAFF_PROFILE').then((res) => setCustomFieldDefs(res.data || [])).catch(() => {});
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await apiCall('/setup/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        name: formData.firstName + ' ' + formData.lastName, // Only if backend still expects name or for UI fallback
        customFields,
      };
      const res = await apiCall('/staff', {
        method: 'POST',
        body: payload
      });
      notifySuccess(
        `Employee Code ${res.data.employeeCode} was auto-assigned. Login password: Password@123 (a welcome email is also sent, but share this directly if your institution's email isn't configured yet — ask them to change it after first login).`,
        'Staff Registered'
      );
      navigate('/admin/staff/list');
    } catch (err) {
      notifyError(`Failed to register staff: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Registration Form</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Onboard Teaching Faculty & Non-Teaching Administrative Staff — an Employee Code is generated automatically on save.</p>
      </div>

      <FormSection title="1. Employee Personal Details" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sathishkumar"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
            <input
              type="text"
              placeholder="e.g. P"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Staff Cadre Type *</label>
            <select
              value={formData.staffType}
              onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            >
              <option value="TEACHING">Teaching Faculty</option>
              <option value="NON_TEACHING">Non-Teaching Staff</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation *</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Professor"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
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
        </div>
        <p className="text-[11px] text-slate-400">Salary structure can be configured after registration under Salary Structure & Payroll Matrix.</p>
        <FileUpload label="Upload Faculty Profile Picture" />
      </FormSection>

      {customFieldDefs.length > 0 && (
        <FormSection title="3. Additional Information" subtitle="Extra fields your institution added, approved by SCOMS" icon={IdCard}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {customFieldDefs.map((f) => (
              f.fieldType === 'SELECT' ? (
                <div key={f.fieldKey}>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}{f.required && ' *'}</label>
                  <select required={f.required} value={customFields[f.fieldKey] || ''} onChange={setCustomField(f.fieldKey)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium">
                    <option value="">Select...</option>
                    {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : f.fieldType === 'TEXTAREA' ? (
                <div key={f.fieldKey} className="md:col-span-3">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}{f.required && ' *'}</label>
                  <textarea required={f.required} rows={2} value={customFields[f.fieldKey] || ''} onChange={setCustomField(f.fieldKey)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium" />
                </div>
              ) : f.fieldType === 'CHECKBOX' ? (
                <label key={f.fieldKey} className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 pt-6">
                  <input type="checkbox" checked={!!customFields[f.fieldKey]} onChange={setCustomField(f.fieldKey)} className="w-4 h-4 rounded text-indigo-600" />
                  {f.label}{f.required && ' *'}
                </label>
              ) : (
                <div key={f.fieldKey}>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}{f.required && ' *'}</label>
                  <input
                    required={f.required}
                    type={{ NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel' }[f.fieldType] || 'text'}
                    value={customFields[f.fieldKey] || ''}
                    onChange={setCustomField(f.fieldKey)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium"
                  />
                </div>
              )
            ))}
          </div>
        </FormSection>
      )}

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
