import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import ErrorState from '../../components/common/ErrorState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Mail, Phone, Award, Briefcase, Plus, Loader2 } from 'lucide-react';
import staffService from '../../services/staffService';

const emptyQualForm = { degree: '', institutionName: '', yearOfPassing: '', grade: '' };
const emptyExpForm = { organization: '', roleTitle: '', fromDate: '', toDate: '', description: '' };

export const StaffProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notifySuccess, notifyError } = useNotification();
  const [allStaff, setAllStaff] = useState([]);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qualModalOpen, setQualModalOpen] = useState(false);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qualForm, setQualForm] = useState(emptyQualForm);
  const [expForm, setExpForm] = useState(emptyExpForm);

  const staffId = searchParams.get('id');

  useEffect(() => {
    staffService.getAll().then((res) => {
      setAllStaff(res.data || []);
      if (!staffId && (res.data || []).length > 0) setSearchParams({ id: res.data[0].id });
    }).catch((err) => notifyError(`Failed to load staff list: ${err.message}`));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = useCallback(() => {
    if (!staffId) return;
    setLoading(true);
    setError(false);
    staffService.getById(staffId)
      .then((res) => setStaff(res.data))
      .catch((err) => { notifyError(`Failed to load staff profile: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [staffId, notifyError]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAddQualification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffService.addQualification(staffId, qualForm);
      notifySuccess('Qualification added successfully!');
      setQualModalOpen(false);
      setQualForm(emptyQualForm);
      fetchProfile();
    } catch (error) {
      notifyError(`Failed to add qualification: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffService.addExperience(staffId, expForm);
      notifySuccess('Experience record added successfully!');
      setExpModalOpen(false);
      setExpForm(emptyExpForm);
      fetchProfile();
    } catch (error) {
      notifyError(`Failed to add experience: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchProfile} />;
  }

  if (!staff) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <select
        value={staffId || ''}
        onChange={(e) => setSearchParams({ id: e.target.value })}
        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
      >
        {allStaff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeCode})</option>)}
      </select>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs glass-card">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-28 h-28 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shrink-0">
            {staff.firstName?.[0]}{staff.lastName?.[0]}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{staff.firstName} {staff.lastName}</h1>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">Emp ID: {staff.employeeCode}</p>
              </div>
              <StatusBadge status={staff.status} />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{staff.designation} - {staff.department?.name || 'No Department'}</p>
            <p className="text-xs text-slate-500">{staff.qualification || 'No qualification on file'}</p>
            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {staff.user?.mobile || '—'}</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {staff.user?.email || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Award className="w-4 h-4 text-indigo-600" /> Qualifications</h3>
            <button onClick={() => setQualModalOpen(true)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
          {staff.qualifications?.length === 0 ? (
            <p className="text-xs text-slate-400">No qualifications on record.</p>
          ) : (
            <div className="space-y-2">
              {staff.qualifications?.map((q) => (
                <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{q.degree}</p>
                  <p className="text-slate-500">{q.institutionName} • {q.yearOfPassing}{q.grade ? ` • ${q.grade}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-600" /> Experience</h3>
            <button onClick={() => setExpModalOpen(true)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
          {staff.experiences?.length === 0 ? (
            <p className="text-xs text-slate-400">No prior experience on record.</p>
          ) : (
            <div className="space-y-2">
              {staff.experiences?.map((ex) => (
                <div key={ex.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{ex.organization} — {ex.roleTitle}</p>
                  <p className="text-slate-500">{new Date(ex.fromDate).toLocaleDateString('en-IN')} – {ex.toDate ? new Date(ex.toDate).toLocaleDateString('en-IN') : 'Present'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormModal
        isOpen={qualModalOpen}
        title="Add Qualification"
        icon={Award}
        submitLabel="Add"
        isSubmitting={submitting}
        onClose={() => setQualModalOpen(false)}
        onSubmit={handleAddQualification}
        values={qualForm}
        onChange={(name, value) => setQualForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'degree', label: 'Degree / Diploma', required: true, span: 'full' },
          { name: 'institutionName', label: 'University / Board', required: true, span: 'full' },
          { name: 'yearOfPassing', label: 'Year of Passing', type: 'number', required: true },
          { name: 'grade', label: 'Grade / Class' },
        ]}
      />

      <FormModal
        isOpen={expModalOpen}
        title="Add Experience"
        icon={Briefcase}
        submitLabel="Add"
        isSubmitting={submitting}
        onClose={() => setExpModalOpen(false)}
        onSubmit={handleAddExperience}
        values={expForm}
        onChange={(name, value) => setExpForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'organization', label: 'Institution / Company', required: true, span: 'full' },
          { name: 'roleTitle', label: 'Role Held', required: true, span: 'full' },
          { name: 'fromDate', label: 'From Date', type: 'date', required: true },
          { name: 'toDate', label: 'To Date (blank = current)', type: 'date' },
          { name: 'description', label: 'Description', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default StaffProfilePage;
