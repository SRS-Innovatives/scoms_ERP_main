import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { Inbox, CheckCircle2, XCircle } from 'lucide-react';
import certificateService from '../../services/certificateService';

const TYPE_LABELS = { BONAFIDE: 'Bonafide', TRANSFER: 'Transfer Certificate', CONDUCT: 'Conduct', COURSE_COMPLETION: 'Course Completion' };
const STATUS_STYLES = { PENDING: 'bg-amber-100 text-amber-800', READY: 'bg-emerald-100 text-emerald-800', REJECTED: 'bg-rose-100 text-rose-800' };

export const CertificateRequestsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await certificateService.getRequests();
      setRequests(res.data || []);
    } catch (error) {
      notifyError(`Failed to load certificate requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDecision = async (row, decision) => {
    setActing(row.id);
    try {
      await certificateService.resolveRequest(row.id, decision);
      notifySuccess(decision === 'APPROVE' ? `Certificate issued for ${row.student?.firstName} ${row.student?.lastName}.` : `Request from ${row.student?.firstName} ${row.student?.lastName} rejected.`);
      fetchAll();
    } catch (error) {
      notifyError(`Failed to update request: ${error.message}`);
    } finally {
      setActing(null);
    }
  };

  const columns = [
    { header: 'Student', key: 'student', sortable: false, render: (val) => val ? `${val.firstName} ${val.lastName} (${val.rollNumber || val.admissionNumber})` : '—' },
    { header: 'Type', key: 'type', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{TYPE_LABELS[val] || val}</span> },
    { header: 'Reason', key: 'reason', sortable: false, render: (val) => val || '—' },
    { header: 'Requested', key: 'createdAt', render: (val) => <span className="font-mono">{new Date(val).toLocaleDateString('en-IN')}</span> },
    { header: 'Status', key: 'status', render: (val) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[val] || 'bg-slate-100 text-slate-700'}`}>{val}</span> },
    {
      header: 'Actions',
      key: 'id',
      sortable: false,
      render: (_id, row) =>
        row.status === 'PENDING' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDecision(row, 'APPROVE')}
              disabled={acting === row.id}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg disabled:opacity-50"
              title="Approve & Issue"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDecision(row, 'REJECT')}
              disabled={acting === row.id}
              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-50"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">{row.certificateNo || '—'}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Certificate Requests</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review and approve certificate requests submitted by students — approving issues the real certificate.</p>
      </div>

      {!loading && requests.length === 0 ? (
        <EmptyState title="No Requests Yet" description="Student certificate requests will appear here as they're submitted." icon={Inbox} />
      ) : (
        <DataTable columns={columns} data={requests} loading={loading} />
      )}
    </div>
  );
};

export default CertificateRequestsPage;
