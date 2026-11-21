import React, { useEffect, useState } from 'react';
import { Bell, Loader2, MessageSquare, Smartphone } from 'lucide-react';
import notificationPrefsService from '../../services/notificationPrefsService';
import { useNotification } from '../../context/NotificationContext';

// Same categories as shared/utils/notificationPreferences.js
const ROWS = [
  { key: 'attendance', label: 'Attendance alerts', hint: 'Absent / late on a class day' },
  { key: 'fees', label: 'Fee reminders', hint: 'Fee due and overdue reminders' },
  { key: 'announcements', label: 'Announcements', hint: 'Circulars and messages from the school' },
];
const CHANNELS = [
  { key: 'sms', label: 'SMS', icon: Smartphone },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

const Toggle = ({ on, onClick, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
  </button>
);

/** SMS & WhatsApp preferences — which school messages to receive on each. */
export const NotificationPrefsCard = () => {
  const { success, error: showError } = useNotification();
  const [prefs, setPrefs] = useState(null);
  const [saved, setSaved] = useState(null);
  const [phones, setPhones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    notificationPrefsService.get()
      .then((res) => { setPrefs(res.data.prefs); setSaved(res.data.prefs); setPhones(res.data.phones || []); })
      .catch(() => setFailed(true));
  }, []);

  const flip = (ch, cat) => setPrefs((p) => ({ ...p, [ch]: { ...p[ch], [cat]: !p[ch][cat] } }));
  const dirty = prefs && saved && JSON.stringify(prefs) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      const res = await notificationPrefsService.save(prefs);
      setPrefs(res.data.prefs);
      setSaved(res.data.prefs);
      success('Notification preferences saved');
    } catch (err) {
      showError(err.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Bell className="w-4 h-4 text-indigo-500" /> SMS & WhatsApp Notifications</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">Choose which school messages you get on each.</p>
      </div>

      {failed ? (
        <p className="text-[11px] text-rose-500">Could not load your preferences. Please try again later.</p>
      ) : !prefs ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500">
              <span>Message</span>
              {CHANNELS.map((c) => <span key={c.key} className="flex items-center gap-1 justify-center w-16"><c.icon className="w-3.5 h-3.5" /> {c.label}</span>)}
            </div>
            {ROWS.map((r) => (
              <div key={r.key} className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
                  <p className="text-[10px] text-slate-400">{r.hint}</p>
                </div>
                {CHANNELS.map((c) => (
                  <span key={c.key} className="flex justify-center w-16">
                    <Toggle on={prefs[c.key][r.key]} onClick={() => flip(c.key, r.key)} label={`${r.label} by ${c.label}`} />
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 space-y-0.5">
            {phones.length > 0 && <p>Messages go to: {phones.map((p) => `${p.who} ${p.phone}`).join(', ')}.</p>}
            <p>Login details, password reset codes and urgent platform notices are always sent. In-app notifications are not affected.</p>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={!dirty || saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save preferences
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPrefsCard;
