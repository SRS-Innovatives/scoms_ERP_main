import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import SubmitAssignmentModal from '../../components/modals/SubmitAssignmentModal';
import { FileText, Upload, CheckCircle2, Loader2, ClipboardList, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import assignmentService from '../../services/assignmentService';

const deriveStatus = (asn) => {
  if (asn.mySubmission) return asn.mySubmission.status === 'REVIEWED' ? 'Graded' : (asn.mySubmission.status === 'LATE' ? 'Late' : 'Submitted');
  return new Date() > new Date(asn.dueDate) ? 'Overdue' : 'Pending';
};

export const AssignmentsListPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsn, setSelectedAsn] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    assignmentService.getAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch((err) => showError(err.message || 'Failed to load assignments', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments & Homework Center" subtitle="View active assignments, submit homework, and view teacher feedback marks." />

      {assignments.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 text-slate-300" /> No assignments have been published for your class yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignments.map((asn) => {
            const status = deriveStatus(asn);
            return (
              <div key={asn.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {asn.subjectName}
                    </span>
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{asn.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{asn.className} • Faculty: {asn.staff?.firstName} {asn.staff?.lastName}</p>
                  {asn.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">{asn.description}</p>}
                  {asn.attachmentUrl && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                      <Paperclip className="w-3 h-3" /> Attachment included
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Due Date:</span>
                    <span className="font-bold text-rose-600">{new Date(asn.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Marks:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {asn.mySubmission?.marksObtained ?? '—'} / {asn.totalMarks}
                    </span>
                  </div>

                  {!asn.mySubmission ? (
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
            );
          })}
        </div>
      )}

      {selectedAsn && (
        <SubmitAssignmentModal
          isOpen={!!selectedAsn}
          onClose={() => setSelectedAsn(null)}
          assignment={selectedAsn}
          onSubmitted={load}
        />
      )}
    </div>
  );
};

export default AssignmentsListPage;
