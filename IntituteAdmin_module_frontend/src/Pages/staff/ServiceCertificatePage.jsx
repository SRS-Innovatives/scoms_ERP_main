import React, { useState, useEffect } from 'react';
import PrintHeader from '../../components/common/PrintHeader';
import { Printer, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import staffService from '../../services/staffService';

export const ServiceCertificatePage = () => {
  const { notifyError } = useNotification();
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService.getAll()
      .then((res) => {
        setStaffList(res.data || []);
        if ((res.data || []).length > 0) setStaffId(res.data[0].id);
      })
      .catch((err) => notifyError(`Failed to load staff: ${err.message}`))
      .finally(() => setLoading(false));
  }, [notifyError]);

  const staff = staffList.find((s) => s.id === staffId);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Service & Experience Certificate</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Official certificate of service for faculty employment verification</p>
        </div>
        {staffList.length > 0 && (
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold no-print">
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeCode})</option>)}
          </select>
        )}
      </div>

      {staff && (
        <>
          <div className="bg-white text-slate-900 p-10 rounded-2xl border-4 border-double border-slate-900 shadow-2xl max-w-4xl mx-auto print-container my-6">
            <PrintHeader title="SERVICE & EXPERIENCE CERTIFICATE" subtitle="Issued by Office of Human Resources" documentNo={`EXP/${new Date().getFullYear()}/${staff.employeeCode}`} />

            <div className="my-10 text-sm leading-relaxed text-slate-900 font-serif px-6 space-y-6">
              <p className="text-justify text-base">
                This is to certify that <span className="font-bold underline uppercase">{staff.firstName} {staff.lastName}</span> (Emp ID: <span className="font-mono font-bold">{staff.employeeCode}</span>) has been working in this institution as <span className="font-bold">{staff.designation}</span> in the Department of <span className="font-bold">{staff.department?.name || '—'}</span> since <span className="font-bold">{new Date(staff.joiningDate).toLocaleDateString('en-IN')}</span>.
              </p>
              <p className="text-justify text-base">
                During his / her tenure{staff.experience ? ` of ${staff.experience}` : ''}, his / her performance in teaching, academic research, laboratory supervision and institutional administration has been <span className="font-bold text-emerald-800 uppercase">HIGHLY SATISFACTORY</span>.
              </p>
              <p className="text-xs font-sans text-slate-600 pt-4">We wish him / her all success in future endeavors.</p>
            </div>

            <div className="pt-16 flex items-end justify-between text-xs font-sans">
              <div>
                <p className="text-slate-600">Date: <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span></p>
              </div>
              <div className="text-center">
                <p className="border-t border-slate-900 w-44 pt-1 font-bold text-slate-900">PRINCIPAL & DIRECTOR</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center no-print">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
              <Printer className="w-4 h-4" />
              <span>Print Service Certificate</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceCertificatePage;
