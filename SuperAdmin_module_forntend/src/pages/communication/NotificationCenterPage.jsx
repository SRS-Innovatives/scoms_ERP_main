import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { Send, Users, Radio, History, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import broadcastService from '../../services/broadcastService';
import institutionService from '../../services/institutionService';

const AUDIENCES = [
  ['INSTITUTE_ADMINS', 'Institute Admins'],
  ['STAFF', 'Staff & faculty'],
  ['STUDENTS', 'Students'],
  ['PARENTS', 'Parents'],
];
const emptyForm = { audiences: ['INSTITUTE_ADMINS'], scope: 'ALL', institutionIds: [], title: '', message: '', email: false, sms: false };
const field = 'w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const delivery = (ch) => {
  if (!ch) return null;
  if (!ch.done) return `${fmt(ch.sent + ch.failed)} / ${fmt(ch.queued)} sending…`;
  return `${fmt(ch.sent)} sent${ch.failed ? `, ${fmt(ch.failed)} failed` : ''}`;
};

/**
 * Notification Center — send a real platform-wide notice to chosen people across all or
 * chosen institutions: in-app bell + phone push always, email / SMS optionally. The history
 * below is the real record of every broadcast with its delivery counts.
 */
export const NotificationCenterPage = () => {
  const { success, error: showError } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [institutions, setInstitutions] = useState([]);
  const [reach, setReach] = useState(null);
  const [reachLoading, setReachLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    institutionService.getInstitutions({ limit: 100 }).then((r) => setInstitutions(r?.data || [])).catch(() => {});
  }, []);

  const target = { audiences: form.audiences, institutionIds: form.scope === 'SOME' ? form.institutionIds : [] };
  const targetKey = JSON.stringify(target);

  // live reach count whenever the audience changes
  useEffect(() => {
    if (!form.audiences.length || (form.scope === 'SOME' && !form.institutionIds.length)) { setReach(null); return undefined; }
    let cancelled = false;
    setReachLoading(true);
    const t = setTimeout(() => {
      broadcastService.preview(JSON.parse(targetKey))
        .then((r) => { if (!cancelled) setReach(r.data); })
        .catch(() => { if (!cancelled) setReach(null); })
        .finally(() => { if (!cancelled) setReachLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [targetKey, form.audiences.length, form.scope, form.institutionIds.length]);

  const loadHistory = useCallback((page = 1) => {
    setHistoryLoading(true);
    setHistoryError('');
    broadcastService.getHistory(page)
      .then((r) => { setHistory(r.data || []); setMeta(r.meta || { page: 1, totalPages: 1, total: 0 }); })
      .catch((e) => setHistoryError(e.message || 'Could not load the history'))
      .finally(() => setHistoryLoading(false));
  }, []);
  useEffect(() => { loadHistory(1); }, [loadHistory]);

  // while email / SMS are still going out, refresh the history every few seconds
  useEffect(() => {
    if (!history.some((h) => (h.email && !h.email.done) || (h.sms && !h.sms.done))) return undefined;
    const t = setTimeout(() => loadHistory(meta.page), 4000);
    return () => clearTimeout(t);
  }, [history, meta.page, loadHistory]);

  const toggle = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reach?.recipients) { showError('Nobody matches this audience yet.', 'Nothing to send'); return; }
    if (!window.confirm(`Send "${form.title}" to ${fmt(reach.recipients)} people${form.email ? ' (also by email)' : ''}${form.sms ? ' (also by SMS)' : ''}?`)) return;
    setSending(true);
    try {
      const res = await broadcastService.send({ ...target, title: form.title, message: form.message, channels: { email: form.email, sms: form.sms } });
      success(res.message || 'Broadcast sent');
      setForm(emptyForm);
      loadHistory(1);
    } catch (err) {
      showError(err.message || 'Could not send the broadcast', 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Center" subtitle="Send a platform-wide notice to people across your institutions — it appears in their notification bell and as a phone alert, and optionally by email or SMS." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSend} className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Radio className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Compose broadcast</h3>
          </div>

          <div>
            <p className="font-bold text-slate-600 dark:text-slate-400 mb-1">Send to</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map(([k, l]) => (
                <label key={k} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer ${form.audiences.includes(k) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700'}`}>
                  <input type="checkbox" className="sr-only" checked={form.audiences.includes(k)} onChange={() => toggle('audiences', k)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-600 dark:text-slate-400 mb-1">Institutions</p>
            <div className="flex gap-4 mb-2">
              {[['ALL', 'All active institutions'], ['SOME', 'Only selected institutions']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="scope" checked={form.scope === k} onChange={() => setForm((f) => ({ ...f, scope: k }))} /> {l}
                </label>
              ))}
            </div>
            {form.scope === 'SOME' && (
              <div className="max-h-40 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                {institutions.length === 0 && <p className="text-slate-400">No institutions.</p>}
                {institutions.map((i) => (
                  <label key={i.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.institutionIds.includes(i.id)} onChange={() => toggle('institutionIds', i.id)} />
                    <span className="font-semibold">{i.name}</span> <span className="font-mono text-slate-400">{i.code}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Headline</label>
            <input type="text" required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Scheduled downtime on Sunday 6–8 AM" className={field} />
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Message</label>
            <textarea required rows={4} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write the full notice here…" className={field} />
            <p className="text-[11px] text-slate-400 mt-1">{form.message.length} / 2000{form.sms ? ' — SMS sends the headline and the first part of the message (300 characters)' : ''}</p>
          </div>

          <div>
            <p className="font-bold text-slate-600 dark:text-slate-400 mb-1">Also send by</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked disabled /> In-app & phone alert (always)</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.email} onChange={(e) => setForm({ ...form, email: e.target.checked })} /> Email</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.sms} onChange={(e) => setForm({ ...form, sms: e.target.checked })} /> SMS</label>
            </div>
          </div>

          <button type="submit" disabled={sending || !reach?.recipients} className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{sending ? 'Sending…' : 'Send broadcast'}</span>
          </button>
        </form>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Who will get it</h3>
          </div>
          {!form.audiences.length ? (
            <p className="text-slate-500">Choose at least one group.</p>
          ) : form.scope === 'SOME' && !form.institutionIds.length ? (
            <p className="text-slate-500">Choose at least one institution.</p>
          ) : reachLoading && !reach ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          ) : reach ? (
            <div className="space-y-2">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{fmt(reach.recipients)} <span className="text-xs font-semibold text-slate-500">people</span></p>
              <p className="text-slate-600 dark:text-slate-300">{fmt(reach.withEmail)} have an email address · {fmt(reach.withPhone)} have a mobile number</p>
              {(form.email && reach.withEmail > reach.maxExternal) || (form.sms && reach.withPhone > reach.maxExternal) ? (
                <p className="text-amber-600">Email / SMS go to the first {fmt(reach.maxExternal)} only per broadcast.</p>
              ) : null}
              <p className="text-slate-400">Only active users of active institutions are counted. SMS and email use the platform's own gateway (not institutions' credits); if a gateway isn't configured they're logged as simulated.</p>
            </div>
          ) : (
            <p className="text-slate-500">Couldn't count the audience.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Sent broadcasts</h3>
          </div>
          <button onClick={() => loadHistory(meta.page)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {historyLoading && !history.length ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : historyError ? (
          <div className="text-center py-6 space-y-2">
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300">{historyError}</p>
            <button onClick={() => loadHistory(meta.page)} className="px-3 py-1.5 font-semibold text-white bg-indigo-600 rounded-lg">Try again</button>
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No broadcasts sent yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr><th className="py-2 pr-3">Sent</th><th className="py-2 pr-3">Headline</th><th className="py-2 pr-3">To</th><th className="py-2 pr-3">In-app</th><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">SMS</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((h) => (
                    <tr key={h.id} className="align-top">
                      <td className="py-2 pr-3 font-mono whitespace-nowrap">{new Date(h.sentAt).toLocaleString('en-IN')}<p className="font-sans text-slate-400">{h.sentBy}</p></td>
                      <td className="py-2 pr-3"><p className="font-bold text-slate-900 dark:text-white">{h.title}</p><p className="text-slate-500 line-clamp-2">{h.message}</p></td>
                      <td className="py-2 pr-3">{h.audiences.join(', ')}<p className="text-slate-400">{h.institutions}</p></td>
                      <td className="py-2 pr-3 font-semibold">{fmt(h.inApp)}</td>
                      <td className="py-2 pr-3">{delivery(h.email) || '—'}</td>
                      <td className="py-2 pr-3">{delivery(h.sms) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Page {meta.page} of {meta.totalPages} · {fmt(meta.total)} broadcasts</span>
                <div className="flex gap-2">
                  <button onClick={() => loadHistory(meta.page - 1)} disabled={meta.page <= 1} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40">Previous</button>
                  <button onClick={() => loadHistory(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
