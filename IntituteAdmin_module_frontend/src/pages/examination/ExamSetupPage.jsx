import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { Award } from 'lucide-react';
import examService from '../../services/examService';
import academicYearService from '../../services/academicYearService';
import customListService from '../../services/customListService';
import { useAcademic } from '../../context/InstitutionContext';

const emptyForm = { name: '', examType: '', academicYearId: '', startDate: '', endDate: '', assessmentType: 'GENERAL' };

const ASSESSMENT_LABELS = { GENERAL: 'Standalone', INTERNAL: 'Internal', EXTERNAL: 'External (final)' };

/** Set an exam's Internal / External role, and for an External exam which Internal exams
 * (same academic year) count towards its final result. */
const AssessmentModal = ({ exam, exams, regulations, onClose, onSave, saving }) => {
  const [type, setType] = useState('GENERAL');
  const [ids, setIds] = useState([]);
  useEffect(() => {
    if (exam) {
      setType(exam.assessmentType || 'GENERAL');
      setIds(Array.isArray(exam.internalExamIds) ? exam.internalExamIds : []);
    }
  }, [exam]);
  if (!exam) return null;
  const internals = exams.filter((e) => e.assessmentType === 'INTERNAL' && e.academicYearId === exam.academicYearId && e.id !== exam.id);
  const enabled = regulations?.internalAssessmentEnabled && regulations?.internalAssessmentWeight > 0 && regulations?.internalAssessmentWeight < 100;
  const w = Number(regulations?.internalAssessmentWeight) || 0;
  const toggle = (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Result type — {exam.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Internal tests are averaged and combined with the External exam into one final result.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ASSESSMENT_LABELS).map(([k, label]) => (
            <button key={k} onClick={() => setType(k)} className={`px-2 py-2 rounded-lg text-xs font-semibold border ${type === k ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{label}</button>
          ))}
        </div>
        {type === 'EXTERNAL' && (
          <div className="space-y-2 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Internal exams that count towards this result</p>
            {internals.length === 0 ? (
              <p className="text-xs text-slate-400">No Internal exams in this academic year yet — mark your unit tests / CATs as Internal first.</p>
            ) : internals.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <input type="checkbox" checked={ids.includes(e.id)} onChange={() => toggle(e.id)} className="w-4 h-4 rounded text-indigo-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{e.name}</span>
              </label>
            ))}
            <p className={`text-[11px] ${enabled ? 'text-slate-500' : 'text-amber-600 dark:text-amber-400'}`}>
              {enabled
                ? `Final % = average internal % × ${w}% + external % × ${100 - w}% (your institution's academic settings).`
                : 'Internal assessment is switched off in your institution\'s academic settings, so results will use the external marks alone until it is enabled.'}
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
          <button onClick={() => onSave({ assessmentType: type, internalExamIds: type === 'EXTERNAL' ? ids : [] })} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExamSetupPage = () => {
  const academic = useAcademic();
  const { notifySuccess, notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [assessmentExam, setAssessmentExam] = useState(null);
  const [assessmentSaving, setAssessmentSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, yearRes, typeRes] = await Promise.all([examService.getExams(), academicYearService.getAll(), customListService.getActive('EXAM_TYPE')]);
      setExams(examRes.data || []);
      setAcademicYears(yearRes.data || []);
      setExamTypes(typeRes.data || []);
      if ((typeRes.data || []).length > 0) setForm((prev) => (prev.examType ? prev : { ...prev, examType: typeRes.data[0].code }));
    } catch (error) {
      notifyError(`Failed to load exams: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await examService.createExam(form);
      notifySuccess(`Exam "${form.name}" created successfully!`);
      setModalOpen(false);
      setForm(emptyForm);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to create exam: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // students can download hall tickets only after this is switched on
  const handleHallTickets = async (row) => {
    try {
      const res = await examService.setHallTicketRelease(row.id, !row.hallTicketsReleased);
      notifySuccess(res.message || 'Hall ticket release updated.');
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update hall tickets: ${error.message}`);
    }
  };

  const handleAssessmentSave = async (payload) => {
    setAssessmentSaving(true);
    try {
      await examService.setExamAssessment(assessmentExam.id, payload);
      notifySuccess(`"${assessmentExam.name}" is now ${ASSESSMENT_LABELS[payload.assessmentType]}.`);
      setAssessmentExam(null);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update result type: ${error.message}`);
    } finally {
      setAssessmentSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await examService.updateExamStatus(id, status);
      notifySuccess(`Exam marked as ${status}.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update status: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Exam Title', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Category', key: 'examType', render: (val) => <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{val?.replace('_', ' ')}</span> },
    { header: 'Academic Year', key: 'academicYear', sortable: false, render: (val) => val?.yearName },
    {
      header: 'Result Type', key: 'assessmentType', render: (val, row) => (
        <button onClick={() => setAssessmentExam(row)} title="Change Internal / External" className={`px-2 py-0.5 rounded text-[10px] font-bold ${val === 'EXTERNAL' ? 'bg-indigo-100 text-indigo-700' : val === 'INTERNAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
          {ASSESSMENT_LABELS[val || 'GENERAL']}{val === 'EXTERNAL' && Array.isArray(row.internalExamIds) && row.internalExamIds.length ? ` + ${row.internalExamIds.length} internal` : ''}
        </button>
      ),
    },
    { header: 'Conducted By', key: 'conductedByInstitution', sortable: false, render: (val) => val ? <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val.name}</span> : <span className="text-slate-400">Self</span> },
    { header: 'Schedules', key: '_count', sortable: false, render: (val) => `${val?.schedules ?? 0} Subjects` },
    { header: 'Start Date', key: 'startDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status', render: (val) => <StatusBadge status={val} /> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id, row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(id, e.target.value)}
            className="text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button
            onClick={() => handleHallTickets(row)}
            title={row.hallTicketsReleased ? 'Students can download hall tickets — click to withdraw' : 'Students cannot download hall tickets yet — click to release'}
            className={`text-[11px] font-bold px-2 py-1.5 rounded-lg ${row.hallTicketsReleased ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {row.hallTicketsReleased ? 'Hall tickets released ✓' : 'Release hall tickets'}
          </button>
        </div>
      ),
    },
  ];

  const filtered = exams.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Examination Setup Master</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure End {academic.label('semester')} Exams, Internal Assessment Tests (CAT/IA), and Unit Tests</p>
      </div>

      <SearchFilterBar searchQuery={search} onSearchChange={setSearch} addLabel="Create New Exam" onAddClick={() => setModalOpen(true)} />

      {!loading && filtered.length === 0 ? (
        <EmptyState title="No Exams Created Yet" description="Create your institution's first exam to get started." actionLabel="Create New Exam" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Create New Exam"
        subtitle="Define the exam window — you'll add per-subject schedules next"
        icon={Award}
        submitLabel="Create Exam"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => setForm((prev) => ({ ...prev, [name]: value }))}
        fields={[
          { name: 'name', label: 'Exam Title (e.g. Mid Term Examination 2026)', required: true, span: 'full' },
          {
            name: 'examType',
            label: 'Category',
            type: 'select',
            required: true,
            options: examTypes.map((t) => ({ value: t.code, label: t.label })),
          },
          {
            name: 'academicYearId',
            label: 'Academic Year',
            type: 'select',
            required: true,
            options: academicYears.map((y) => ({ value: y.id, label: y.yearName })),
          },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'endDate', label: 'End Date', type: 'date', required: true },
          {
            name: 'assessmentType',
            label: 'Result Type',
            type: 'select',
            options: [
              { value: 'GENERAL', label: 'Standalone (own result)' },
              { value: 'INTERNAL', label: 'Internal (counts towards a final exam)' },
              { value: 'EXTERNAL', label: 'External / final (link internals after creating)' },
            ],
          },
        ]}
      />

      <AssessmentModal
        exam={assessmentExam}
        exams={exams}
        regulations={academic.regulations}
        onClose={() => setAssessmentExam(null)}
        onSave={handleAssessmentSave}
        saving={assessmentSaving}
      />
    </div>
  );
};

export default ExamSetupPage;
