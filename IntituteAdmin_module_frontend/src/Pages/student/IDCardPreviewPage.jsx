import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Loader2, Save, LayoutGrid, RectangleVertical, RectangleHorizontal, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useInstitution } from '../../context/InstitutionContext';
import studentService from '../../services/studentService';
import settingsService from '../../services/settingsService';

const DIMENSIONS = {
  VERTICAL: { width: 288, height: 448 },
  HORIZONTAL: { width: 448, height: 288 },
};

const TEMPLATE_STYLES = {
  CLASSIC: { cardClass: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white border-2 border-indigo-500', accentText: 'text-indigo-300', mutedText: 'text-slate-400', photoBorder: 'border-indigo-400', footerBorder: 'border-white/20' },
  MODERN: { cardClass: 'bg-white text-slate-900 border-2 border-sky-500', accentText: 'text-sky-600', mutedText: 'text-slate-500', photoBorder: 'border-sky-500', footerBorder: 'border-slate-200' },
  MINIMAL: { cardClass: 'bg-white text-slate-900 border border-slate-300', accentText: 'text-slate-600', mutedText: 'text-slate-400', photoBorder: 'border-slate-300', footerBorder: 'border-slate-200' },
};

const ORIENTATION_OPTIONS = [
  { value: 'VERTICAL', label: 'Vertical', icon: RectangleVertical },
  { value: 'HORIZONTAL', label: 'Horizontal', icon: RectangleHorizontal },
];
const TEMPLATE_OPTIONS = ['CLASSIC', 'MODERN', 'MINIMAL'];

/** Institution-wide ID Card Generator: the Institute Admin picks the orientation and
 * visual template ONCE here — that choice is saved to InstitutionSettings and is what
 * every student sees on their own Digital ID Card, and what prints for any student here. */
export const IDCardPreviewPage = () => {
  const { notifyError, notifySuccess } = useNotification();
  const { institution } = useInstitution();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('id');

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(presetId || '');
  const [loading, setLoading] = useState(true);
  const [orientation, setOrientation] = useState('VERTICAL');
  const [template, setTemplate] = useState('CLASSIC');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([studentService.getAll({ limit: 500 }), settingsService.getSettings()])
      .then(([studentsRes, settingsRes]) => {
        const list = studentsRes.data || [];
        setStudents(list);
        if (!presetId && list.length > 0) setStudentId(list[0].id);
        setOrientation(settingsRes.data?.idCardOrientation || 'VERTICAL');
        setTemplate(settingsRes.data?.idCardTemplate || 'CLASSIC');
      })
      .catch((err) => notifyError(`Failed to load ID card data: ${err.message}`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const student = students.find((s) => s.id === studentId);

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings({ idCardOrientation: orientation, idCardTemplate: template });
      notifySuccess('ID card template saved — every student now sees this design on their own portal.');
    } catch (err) {
      notifyError(err.message || 'Failed to save ID card template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const dims = DIMENSIONS[orientation];
  const style = TEMPLATE_STYLES[template];
  const isHorizontal = orientation === 'HORIZONTAL';
  const fullName = student ? `${student.firstName} ${student.lastName}`.trim() : '';
  const verificationCode = student ? `SCOMS-ID:${institution?.code}:${student.admissionNumber}` : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student ID Card Generator</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Choose your institution's card design once — it applies everywhere a student ID card is shown or printed.</p>
      </div>

      {/* Institution-wide template picker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 no-print space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-500" /> Institution Card Design
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Orientation</label>
            <div className="grid grid-cols-2 gap-2">
              {ORIENTATION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOrientation(o.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 font-semibold transition-all ${
                    orientation === o.value ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <o.icon className="w-5 h-5" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Template</label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={`p-3 rounded-xl border-2 font-semibold capitalize transition-all ${
                    template === t ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {t.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveTemplate} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save as Institution Design'}
          </button>
        </div>
      </div>

      {/* Student picker + preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Preview & Print</h3>
        {students.length > 0 && (
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
            {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
          </select>
        )}
      </div>

      {!student ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-500">
          No students found yet — admit a student first to preview their ID card.
        </div>
      ) : (
        <>
          <div className="flex justify-center py-4">
            <div
              className={`p-5 rounded-3xl shadow-2xl relative overflow-hidden print-container flex flex-col justify-between ${style.cardClass} ${isHorizontal ? 'flex-row items-center gap-4' : ''}`}
              style={{ width: dims.width, height: dims.height }}
            >
              {isHorizontal ? (
                <>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`w-20 h-24 rounded-xl overflow-hidden border-2 ${style.photoBorder} bg-slate-100 flex items-center justify-center shrink-0`}>
                      {student.user?.avatar ? <img src={student.user.avatar} alt={fullName} className="w-full h-full object-cover" /> : <span className={`text-2xl font-black ${style.accentText}`}>{fullName.charAt(0)}</span>}
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      {institution?.logo && <img src={institution.logo} alt="" className="w-6 h-6 rounded object-cover" />}
                      <p className={`text-[10px] font-black uppercase tracking-wide ${style.accentText}`}>{institution?.name}</p>
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
                      {institution?.logo ? (
                        <img src={institution.logo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-xs text-white shrink-0">{institution?.code?.[0] || 'S'}</span>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-xs tracking-tight truncate">{institution?.name}</h3>
                        <p className={`text-[9px] ${style.accentText}`}>STUDENT IDENTITY CARD</p>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
                    <div className={`w-24 h-28 rounded-2xl overflow-hidden border-2 ${style.photoBorder} bg-slate-100 flex items-center justify-center shadow-lg`}>
                      {student.user?.avatar ? <img src={student.user.avatar} alt={fullName} className="w-full h-full object-cover" /> : <span className={`text-2xl font-black ${style.accentText}`}>{fullName.charAt(0)}</span>}
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
              )}
            </div>
          </div>

          <div className="flex justify-center no-print">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-md transition-all">
              <Printer className="w-4 h-4" />
              <span>Print This Card</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IDCardPreviewPage;
