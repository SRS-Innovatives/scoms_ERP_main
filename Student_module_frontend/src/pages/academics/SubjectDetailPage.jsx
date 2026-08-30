import React, { useEffect, useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import studentService from '../../services/studentService';
import materialService from '../../services/materialService';
import assignmentService from '../../services/assignmentService';
import examService from '../../services/examService';
import { ArrowLeft, User, Download, FileText, Loader2 } from 'lucide-react';

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useNotification();

  const [subject, setSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [examSchedule, setExamSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    Promise.all([
      studentService.getMySubjects(),
      materialService.getMaterials(),
      assignmentService.getAssignments(),
      examService.getExamSchedule(),
    ])
      .then(([subjectsRes, materialsRes, assignmentsRes, scheduleRes]) => {
        const sub = (subjectsRes.data || []).find((s) => s.id === id);
        setSubject(sub || null);
        if (sub) {
          setMaterials((materialsRes.data || []).filter((m) => m.subject?.name === sub.name));
          setAssignments((assignmentsRes.data || []).filter((a) => a.subjectName === sub.name));
          setExamSchedule((scheduleRes.data || []).filter((e) => e.subject?.name === sub.name));
        }
      })
      .catch((err) => showError(err.message || 'Failed to load subject', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [id, showError]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!subject) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/student/subjects')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </button>
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Subject not found in your enrolled course.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/student/subjects')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </button>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950">
            {subject.code}
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">{subject.name}</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Faculty: <span className="font-semibold">{subject.faculty}</span> • {subject.credits} Credits
          </p>
        </div>
        {subject.attendance !== null && (
          <StatusBadge status={subject.attendance < 75 ? 'Low Attendance' : 'On Track'} />
        )}
      </div>

      <div className="flex gap-2 border-b pb-1 overflow-x-auto">
        {['Overview', 'Notes & Materials', 'Assignments', 'Exams'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[10px] text-slate-400 uppercase">Credits</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{subject.credits}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[10px] text-slate-400 uppercase">Attendance</p>
              <p className={`text-lg font-black ${subject.attendance === null ? 'text-slate-400' : subject.attendance < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {subject.attendance === null ? '—' : `${subject.attendance}%`}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[10px] text-slate-400 uppercase">Marks</p>
              <p className="text-lg font-black text-indigo-600">{subject.marks ? `${subject.marks.obtained} / ${subject.marks.max}` : '—'}</p>
            </div>
          </div>
        )}

        {activeTab === 'Notes & Materials' && (
          <div className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No study materials shared for this subject yet.</p>
            ) : (
              materials.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold">{m.title}</span>
                  </div>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 font-bold text-white bg-indigo-600 rounded-lg flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Assignments' && (
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No assignments for this subject yet.</p>
            ) : (
              assignments.map((asn) => (
                <div key={asn.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{asn.title}</h4>
                    <p className="text-[11px] text-slate-500">Due: {new Date(asn.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={asn.mySubmission ? asn.mySubmission.status : 'PENDING'} size="sm" />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Exams' && (
          <div className="space-y-2">
            {examSchedule.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No exams scheduled for this subject yet.</p>
            ) : (
              examSchedule.map((e) => (
                <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{e.exam?.name}</h4>
                    <p className="text-[11px] text-slate-500">{new Date(e.examDate).toLocaleDateString()} • {e.startTime}-{e.endTime}</p>
                  </div>
                  <span className="font-bold text-indigo-600">{e.maxMarks} Marks</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailPage;
