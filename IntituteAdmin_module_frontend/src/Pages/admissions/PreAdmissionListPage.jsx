import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import SMSComposeModal from '../../components/modals/SMSComposeModal';
import { useNotification } from '../../context/NotificationContext';
import preAdmissionService from '../../services/preAdmissionService';
import apiCall from '../../services/api';
import {
  UserPlus, MessageSquare, Eye, Receipt, CheckCircle2, GraduationCap,
  Trash2, X, Loader2, FileText, FileCheck,
} from 'lucide-react';

const emptyForm = {
  studentFirstName: '', studentLastName: '', dob: '', gender: 'MALE', classAppliedFor: '', courseApplied: '',
  academicYear: '', parentName: '', parentPhone: '', parentEmail: '', address: '', city: '', state: '', pincode: '',
  previousSchool: '', previousClass: '', referenceNumber: '',
};

const STATUSES = ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'DOCUMENTS_VERIFIED', 'ENROLLED', 'REJECTED', 'CONVERTED'];

const DEFAULT_DOCUMENTS = ['Birth Certificate', 'Transfer Certificate', 'Previous Mark Sheet', 'Aadhaar Card', 'Passport Photo', 'Community Certificate'];

const STATUS_STYLES = {
  NEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  UNDER_REVIEW: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  SHORTLISTED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  DOCUMENTS_VERIFIED: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  ENROLLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  CONVERTED: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

/** The Admit modal — converts an accepted applicant into a real Student, reusing the
 * same department → course → semester → section cascade the main admission form uses. */
const AdmitModal = ({ isOpen, application, onClose, onAdmitted }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const emptyAdmitForm = { email: '', departmentId: '', courseId: '', semesterId: '', sectionId: '', rollNumber: '', assignFees: true, autoRollNumber: true, sendCredentials: true };
  const [form, setForm] = useState(emptyAdmitForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyAdmitForm);
    apiCall('/setup/departments').then((res) => setDepartments(res.data || [])).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!form.departmentId) { setCourses([]); return; }
    apiCall('/setup/courses').then((res) => setCourses((res.data || []).filter((c) => c.departmentId === form.departmentId))).catch(() => {});
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.courseId) { setSemesters([]); return; }
    apiCall(`/setup/semesters?courseId=${form.courseId}`).then((res) => setSemesters(res.data || [])).catch(() => {});
  }, [form.courseId]);

  useEffect(() => {
    if (!form.semesterId) { setSections([]); return; }
    apiCall(`/setup/sections?semesterId=${form.semesterId}`).then((res) => setSections(res.data || [])).catch(() => {});
  }, [form.semesterId]);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.sectionId) return;
    setSubmitting(true);
    try {
      const res = await preAdmissionService.admit(application.id, {
        email: form.email,
        departmentId: form.departmentId || undefined,
        courseId: form.courseId || undefined,
        semesterId: form.semesterId || undefined,
        sectionId: form.sectionId,
        rollNumber: form.rollNumber || undefined,
        assignFees: form.assignFees,
        autoRollNumber: form.autoRollNumber,
        sendCredentials: form.sendCredentials,
      });
      const p = res.data.provisioning || {};
      const extras = [
        p.rollNumber && `roll no. ${p.rollNumber}`,
        form.assignFees && `${(p.feesAssigned || []).length} fee structure(s) assigned`,
        p.credentialsSent && 'login credentials sent',
      ].filter(Boolean).join(', ');
      notifySuccess(`${application.studentFirstName} admitted as ${res.data.student.admissionNumber}${extras ? ` — ${extras}` : ''}`);
      onAdmitted();
      onClose();
    } catch (err) {
      notifyError(`Admission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Admit {application.studentFirstName} {application.studentLastName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Creates a real student login, roll number and parent account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Email (for login) *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" placeholder="student@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select value={form.departmentId} onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value, courseId: '', semesterId: '', sectionId: '' }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium">
                <option value="">Select...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course</label>
              <select disabled={!form.departmentId} value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value, semesterId: '', sectionId: '' }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50">
                <option value="">Select...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select disabled={!form.courseId} value={form.semesterId} onChange={(e) => setForm((p) => ({ ...p, semesterId: e.target.value, sectionId: '' }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50">
                <option value="">Select...</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Section *</label>
              <select required disabled={!form.semesterId} value={form.sectionId} onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium disabled:opacity-50">
                <option value="">Select...</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll Number (optional)</label>
            <input value={form.rollNumber} onChange={(e) => setForm((p) => ({ ...p, rollNumber: e.target.value }))}
              placeholder={form.autoRollNumber ? 'Leave blank to auto-assign the next number' : ''}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium" />
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {[
              ['autoRollNumber', 'Auto-assign the next roll number in this section'],
              ['assignFees', 'Assign matching published fee structures (current academic year)'],
              ['sendCredentials', 'Email / SMS login credentials to the student'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} className="accent-emerald-600" />
                {label}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              <span>{submitting ? 'Admitting...' : 'Confirm Admission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Read-only detail view of one application. */
const ViewModal = ({ isOpen, application, onClose }) => {
  if (!isOpen || !application) return null;
  const rows = [
    ['Application No.', application.applicationNumber], ['Reference No.', application.referenceNumber || '—'],
    ['Student Name', `${application.studentFirstName} ${application.studentLastName || ''}`],
    ['Date of Birth', application.dob ? new Date(application.dob).toLocaleDateString() : '—'], ['Gender', application.gender || '—'],
    ['Class Applied For', application.classAppliedFor || '—'], ['Course Applied', application.courseApplied || '—'], ['Academic Year', application.academicYear || '—'],
    ['Parent Name', application.parentName || '—'], ['Parent Phone', application.parentPhone], ['Parent Email', application.parentEmail || '—'],
    ['Address', [application.address, application.city, application.state, application.pincode].filter(Boolean).join(', ') || '—'],
    ['Previous School', application.previousSchool || '—'], ['Previous Class', application.previousClass || '—'],
    ['Source', application.source], ['Submitted', new Date(application.createdAt).toLocaleString()],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"><FileText className="w-5 h-5" /></div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Application Details</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          {rows.map(([label, val]) => (
            <div key={label}>
              <dt className="text-slate-400 font-medium">{label}</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-semibold">{val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export const PreAdmissionListPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [admitApp, setAdmitApp] = useState(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [docsApp, setDocsApp] = useState(null);
  const [docsForm, setDocsForm] = useState({});
  const [savingDocs, setSavingDocs] = useState(false);

  const docNames = docsApp
    ? [...new Set([...DEFAULT_DOCUMENTS, ...((docsApp.documentChecklist || []).map((d) => d.name))])]
    : [];

  const openDocs = (row) => {
    const verified = Object.fromEntries((row.documentChecklist || []).map((d) => [d.name, d.verified]));
    setDocsForm({ ...Object.fromEntries(DEFAULT_DOCUMENTS.map((n) => [n, false])), ...verified, reviewNotes: row.reviewNotes || '' });
    setDocsApp(row);
  };

  const handleSaveDocs = async (e) => {
    e.preventDefault();
    setSavingDocs(true);
    try {
      const res = await preAdmissionService.verifyDocuments(docsApp.id, {
        checklist: docNames.map((name) => ({ name, verified: Boolean(docsForm[name]) })),
        reviewNotes: docsForm.reviewNotes,
      });
      notifySuccess(res.data.documentsVerifiedAt ? 'All documents verified' : 'Document checklist saved');
      setDocsApp(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to save documents: ${error.message}`);
    } finally {
      setSavingDocs(false);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await preAdmissionService.getAll(statusFilter ? { status: statusFilter } : {});
      setApplications(res.data || []);
    } catch (error) {
      notifyError(`Failed to load applications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await preAdmissionService.create(form);
      notifySuccess(`Application for ${form.studentFirstName} logged successfully!`);
      setAddModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to log application: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (row, status) => {
    try {
      await preAdmissionService.updateStatus(row.id, { status });
      notifySuccess(`Marked as ${status.replace('_', ' ')}`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update: ${error.message}`);
    }
  };

  const handleReceipt = async (row) => {
    try {
      const res = await preAdmissionService.generateReceipt(row.id);
      notifySuccess(`Receipt ${res.data.receiptNumber} generated`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to generate receipt: ${error.message}`);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete the application for ${row.studentFirstName}? This cannot be undone.`)) return;
    try {
      await preAdmissionService.remove(row.id);
      notifySuccess('Application deleted');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to delete: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Receipt No.', key: 'receiptNumber', render: (val) => val ? <span className="font-mono text-[11px] text-slate-500">{val}</span> : <span className="text-slate-300">—</span> },
    { header: 'Application No.', key: 'applicationNumber', render: (val) => <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{val}</span> },
    { header: 'Reference No.', key: 'referenceNumber', render: (val) => val || <span className="text-slate-300">—</span> },
    {
      header: 'Student', key: 'studentFirstName',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{val} {row.studentLastName}</p>
          {row.classAppliedFor && <p className="text-[10px] text-slate-400">Class {row.classAppliedFor}{row.courseApplied ? ` · ${row.courseApplied}` : ''}</p>}
        </div>
      ),
    },
    { header: 'Date', key: 'createdAt', render: (val) => new Date(val).toLocaleDateString() },
    {
      header: 'App. Fee', key: 'feeAmount', sortable: false,
      render: (val, row) => !val ? (
        <span className="text-[10px] text-slate-300">—</span>
      ) : row.feePaid ? (
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Paid ₹{val}</span>
      ) : (
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">Unpaid ₹{val}</span>
      ),
    },
    {
      header: 'Application', key: 'view', sortable: false,
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setViewApp(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" title="View Application">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: 'Enroll', key: 'enroll', sortable: false,
      render: (_, row) => row.status === 'ENROLLED' || row.status === 'CONVERTED' ? (
        <span className="text-emerald-500"><CheckCircle2 className="w-4 h-4" /></span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusChange(row, 'ENROLLED'); }}
          disabled={row.status === 'REJECTED'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mark Enrolled"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: 'Documents', key: 'documents', sortable: false,
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openDocs(row); }}
          disabled={row.status === 'CONVERTED' || row.status === 'REJECTED'}
          className={`p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/50 disabled:opacity-30 disabled:cursor-not-allowed ${row.documentsVerifiedAt ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
          title={row.documentsVerifiedAt ? 'Documents verified' : 'Verify Documents'}
        >
          <FileCheck className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: 'Receipt', key: 'receipt', sortable: false,
      render: (_, row) => row.receiptNumber ? (
        <span className="text-slate-300 dark:text-slate-600"><Receipt className="w-4 h-4" /></span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); handleReceipt(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50" title="Generate Receipt">
          <Receipt className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: 'Admission', key: 'admit', sortable: false,
      render: (_, row) => row.status === 'CONVERTED' ? (
        <span className="text-violet-500" title="Already admitted"><GraduationCap className="w-4 h-4" /></span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setAdmitApp(row); }}
          disabled={row.status === 'REJECTED'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Admit as Student"
        >
          <GraduationCap className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: 'Status', key: 'status', sortable: false,
      render: (val, row) => row.status === 'CONVERTED' ? (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLES.CONVERTED}`}>ADMITTED</span>
      ) : (
        <select
          value={val}
          onChange={(e) => handleStatusChange(row, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 ${STATUS_STYLES[val] || STATUS_STYLES.NEW}`}
        >
          {STATUSES.filter((s) => s !== 'CONVERTED').map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      ),
    },
    {
      header: 'Actions', key: 'actions', sortable: false,
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          disabled={row.status === 'CONVERTED'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const filtered = applications.filter((a) =>
    `${a.studentFirstName} ${a.studentLastName || ''}`.toLowerCase().includes(search.toLowerCase())
    || a.applicationNumber?.toLowerCase().includes(search.toLowerCase())
    || a.parentPhone?.includes(search)
  );

  // Reference-UI convention: rows already enrolled/admitted get a soft green tint.
  const rowClassName = (row) => (row.status === 'ENROLLED' || row.status === 'CONVERTED') ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pre-Admission Applications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Website form submissions and manually logged applications, ready for review and admission
          </p>
        </div>
        <button
          onClick={() => setSmsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Send SMS Alerts
        </button>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by student name, application no. or phone..."
        filters={[{ key: 'status', label: 'Status', value: statusFilter, options: STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })) }]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        addLabel="Add New"
        onAddClick={() => setAddModalOpen(true)}
        onRefreshClick={fetchAll}
      />

      <p className="text-[11px] text-slate-400 -mt-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 inline-block" />
        Green row indicates the applicant is already enrolled or admitted
      </p>

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Applications Yet" description="Applications submitted through your website's admission form, or logged manually, will appear here." actionLabel="Add New" onAction={() => setAddModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} rowClassName={rowClassName} />
      )}

      <FormModal
        isOpen={addModalOpen}
        title="Log New Application"
        subtitle="For a walk-in or phone applicant — website submissions arrive here automatically"
        icon={UserPlus}
        submitLabel="Log Application"
        isSubmitting={submitting}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'studentFirstName', label: 'Student First Name', required: true },
          { name: 'studentLastName', label: 'Student Last Name' },
          { name: 'dob', label: 'Date of Birth', type: 'date' },
          { name: 'gender', label: 'Gender', type: 'select', options: [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }] },
          { name: 'classAppliedFor', label: 'Class Applied For' },
          { name: 'courseApplied', label: 'Course Applied' },
          { name: 'academicYear', label: 'Academic Year', placeholder: 'e.g. 2026-2027' },
          { name: 'referenceNumber', label: 'Reference Number' },
          { name: 'parentName', label: 'Parent Name' },
          { name: 'parentPhone', label: 'Parent Phone', required: true },
          { name: 'parentEmail', label: 'Parent Email' },
          { name: 'previousSchool', label: 'Previous School' },
          { name: 'previousClass', label: 'Previous Class' },
          { name: 'city', label: 'City' },
          { name: 'state', label: 'State' },
          { name: 'pincode', label: 'Pincode' },
          { name: 'address', label: 'Address', type: 'textarea', span: 'full' },
        ]}
      />

      <ViewModal isOpen={!!viewApp} application={viewApp} onClose={() => setViewApp(null)} />
      <AdmitModal isOpen={!!admitApp} application={admitApp} onClose={() => setAdmitApp(null)} onAdmitted={fetchAll} />

      <FormModal
        isOpen={!!docsApp}
        title={`Verify Documents — ${docsApp?.studentFirstName || ''} ${docsApp?.studentLastName || ''}`}
        subtitle="Application moves to DOCUMENTS VERIFIED once every document is ticked"
        icon={FileCheck}
        fields={[
          ...docNames.map((name) => ({ name, label: name, type: 'checkbox' })),
          { name: 'reviewNotes', label: 'Notes', type: 'textarea', span: 'full' },
        ]}
        values={docsForm}
        onChange={(name, value) => setDocsForm((p) => ({ ...p, [name]: value }))}
        onSubmit={handleSaveDocs}
        onClose={() => setDocsApp(null)}
        submitLabel="Save Checklist"
        isSubmitting={savingDocs}
      />
      <SMSComposeModal isOpen={smsModalOpen} onClose={() => setSmsModalOpen(false)} defaultRecipientType="pre_admission" />
    </div>
  );
};

export default PreAdmissionListPage;
