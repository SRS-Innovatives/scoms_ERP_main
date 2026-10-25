import React, { useEffect, useState, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import studentService from '../../services/studentService';
import ErrorState from '../../components/common/ErrorState';

export const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    studentService.getById(id)
      .then((res) => setStudent(res.data))
      .catch((err) => { notifyError(`Failed to load student: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  }, [id, notifyError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!student) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
        Student not found. Go back to the Student Directory and select one again.
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const father = student.parents?.find((p) => p.relation === 'FATHER')?.parent || student.parents?.[0]?.parent;
  const mother = student.parents?.find((p) => p.relation === 'MOTHER')?.parent;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs glass-card">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {student.user?.avatar ? (
            <img
              src={student.user.avatar}
              alt={fullName}
              className="w-28 h-28 rounded-2xl object-cover border-4 border-indigo-100 dark:border-slate-800 shadow-md shrink-0"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 text-3xl font-bold shrink-0">
              {fullName.charAt(0)}
            </div>
          )}

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{fullName}</h1>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Roll: {student.rollNumber || '—'} | Register No: {student.registerNumber || student.admissionNumber}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={student.status} />
                <StatusBadge status={student.feeStatus} />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {student.course?.name} ({student.section?.semester?.name} - Sec {student.section?.name})
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {student.phone || '—'}</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {student.email}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {student.address || 'Not on file'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate('/admin/fee/collect')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Collect Fees
            </button>
            <button
              onClick={() => navigate(`/admin/student/id-card?id=${student.id}`)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              View ID Card
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal Info
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold">{student.dob ? new Date(student.dob).toLocaleDateString() : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Gender:</span> <span className="font-semibold">{student.gender}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Blood Group:</span> <span className="font-semibold">{student.bloodGroup || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Admission Date:</span> <span className="font-semibold">{new Date(student.admissionDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Scholarship:</span> <span className="font-bold text-emerald-700 dark:text-emerald-400">{student.scholarship}</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Parent & Emergency Contact
          </h3>
          {!father && !mother ? (
            <p className="text-slate-400">No parent/guardian record linked yet.</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between"><span className="text-slate-400">Father's Name:</span> <span className="font-semibold">{father?.fatherName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Occupation:</span> <span className="font-semibold">{father?.fatherOccupation || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mother's Name:</span> <span className="font-semibold">{father?.motherName || mother?.motherName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Parent Mobile:</span> <span className="font-mono font-bold text-indigo-600">{father?.fatherPhone || mother?.guardianPhone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Transport / Hostel:</span> <span className="font-semibold">{student.transport?.route?.routeName || 'None'} / {student.hostelBed?.hostel?.name || 'None'}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
