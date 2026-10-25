import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Briefcase, Plus, XCircle, Users, CheckCircle2, X } from 'lucide-react';
import jobPostingService from '../../services/jobPostingService';

const emptyForm = { title: '', company: '', type: 'INTERNSHIP', location: '', compensation: '', description: '', eligibility: '', applicationDeadline: '' };

const APP_STATUS_STYLES = {
  APPLIED: 'bg-slate-100 text-slate-700',
  SHORTLISTED: 'bg-amber-100 text-amber-800',
  SELECTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

export const PlacementPostingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [viewing, setViewing] = useState(null); // { posting, applications }
  const [actingAppId, setActingAppId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobPostingService.getAll();
      setPostings(res.data || []);
    } catch (error) {
      notifyError(`Failed to load postings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await jobPostingService.create(form);
      notifySuccess(`Posting "${form.title}" published!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to publish posting: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id, title) => {
    try {
      await jobPostingService.close(id);
      notifySuccess(`"${title}" marked as closed.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to close posting: ${error.message}`);
    }
  };

  const openApplications = async (posting) => {
    try {
      const res = await jobPostingService.getApplications(posting.id);
      setViewing(res.data);
    } catch (error) {
      notifyError(`Failed to load applications: ${error.message}`);
    }
  };

  const handleAppDecision = async (applicationId, status) => {
    setActingAppId(applicationId);
    try {
      await jobPostingService.updateApplicationStatus(applicationId, status);
      notifySuccess(`Application ${status.toLowerCase()}.`);
      const res = await jobPostingService.getApplications(viewing.posting.id);
      setViewing(res.data);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update application: ${error.message}`);
    } finally {
      setActingAppId(null);
    }
  };

  const columns = [
    { header: 'Title', key: 'title', render: (val) => <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-600" />{val}</span> },
    { header: 'Company', key: 'company' },
    { header: 'Type', key: 'type', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'PLACEMENT' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'}`}>{val}</span> },
    { header: 'Applications', key: '_count', sortable: false, render: (val) => <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300"><Users className="w-3.5 h-3.5" /> {val?.applications ?? 0}</span> },
    { header: 'Status', key: 'status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{val}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openApplications(row)} className="text-xs font-semibold text-indigo-600 hover:underline">View Applications</button>
          {row.status === 'OPEN' && (
            <button onClick={() => handleClose(id, row.title)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950" title="Close posting">
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Placement Cell — Job Postings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Publish internship and placement openings for students to apply to.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>New Posting</span>
        </button>
      </div>

      {!loading && postings.length === 0 ? (
        <EmptyState title="No Postings Yet" description="Publish your institution's first internship or placement opening." actionLabel="New Posting" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={postings} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Publish Job Posting"
        subtitle="Visible to students, who can apply directly from their portal"
        icon={Briefcase}
        submitLabel="Publish"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'title', label: 'Job Title', required: true },
          { name: 'company', label: 'Company', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'INTERNSHIP', label: 'Internship' }, { value: 'PLACEMENT', label: 'Placement' }] },
          { name: 'location', label: 'Location' },
          { name: 'compensation', label: 'Stipend / Salary', placeholder: 'e.g. ₹18,000 / month' },
          { name: 'applicationDeadline', label: 'Application Deadline', type: 'date' },
          { name: 'eligibility', label: 'Eligibility Criteria', span: 'full' },
          { name: 'description', label: 'Job Description', type: 'textarea', span: 'full' },
        ]}
      />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Applications: {viewing.posting?.title}</h3>
              <button type="button" onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewing.applications?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No applications received yet.</p>
            ) : (
              <div className="space-y-2">
                {viewing.applications?.map((app) => (
                  <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{app.student?.firstName} {app.student?.lastName} <span className="text-slate-400 font-normal">#{app.student?.rollNumber}</span></p>
                      <p className="text-slate-500">{app.student?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${APP_STATUS_STYLES[app.status]}`}>{app.status}</span>
                      {app.status === 'APPLIED' && (
                        <>
                          <button onClick={() => handleAppDecision(app.id, 'SHORTLISTED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50">Shortlist</button>
                          <button onClick={() => handleAppDecision(app.id, 'REJECTED')} disabled={actingAppId === app.id} className="px-2 py-1 text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {app.status === 'SHORTLISTED' && (
                        <button onClick={() => handleAppDecision(app.id, 'SELECTED')} disabled={actingAppId === app.id} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                          <CheckCircle2 className="w-3 h-3" /> Select
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementPostingsPage;
