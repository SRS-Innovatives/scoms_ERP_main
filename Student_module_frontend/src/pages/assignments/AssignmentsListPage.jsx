import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import SubmitAssignmentModal from '../../components/modals/SubmitAssignmentModal';
import { mockAssignments } from '../../data/mockStudentData';
import { FileText, Calendar, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignmentsListPage = () => {
  const navigate = useNavigate();
  const [selectedAsn, setSelectedAsn] = useState(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments & Homework Center" subtitle="View active assignments, submit homework, and view teacher feedback marks." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockAssignments.map((asn) => (
          <div key={asn.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                  {asn.id}
                </span>
                <StatusBadge status={asn.status} />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{asn.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{asn.subject} • Faculty: {asn.teacher}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">{asn.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-rose-600">{asn.dueDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Marks:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{asn.obtainedMarks} / {asn.maxMarks}</span>
              </div>

              {asn.status === 'Pending' ? (
                <button
                  onClick={() => setSelectedAsn(asn)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Submit Homework Now
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/student/assignments/${asn.id}`)}
                  className="w-full py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> View Feedback
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedAsn && (
        <SubmitAssignmentModal isOpen={!!selectedAsn} onClose={() => setSelectedAsn(null)} assignment={selectedAsn} />
      )}
    </div>
  );
};

export default AssignmentsListPage;
