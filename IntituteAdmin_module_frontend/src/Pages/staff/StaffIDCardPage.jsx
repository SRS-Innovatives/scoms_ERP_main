import React, { useState, useEffect, useCallback } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import staffService from '../../services/staffService';

export const StaffIDCardPage = () => {
  const { notifyError } = useNotification();
  const { institution } = useInstitution();
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError(false);
    staffService.getAll()
      .then((res) => {
        setStaffList(res.data || []);
        if ((res.data || []).length > 0) setStaffId(res.data[0].id);
      })
      .catch((err) => { notifyError(`Failed to load staff: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [notifyError]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const staff = staffList.find((s) => s.id === staffId);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={fetchStaff} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff ID Card Generator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Faculty photo identity card preview</p>
        </div>
        {staffList.length > 0 && (
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold no-print">
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeCode})</option>)}
          </select>
        )}
      </div>

      {staff && (
        <>
          <div className="flex justify-center py-6 no-print">
            <div className="w-72 h-[440px] bg-linear-to-b from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-2xl shadow-2xl p-5 border-2 border-indigo-400/30 flex flex-col justify-between text-center">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-300">{institution?.code || institution?.name || 'SCOMS'} FACULTY</h3>
                <p className="text-[9px] text-indigo-200">{institution?.name || ''}</p>
              </div>
              <div>
                <div className="w-24 h-28 mx-auto rounded-xl bg-white/10 border-2 border-white flex items-center justify-center text-3xl font-black">
                  {staff.firstName?.[0]}{staff.lastName?.[0]}
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{staff.firstName} {staff.lastName}</h4>
                <p className="text-[10px] text-amber-300 font-semibold uppercase">{staff.designation}</p>
                <p className="text-[9px] text-slate-300">{staff.department?.name || '—'}</p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl text-[10px] text-left space-y-0.5">
                <p><span className="text-indigo-200">Emp ID:</span> <span className="font-mono font-bold text-white">{staff.employeeCode}</span></p>
                <p><span className="text-indigo-200">DOJ:</span> <span className="font-mono text-white">{new Date(staff.joiningDate).toLocaleDateString('en-IN')}</span></p>
              </div>
            </div>
          </div>

          <div className="flex justify-center no-print">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md">
              <Printer className="w-4 h-4" />
              <span>Print Staff ID Card</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffIDCardPage;
