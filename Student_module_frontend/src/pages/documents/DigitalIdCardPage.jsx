import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import studentService from '../../services/studentService';
import ErrorState from '../../components/common/ErrorState';

// The institution's chosen orientation/template (set by the Institute Admin under
// Settings → ID Card Generator) decides layout dimensions and color treatment — the
// student never picks their own card design, they just see the institution's real one.
const DIMENSIONS = {
  VERTICAL: { width: 288, height: 448 },
  HORIZONTAL: { width: 448, height: 288 },
};

const TEMPLATE_STYLES = {
  CLASSIC: {
    cardClass: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white border-2 border-indigo-500',
    accentText: 'text-indigo-300',
    mutedText: 'text-slate-400',
    photoBorder: 'border-indigo-400',
    footerBorder: 'border-white/20',
  },
  MODERN: {
    cardClass: 'bg-white text-slate-900 border-2 border-sky-500 shadow-sky-500/20',
    accentText: 'text-sky-600',
    mutedText: 'text-slate-500',
    photoBorder: 'border-sky-500',
    footerBorder: 'border-slate-200',
  },
  MINIMAL: {
    cardClass: 'bg-white text-slate-900 border border-slate-300',
    accentText: 'text-slate-600',
    mutedText: 'text-slate-400',
    photoBorder: 'border-slate-300',
    footerBorder: 'border-slate-200',
  },
};

export const DigitalIdCardPage = () => {
  const { error: showError } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [side, setSide] = useState('Front');

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    studentService.getIdCard()
      .then((res) => setData(res.data))
      .catch((err) => { showError(err.message || 'Failed to load ID card', 'Load Failed'); setError(true); })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  if (!data?.student) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-center text-xs text-slate-500">
        Your ID card isn't ready yet — contact your Institute Admin if this doesn't resolve.
      </div>
    );
  }

  const { student, parentPhone, parentName, orientation, template } = data;
  const dims = DIMENSIONS[orientation] || DIMENSIONS.VERTICAL;
  const style = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.CLASSIC;
  const isHorizontal = orientation === 'HORIZONTAL';
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const verificationCode = `SCOMS-ID:${student.institution?.code}:${student.admissionNumber}`;
  const address = [student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Digital Student ID Card</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your institution's official {orientation.toLowerCase()} {template.toLowerCase()} card</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSide(side === 'Front' ? 'Back' : 'Front')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Flip ({side})
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <div
          className={`p-5 rounded-3xl shadow-2xl relative overflow-hidden print-container flex flex-col justify-between ${style.cardClass} ${isHorizontal ? 'flex-row items-center gap-4' : ''}`}
          style={{ width: dims.width, height: dims.height }}
        >
          {side === 'Front' ? (
            isHorizontal ? (
              <>
                <div className={`flex flex-col items-center gap-2 shrink-0`}>
                  <div className={`w-20 h-24 rounded-xl overflow-hidden border-2 ${style.photoBorder} bg-slate-100 flex items-center justify-center shrink-0`}>
                    {student.user?.avatar ? (
                      <img src={student.user.avatar} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-2xl font-black ${style.accentText}`}>{fullName.charAt(0)}</span>
                    )}
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    {student.institution?.logo && <img src={student.institution.logo} alt="" className="w-6 h-6 rounded object-cover" />}
                    <p className={`text-[10px] font-black uppercase tracking-wide ${style.accentText}`}>{student.institution?.name}</p>
                  </div>
                  <h2 className="text-base font-black leading-tight">{fullName}</h2>
                  <p className={`font-mono font-bold text-[11px] ${style.accentText}`}>{student.admissionNumber}</p>
                  <p className={`text-[11px] ${style.mutedText}`}>{student.course?.name} • {student.section?.name}</p>
                  <p className={`text-[10px] ${style.mutedText}`}>Blood Group: {student.bloodGroup || '—'}</p>
                </div>
                <div className="shrink-0 bg-white p-1.5 rounded-lg">
                  <QRCodeSVG value={verificationCode} size={64} />
                </div>
              </>
            ) : (
              <>
                <div className={`flex justify-between items-center border-b pb-3 ${style.footerBorder}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {student.institution?.logo ? (
                      <img src={student.institution.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-xs text-white shrink-0">
                        {student.institution?.code?.[0] || 'S'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-xs tracking-tight truncate">{student.institution?.name}</h3>
                      <p className={`text-[9px] ${style.accentText}`}>STUDENT IDENTITY CARD</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
                  <div className={`w-24 h-28 rounded-2xl overflow-hidden border-2 ${style.photoBorder} bg-slate-100 flex items-center justify-center shadow-lg`}>
                    {student.user?.avatar ? (
                      <img src={student.user.avatar} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-2xl font-black ${style.accentText}`}>{fullName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="text-center space-y-0.5">
                    <h2 className="text-sm font-black">{fullName}</h2>
                    <p className={`font-mono font-bold text-[11px] ${style.accentText}`}>{student.admissionNumber}</p>
                    <p className={`text-[11px] ${style.mutedText}`}>{student.course?.name}</p>
                    <p className={`text-[10px] ${style.mutedText}`}>{student.section?.name} • Blood: {student.bloodGroup || '—'}</p>
                  </div>
                </div>

                <div className={`pt-2 border-t flex justify-between items-center text-[10px] ${style.footerBorder} ${style.mutedText}`}>
                  <span>Reg: {student.registerNumber || student.rollNumber || '—'}</span>
                  <span className="font-bold text-emerald-500">ACTIVE</span>
                </div>
              </>
            )
          ) : (
            /* Back Side — same content for both orientations, laid out simply */
            <div className="flex flex-col justify-between h-full w-full text-xs">
              <div className={`text-center space-y-1 border-b pb-2 ${style.footerBorder}`}>
                <h4 className={`font-bold uppercase text-[10px] ${style.accentText}`}>Address & Emergency Contact</h4>
                <p className={`text-[11px] ${style.mutedText}`}>{address || '—'}</p>
                <p className={`text-[10px] ${style.mutedText}`}>Parent: {parentName || '—'} ({parentPhone || '—'})</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 flex-1">
                <div className="p-2.5 bg-white rounded-2xl">
                  <QRCodeSVG value={verificationCode} size={isHorizontal ? 80 : 100} />
                </div>
                <span className={`text-[9px] font-mono font-bold ${style.mutedText}`}>SCAN FOR VERIFICATION</span>
              </div>

              <p className={`text-center text-[9px] ${style.mutedText}`}>If found, please return to {student.institution?.name}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalIdCardPage;
