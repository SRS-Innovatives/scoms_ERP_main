import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, ExternalLink, Loader2, Inbox } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import certificateService from '../../services/certificateService';

const TYPE_OPTIONS = [
  { value: 'BONAFIDE', label: 'Bonafide Certificate (Bank & Bus Pass Purpose)' },
  { value: 'TRANSFER', label: 'Transfer Certificate' },
  { value: 'CONDUCT', label: 'Conduct & Character Certificate' },
  { value: 'COURSE_COMPLETION', label: 'Course Completion Certificate' },
];

const STATUS_LABELS = { PENDING: 'Pending', READY: 'Issued', REJECTED: 'Rejected' };

export const CertificatesPage = () => {
  const { success, error: showError } = useNotification();
  const [certificates, setCertificates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState(TYPE_OPTIONS[0].value);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([certificateService.getMyCertificates(), certificateService.getMyCertificateRequests()])
      .then(([certRes, reqRes]) => {
        setCertificates(certRes.data || []);
        setRequests(reqRes.data || []);
      })
      .catch((err) => showError(err.message || 'Failed to load certificates', 'Load Failed'))
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await certificateService.requestCertificate(requestType, reason);
      success('Request submitted to Admin office.', 'Request Submitted');
      setReason('');
      load();
    } catch (err) {
      showError(err.message || 'Failed to submit request', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Certificates & Digital Verification"
        subtitle="Request Bonafide, Transfer, Conduct, or Course Completion certificates."
      />

      <form onSubmit={handleRequest} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs max-w-xl">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Request a New Certificate</h3>
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason / purpose (optional)"
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
        ></textarea>
        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {requests.filter((r) => r.status === 'PENDING' || r.status === 'REJECTED').length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase">Pending & Recent Requests</h4>
          {requests.filter((r) => r.status === 'PENDING' || r.status === 'REJECTED').map((r) => (
            <div key={r.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <Inbox className="w-5 h-5 text-slate-400" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{TYPE_OPTIONS.find((t) => t.value === r.type)?.label || r.type}</h4>
                  <p className="text-[11px] text-slate-500">Requested {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <StatusBadge status={STATUS_LABELS[r.status] || r.status} size="sm" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Issued Certificates</h4>
        {certificates.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No certificates issued yet — approved requests will appear here.
          </div>
        ) : (
          certificates.map((cert) => (
            <div key={cert.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{cert.title}</h3>
                  <p className="text-[11px] text-slate-500">Cert. No. {cert.certificateNo} • Issued {new Date(cert.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {cert.pdfUrl ? (
                <a href={cert.pdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-xl flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
              ) : (
                <span className="text-slate-400">No file attached</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
