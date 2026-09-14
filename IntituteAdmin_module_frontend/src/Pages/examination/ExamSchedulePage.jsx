import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import FormModal from '../../components/common/FormModal';
import { useNotification } from '../../context/NotificationContext';
import { CalendarClock, Plus, Trash2, Loader2 } from 'lucide-react';
import examService from '../../services/examService';
import courseService from '../../services/courseService';
import subjectService from '../../services/subjectService';

const emptyForm = { subjectId: '', examDate: '', startTime: '', endTime: '', maxMarks: '100', passMarks: '35', roomNumber: '' };

export const ExamSchedulePage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([examService.getExams(), courseService.getAll()])
      .then(([examRes, courseRes]) => {
        setExams(examRes.data || []);
        setCourses(courseRes.data || []);
        if ((examRes.data || []).length > 0) setExamId(examRes.data[0].id);
      })
      .catch((err) => notifyError(`Failed to load exams: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const fetchSchedules = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await examService.getSchedules(examId);
      setSchedules(res.data || []);
    } catch (error) {
      notifyError(`Failed to load schedules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [examId, notifyError]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (courseId) {
      subjectService.getAll(courseId).then((res) => setSubjects(res.data || [])).catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await examService.createSchedule({ ...form, examId });
      notifySuccess('Exam schedule added successfully!');
      setModalOpen(false);
      setForm(emptyForm);
      fetchSchedules();
    } catch (error) {
      notifyError(`Failed to add schedule: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await examService.deleteSchedule(id);
      notifySuccess('Schedule removed.');
      fetchSchedules();
    } catch (error) {
      notifyError(`Failed to remove schedule: ${error.message}`);
    }
  };

  const columns = [
    { header: 'Subject', key: 'subject', sortable: false, render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val?.name}</span> },
    { header: 'Course', key: 'subject2', sortable: false, render: (_, row) => row.course?.name },
    { header: 'Date', key: 'examDate', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Time', key: 'startTime', sortable: false, render: (_, row) => `${row.startTime} - ${row.endTime}` },
    { header: 'Max / Pass', key: 'maxMarks', sortable: false, render: (_, row) => `${row.maxMarks} / ${row.passMarks}` },
    { header: 'Room', key: 'roomNumber', render: (val) => val || '—' },
    { header: 'Marks Entered', key: '_count', sortable: false, render: (val) => `${val?.studentMarks ?? 0} students` },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (id) => (
        <button onClick={() => handleDelete(id)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Exam Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Per-subject date, time, and mark allocation for an exam</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
          <button onClick={() => setModalOpen(true)} disabled={!examId} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add Subject Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : !examId ? (
        <EmptyState title="No Exams Yet" message="Create an exam first under Exam Setup." icon={CalendarClock} />
      ) : schedules.length === 0 ? (
        <EmptyState title="No Subjects Scheduled" description="Add the first subject schedule for this exam." actionLabel="Add Subject Schedule" onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={schedules} />
      )}

      <FormModal
        isOpen={modalOpen}
        title="Add Subject Exam Schedule"
        icon={CalendarClock}
        submitLabel="Add Schedule"
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        values={form}
        onChange={(name, value) => {
          setForm((prev) => ({ ...prev, [name]: value, ...(name === 'courseId' ? { subjectId: '' } : {}) }));
          if (name === 'courseId') setCourseId(value);
        }}
        fields={[
          {
            name: 'courseId',
            label: 'Course',
            type: 'select',
            required: true,
            span: 'full',
            options: courses.map((c) => ({ value: c.id, label: c.name })),
          },
        ].concat(courseId ? [
          { name: 'subjectId', label: 'Subject', type: 'select', required: true, span: 'full', options: subjects.map((s) => ({ value: s.id, label: s.name })) },
          { name: 'examDate', label: 'Exam Date', type: 'date', required: true },
          { name: 'roomNumber', label: 'Room Number' },
          { name: 'startTime', label: 'Start Time', type: 'time', required: true },
          { name: 'endTime', label: 'End Time', type: 'time', required: true },
          { name: 'maxMarks', label: 'Max Marks', type: 'number', required: true },
          { name: 'passMarks', label: 'Pass Marks', type: 'number', required: true },
        ] : [])}
      />
    </div>
  );
};

export default ExamSchedulePage;
