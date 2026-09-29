import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Loader2, X, Save, CalendarPlus2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import examSetupService from '../../services/examSetupService';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const EXAM_TYPES = ['UNIT_TEST', 'MID_TERM', 'FINAL', 'ANNUAL', 'MODEL'];
const emptyExam = { name: '', examType: 'UNIT_TEST', academicYearId: '', startDate: '', endDate: '' };
const emptySchedule = { examId: '', subjectId: '', courseId: '', examDate: '', startTime: '', endTime: '', maxMarks: '', passMarks: '', roomNumber: '' };

export const ExamSetupPage = () => {
  const { success, error: showError } = useNotification();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    examSetupService.getExams()
      .then((res) => setExams(res.data || []))
      .catch((err) => { showError(err.message || 'Failed to load exams', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await examSetupService.createExam(examForm);
      success('Exam created successfully.');
      setExamForm(emptyExam); setExamFormOpen(false); fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to create exam', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleForm = (examId) => {
    setScheduleForm({ ...emptySchedule, examId });
    setScheduleFormOpen(examId);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await examSetupService.createSchedule(scheduleForm);
      success('Exam schedule created.');
      setScheduleFormOpen(null); fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to create schedule', 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try { await examSetupService.updateExamStatus(id, status); success(`Exam marked ${status.toLowerCase()}.`); fetchAll(); }
    catch (err) { showError(err.message || 'Failed to update exam status', 'Update Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>;
  if (error) return <ErrorState onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Setup</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Create exams and schedule subject-wise papers</p>
        </div>
        <button onClick={() => { setExamForm(emptyExam); setExamFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> New Exam
        </button>
      </div>

      {examFormOpen && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-sky-500" /> New Exam</h3>
            <button onClick={() => setExamFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block font-semibold mb-1">Exam Name</label><input required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="e.g. Mid Term Examination 2026" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div><label className="block font-semibold mb-1">Exam Type</label><select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">{EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
              <div><label className="block font-semibold mb-1">Academic Year ID</label><input required value={examForm.academicYearId} onChange={(e) => setExamForm({ ...examForm, academicYearId: e.target.value })} placeholder="From Academic Calendar page" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-semibold mb-1">Start Date</label><input type="date" required value={examForm.startDate} onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                <div><label className="block font-semibold mb-1">End Date</label><input type="date" required value={examForm.endDate} onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
              </div>
            </div>
            <div className="flex justify-end"><button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md disabled:opacity-50"><Save className="w-4 h-4" /> {submitting ? 'Creating...' : 'Create Exam'}</button></div>
          </form>
        </div>
      )}

      {exams.length === 0 ? (
        <EmptyState title="No Exams Created Yet" message="Create the first exam above, then add subject-wise schedules to it." icon={CalendarClock} />
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">{exam.examType.replace('_', ' ')} • {exam.status}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{exam.name}</h3>
                  <p className="text-[11px] text-slate-500">{new Date(exam.startDate).toLocaleDateString('en-IN')} – {new Date(exam.endDate).toLocaleDateString('en-IN')} • {exam._count?.schedules || 0} schedule(s)</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openScheduleForm(exam.id)} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 rounded-lg hover:bg-sky-100"><CalendarPlus2 className="w-3 h-3" /> Add Schedule</button>
                  {exam.status !== 'COMPLETED' && (
                    <button onClick={() => handleStatusChange(exam.id, exam.status === 'SCHEDULED' ? 'ONGOING' : 'COMPLETED')} className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg hover:bg-slate-200">
                      {exam.status === 'SCHEDULED' ? 'Start' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>

              {scheduleFormOpen === exam.id && (
                <form onSubmit={handleCreateSchedule} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div><label className="block font-semibold mb-1">Subject ID</label><input required value={scheduleForm.subjectId} onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Course ID</label><input required value={scheduleForm.courseId} onChange={(e) => setScheduleForm({ ...scheduleForm, courseId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Exam Date</label><input type="date" required value={scheduleForm.examDate} onChange={(e) => setScheduleForm({ ...scheduleForm, examDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Start Time</label><input value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} placeholder="10:00 AM" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">End Time</label><input value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} placeholder="1:00 PM" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Room Number</label><input value={scheduleForm.roomNumber} onChange={(e) => setScheduleForm({ ...scheduleForm, roomNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Max Marks</label><input type="number" value={scheduleForm.maxMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, maxMarks: e.target.value })} placeholder="100" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div><label className="block font-semibold mb-1">Pass Marks</label><input type="number" value={scheduleForm.passMarks} onChange={(e) => setScheduleForm({ ...scheduleForm, passMarks: e.target.value })} placeholder="35" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div>
                  <div className="flex items-end gap-2">
                    <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-sky-600 rounded-xl disabled:opacity-50 flex-1 justify-center"><Save className="w-3.5 h-3.5" /> Save</button>
                    <button type="button" onClick={() => setScheduleFormOpen(null)} className="px-4 py-2 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamSetupPage;
