import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { mockStudentSubjects, mockAssignments } from '../../data/mockStudentData';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, FileText, User } from 'lucide-react';

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const subject = mockStudentSubjects.find(s => s.code === id) || mockStudentSubjects[0];
  const [activeTab, setActiveTab] = useState('Overview');

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
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">{subject.title}</h2>
          <p className="text-xs text-slate-500">Faculty: <span className="font-semibold">{subject.faculty}</span> • {subject.credits} Credits</p>
        </div>
        <StatusBadge status={`Grade: ${subject.grade}`} />
      </div>

      <div className="flex gap-2 border-b pb-1">
        {['Overview', 'Notes & Materials', 'Assignments', 'Exams'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        {activeTab === 'Overview' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Course Syllabus & Description</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Covers process management, CPU scheduling algorithms, virtual memory paging, deadlock handling, file system storage structures, and Linux kernel fundamentals.
            </p>
          </div>
        )}

        {activeTab === 'Notes & Materials' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="font-bold">Unit 1 & 2 CPU Scheduling Lecture Slides.pdf</span>
              </div>
              <button className="px-3 py-1 font-bold text-white bg-indigo-600 rounded-lg flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Assignments' && (
          <div className="space-y-2">
            {mockAssignments.map(asn => (
              <div key={asn.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{asn.title}</h4>
                  <p className="text-[11px] text-slate-500">Due: {asn.dueDate}</p>
                </div>
                <StatusBadge status={asn.status} size="sm" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Exams' && (
          <p className="text-slate-500">Upcoming Mid-Sem Exam scheduled for Aug 25th in Exam Hall A3.</p>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailPage;
