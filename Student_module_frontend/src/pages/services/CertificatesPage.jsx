import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Award, Download } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const CertificatesPage = () => {
  const { success } = useNotification();

  const certificates = [
    { id: "CERT-01", name: "Bonafide Certificate (Bank & Bus Pass Purpose)", date: "2026-07-20", status: "Generated" },
    { id: "CERT-02", name: "Conduct & Character Certificate", date: "2026-06-15", status: "Generated" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Certificates & Digital Verification"
        subtitle="Request Bonafide, Transfer, Conduct, or Medium of Instruction certificates."
        actionLabel="Request New Bonafide"
        onAction={() => success('Bonafide request submitted to Admin office.', 'Request Submitted')}
      />

      <div className="space-y-4">
        {certificates.map((cert) => (
          <div key={cert.id} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{cert.name}</h3>
                <p className="text-[11px] text-slate-500">Issued: {cert.date}</p>
              </div>
            </div>
            <button
              onClick={() => success(`Downloading PDF for ${cert.name}`, 'PDF Downloaded')}
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-xl flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
