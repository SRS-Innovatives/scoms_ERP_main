import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Briefcase, Plus, XCircle, Users, CheckCircle2, X, UserPlus } from 'lucide-react';
import recruitmentService from '../../services/recruitmentService';

const emptyOpeningForm = { title: '', department: '', employmentType: 'FULL_TIME', openings: '1', description: '', requirements: '' };
const emptyCandidateForm = { candidateName: '', email: '', phone: '', notes: '' };

const APP_STATUS_STYLES = {
  APPLIED: 'bg-slate-100 text-slate-700',
  SHORTLISTED: 'bg-amber-100 text-amber-800',
  INTERVIEW_SCHEDULED: 'bg-sky-100 text-sky-800',
  SELECTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  HIRED: 'bg-purple-100 text-purple-800',
};

export const RecruitmentPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyOpeningForm);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [viewing, setViewing] = useState(null);
  const [actingAppId, setActingAppId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recruitmentService.getOpenings();
      setOpenings(res.data || []);
    } catch (error) {
      notifyError(`Failed to load openings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recruitmentService.createOpening({ ...form, openings: Number(form.openings) });
      notifySuccess(`Opening "${form.title}" published!`);
      setModalOpen(false);
      setForm(emptyOpeningForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to publish opening: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id, title) => {
    try {
      await recruitmentService.closeOpening(id);
      notifySuccess(`"${title}" marked as closed.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to close opening: ${error.message}`);
    }
  };

  const openApplications = async (opening) => {
    try {
      const res = await recruitmentService.getApplications(opening.id);
      setViewing({ opening, applications: res.data || [] });
    } catch (error) {
      notifyError(`Failed to load applications: ${error.message}`);
    }
  };

  const refreshViewing = async () => {
    const res = await recruitmentService.getApplications(viewing.opening.id);
    setViewing((prev) => ({ ...prev, applications: res.data || [] }));
    fetchAll();
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recruitmentService.addApplication(viewing.opening.id, candidateForm);
      notifySuccess('Candidate application logged!');
      setCandidateModalOpen(false);
      setCandidateForm(emptyCandidateForm);
      refreshViewing();
    } catch (error) {
      notifyError(`Failed to log application: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppDecision = async (applicationId, status) => {
    if (status === 'INTERVIEW_SCHEDULED') {
      const date = window.prompt('Interview date/time (e.g. 2026-10-05T10:00):');
      if (!date) return;
      setActingAppId(applicationId);
      try {
        await recruitmentService.updateApplicationStatus(applicationId, { status, interviewDate: new Date(date).toISOString() });
        notifySuccess('Interview scheduled.');
        refreshViewing();
      } catch (error) {
        notifyError(`Failed to update application: ${error.message}`);
      } finally {
        setActingAppId(null);
      }
      return;
    }
    setActingAppId(applicationId);
    try {
      await recruitmentService.updateApplicationStatus(applicationId, { status });
      notifySuccess(`Application ${status.toLowerCase().replace('_', ' ')}.`);
      refreshViewing();
    } catch (error) {
      notifyError(`Failed to update application: ${error.message}`);
    } finally {
      setActingAppId(null);
    }
  };

  const columns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Department', key: 'department', render: (val) => val || '—' },
    { header: 'Type', key: 'employmentType', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">{val.replace('_', ' ')}</span> },
    { header: 'Openings', key: 'openings' },
    { header: 'Applications', key: '_count', sortable: false, render: (val) => <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"><Users className="w-3.5 h-3.5" /> {val?.applications ?? 0}</span> },
    { header: 'Status', key: 'status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{val}</span> },
    {
      header: 'Actions', key: 'id', sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openApplications(row)} className="text-xs font-semibold text-indigo-600 hover:underline">View Candidates</button>
          {row.status === 'OPEN' && (
            <button onClick={() => handleClose(id, row.title)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950" title="Close opening">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">HR Recruitment</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Post staff job openings and track candidates through to a hiring decision</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" /><span>New Opening</span>
        </button>
      </div>

      {!loading && openings.length === 0 ? (
        <EmptyState title="No Openings Yet" description="Publish your institution's first staff job opening." actionLabel="New Opening" onAction={() => setModalOpen(true)} icon={Briefcase} />
      ) : (
        <DataTable columns={columns} data={openings} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Publish Job Opening"
        icon={Briefcase}
        submitLabel="Publish"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Job Title', required: true },
          { name: 'department', label: 'Department' },
          { name: 'employmentType', label: 'Type', type: 'select', required: true, options: [{ value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' }, { value: 'CONTRACT', label: 'Contract' }] },
          { name: 'openings', label: 'Number of Openings', type: 'number' },
          { name: 'requirements', label: 'Requirements', span: 'full' },
          { name: 'description', label: 'Job Description', type: 'textarea', span: 'full' },
        ]}
      />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Candidates: {viewing.opening?.title}</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setCandidateModalOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"><UserPlus className="w-3.5 h-3.5" />Log Candidate</button>
                <button type="button" onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {viewing.applications?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No candidate applications logged yet.</p>
            ) : (
              <div className="space-y-2">
                {viewing.applications?.map((app) => (
                  <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{app.candidateName}</p>
                      <p className="text-slate-500">{app.email} · {app.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${APP_STATUS_STYLES[app.status]}`}>{app.status.replace('_', ' ')}</span>
                      {app.status === 'APPLIED' && (
                        <>
                          <button onClick={() => handleAppDecision(app.id, 'SHORTLISTED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50">Shortlist</button>
                          <button onClick={() => handleAppDecision(app.id, 'REJECTED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {app.status === 'SHORTLISTED' && (
                        <button onClick={() => handleAppDecision(app.id, 'INTERVIEW_SCHEDULED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50">Schedule Interview</button>
                      )}
                      {app.status === 'INTERVIEW_SCHEDULED' && (
                        <button onClick={() => handleAppDecision(app.id, 'SELECTED')} disabled={actingAppId === app.id} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" /> Select
                        </button>
                      )}
                      {app.status === 'SELECTED' && (
                        <button onClick={() => handleAppDecision(app.id, 'HIRED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50">Mark Hired</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FormModal
        isOpen={candidateModalOpen}
        title="Log Candidate Application"
        icon={UserPlus}
        subtitle="For a walk-in or emailed candidate — no public apply form yet"
        submitLabel="Log Candidate"
        isSubmitting={submitting}
        onClose={() => setCandidateModalOpen(false)}
        onSubmit={handleAddCandidate}
        values={candidateForm}
        onChange={(name, value) => setCandidateForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'candidateName', label: 'Candidate Name', required: true, span: 'full' },
          { name: 'email', label: 'Email', required: true },
          { name: 'phone', label: 'Phone', required: true },
          { name: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
        ]}
      />
    </div>
  );
};

export default RecruitmentPage;
