import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, ShieldAlert, Wallet, BellRing, Scale, Search, X, Workflow, CalendarClock } from 'lucide-react';
import courseService from '../../services/courseService';
import sectionService from '../../services/sectionService';
import ErrorState from '../../components/common/ErrorState';
import { useNotification } from '../../context/NotificationContext';
import feePolicyService from '../../services/feePolicyService';
import studentService from '../../services/studentService';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const box = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4';
const field = 'mt-1 w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';
const label = 'block text-xs font-semibold text-slate-600 dark:text-slate-300';

const TABS = [['rules', 'Rules'], ['recalc', 'Recalculate fees'],['holds', 'Held students'], ['exemptions', 'Hold exemptions'], ['dues-exceptions', 'Dues exceptions'], ['credit', 'Fee credit'], ['reminders', 'Reminders sent']];

/** A labelled group of radio "cards". */
const Choice = ({ value, onChange, options }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    {options.map(([v, title, hint]) => (
      <button key={v} type="button" onClick={() => onChange(v)} className={`text-left p-3 rounded-xl border text-xs ${value === v ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'border-slate-200 dark:border-slate-700'}`}>
        <p className={`font-bold ${value === v ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{title}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      </button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange, title, hint }) => (
  <label className="flex items-start gap-2.5 text-xs cursor-pointer">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-indigo-600" />
    <span><span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>{hint && <span className="block text-[11px] text-slate-500">{hint}</span>}</span>
  </label>
);

const Section = ({ icon: Icon, title, hint, children }) => (
  <div className={box}>
    <div className="flex items-start gap-2.5">
      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600"><Icon className="w-4 h-4" /></div>
      <div><h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>{hint && <p className="text-[11px] text-slate-500">{hint}</p>}</div>
    </div>
    {children}
  </div>
);

/**
 * Fees → Fee Policy. The institution's own rules for payments, extra money, holds while fees
 * are unpaid, and reminders. Every rule defaults to how fees worked before, so nothing
 * changes until the admin changes it here. One fee can have its own payment rules
 * (Fee Structure Builder → "Payment rules").
 */
export const FeePolicyPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [tab, setTab] = useState('rules');
  const [policy, setPolicy] = useState(null);
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState(null);
  const [listLoading, setListLoading] = useState(false);

  const load = useCallback(() => {
    setError(false);
    feePolicyService.getPolicy()
      .then((r) => { setPolicy(r.data.policy); setOptions(r.data.options); })
      .catch((e) => { notifyError(e.message); setError(true); });
  }, [notifyError]);
  useEffect(() => { load(); }, [load]);

  const loadList = useCallback(() => {
    if (tab === 'rules' || tab === 'recalc') return;
    setListLoading(true);
    setList(null);
    const call = tab === 'holds' ? feePolicyService.getHolds()
      : tab === 'exemptions' ? feePolicyService.getExemptions(true)
        : tab === 'dues-exceptions' ? feePolicyService.getDuesExceptions(true)
        : tab === 'credit' ? feePolicyService.getCredits() : feePolicyService.getReminderLog();
    call.then((r) => setList(r.data)).catch((e) => notifyError(e.message)).finally(() => setListLoading(false));
  }, [tab, notifyError]);
  useEffect(() => { loadList(); }, [loadList]);

  const set = (k, v) => setPolicy((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.keys(options.defaults).forEach((k) => { payload[k] = policy[k]; });
      const r = await feePolicyService.savePolicy(payload);
      setPolicy(r.data.policy);
      notifySuccess('Fee policy saved');
    } catch (e) {
      notifyError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const runNow = async () => {
    try { notifySuccess((await feePolicyService.runReminders()).message); } catch (e) { notifyError(e.message); }
  };

  if (error) return <ErrorState onRetry={load} />;
  if (!policy) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  const toggleHold = (h) => set('holds', policy.holds.includes(h) ? policy.holds.filter((x) => x !== h) : [...policy.holds, h]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Policy</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your institution's rules for payments, extra money, holds and reminders. A fee can override the payment rules in the Fee Structure Builder.</p>
        </div>
        {tab === 'rules' && (
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save policy
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold w-fit">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg ${tab === k ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'rules' && (
        <>
          <Section icon={Scale} title="Payments" hint="Applies at the counter and to online payments. The admin can bypass these for one payment by giving a reason.">
            <div>
              <p className={label}>Part payments</p>
              <Choice value={policy.partialPayment} onChange={(v) => set('partialPayment', v)} options={[
                ['ALLOWED', 'Allowed', 'Any amount'],
                ['NOT_ALLOWED', 'Whole instalments only', 'Or the full fee when it has no instalments'],
                ['COUNTER_ONLY', 'Only at the counter', 'Online payments must clear whole instalments'],
              ]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={label}>Minimum payment
                <select value={policy.minPaymentType} onChange={(e) => set('minPaymentType', e.target.value)} className={field}>
                  <option value="NONE">No minimum</option>
                  <option value="FIXED">A fixed amount (₹)</option>
                  <option value="PERCENT">% of the next instalment</option>
                </select>
              </label>
              {policy.minPaymentType !== 'NONE' && (
                <label className={label}>{policy.minPaymentType === 'FIXED' ? 'Minimum (₹)' : 'Minimum (%)'}
                  <input type="number" min="0" max={policy.minPaymentType === 'PERCENT' ? 100 : undefined} value={policy.minPaymentValue} onChange={(e) => set('minPaymentValue', Number(e.target.value))} className={field} />
                </label>
              )}
            </div>
            <div>
              <p className={label}>Late fee</p>
              <Choice value={policy.lateFeeOrder} onChange={(v) => set('lateFeeOrder', v)} options={[
                ['SEPARATE', 'Collected separately', 'Fees → Late Fees (as before)'],
                ['FIRST', 'Paid first', 'Each payment clears the late fee before the fee'],
                ['LAST', 'Paid last', 'Taken after the fee is fully paid'],
              ]} />
            </div>
            <Toggle checked={policy.counterHeadChoice} onChange={(v) => set('counterHeadChoice', v)} title="Let the counter choose which fee heads a payment goes to" hint="Off: payments must clear heads in the order set in the fee structure" />
            <Toggle checked={policy.oldestFeeFirst} onChange={(v) => set('oldestFeeFirst', v)} title="Older unpaid fees must be cleared first" hint="By due date, within the same year too — for academic years use Previous Year Dues below" />
          </Section>

          <Section icon={CalendarClock} title="Previous year dues" hint="When a student still owes fees of an earlier academic year and pays a later year's fee. Applies at the counter and online.">
            <Choice value={policy.previousYearDues} onChange={(v) => set('previousYearDues', v)} options={[
              ['ALLOW', 'Allow', 'Any fee can be paid (as before)'],
              ['BLOCK', 'Block until cleared', "Next year's fee can't be paid while last year's is unpaid"],
              ['AUTO_ADJUST', 'Adjust automatically', 'A payment clears the old dues first, the rest goes to the new fee'],
            ]} />
            {policy.previousYearDues !== 'ALLOW' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={label}>Ignore old dues below (₹)
                    <input type="number" min="0" value={policy.previousYearMinDue} onChange={(e) => set('previousYearMinDue', Number(e.target.value))} className={field} />
                    <span className="block text-[11px] font-normal text-slate-500 mt-1">0 = any amount counts</span>
                  </label>
                </div>
                {policy.previousYearDues === 'BLOCK' && (
                  <Toggle checked={policy.previousYearOverride} onChange={(v) => set('previousYearOverride', v)} title="The fee office may bypass the block for one payment" hint="With a reason, recorded in the audit log. Students paying online can never bypass it." />
                )}
                <p className="text-[11px] text-slate-500">
                  {policy.previousYearDues === 'AUTO_ADJUST'
                    ? 'Each old fee gets its own receipt. Head-wise collection (choosing heads of one fee) collects the old dues first instead.'
                    : 'Students see which year is unpaid and a "Pay previous dues" button.'}
                  {' '}To let one student pay anyway (management approval), add them on the Dues exceptions tab.
                </p>
              </div>
            )}
          </Section>

          <Section icon={Wallet} title="Extra money" hint="When someone pays more than is due.">
            <Choice value={policy.excessPayment} onChange={(v) => set('excessPayment', v)} options={[
              ['REJECT', 'Refuse it', 'The payment cannot exceed what is due (as before)'],
              ['CREDIT', 'Keep it as credit', 'Held for the student, shown on their fee page'],
            ]} />
            {policy.excessPayment === 'CREDIT' && (
              <>
                <Choice value={policy.creditUse} onChange={(v) => set('creditUse', v)} options={[
                  ['AUTO', 'Use automatically', 'Pays the next dues as soon as they exist'],
                  ['MANUAL', 'Admin decides', '"Pay dues from credit" at the counter'],
                ]} />
                <Toggle checked={policy.creditRefundable} onChange={(v) => set('creditRefundable', v)} title="Credit can be refunded" />
                <Toggle checked={policy.creditSiblingTransfer} onChange={(v) => set('creditSiblingTransfer', v)} title="Credit can be moved to a sibling" hint="Students who share a parent" />
              </>
            )}
          </Section>

          <Section icon={ShieldAlert} title="Holds while fees are unpaid" hint="Nothing is blocked unless you tick it. Single students can be exempted on the Hold exemptions tab.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(options.holds).map(([k, l]) => (
                <Toggle key={k} checked={policy.holds.includes(k)} onChange={() => toggleHold(k)} title={`Block ${l}`} />
              ))}
            </div>
            {policy.holds.length > 0 && (
              <>
                <Choice value={policy.holdTrigger} onChange={(v) => set('holdTrigger', v)} options={[
                  ['ANY_OVERDUE', 'Any overdue amount', 'As soon as a due date passes'],
                  ['OVERDUE_DAYS', 'Overdue for some days', 'Grace period before blocking'],
                  ['AMOUNT', 'Overdue above an amount', 'Ignore small dues'],
                ]} />
                {policy.holdTrigger === 'OVERDUE_DAYS' && (
                  <label className={label}>Days overdue before the hold<input type="number" min="0" value={policy.holdDays} onChange={(e) => set('holdDays', Number(e.target.value))} className={field} /></label>
                )}
                {policy.holdTrigger === 'AMOUNT' && (
                  <label className={label}>Hold when overdue is at least (₹)<input type="number" min="0" value={policy.holdAmount} onChange={(e) => set('holdAmount', Number(e.target.value))} className={field} /></label>
                )}
                <Toggle checked={policy.holdIncludeLateFee} onChange={(v) => set('holdIncludeLateFee', v)} title="Count unpaid late fees too" />
              </>
            )}
          </Section>

          <Section icon={BellRing} title="Reminders" hint="In-app and phone notifications to the student and/or parents. Each reminder is sent once.">
            <Toggle checked={policy.remindersEnabled} onChange={(v) => set('remindersEnabled', v)} title="Send automatic in-app reminders" />
            <Toggle checked={policy.smsRemindersEnabled} onChange={(v) => set('smsRemindersEnabled', v)} title="Send SMS to people with unpaid fees" hint="Uses your institution's SMS credits — one per message" />
            {policy.smsRemindersEnabled && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <Choice value={policy.smsOn} onChange={(v) => set('smsOn', v)} options={[
                  ['OVERDUE', 'Only when overdue', 'After the due date has passed (the overdue reminders)'],
                  ['ALL', 'Every reminder', 'Before, on and after the due date'],
                ]} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={label}>SMS to
                    <select value={policy.smsRecipients} onChange={(e) => set('smsRecipients', e.target.value)} className={field}>
                      <option value="PARENT">Parent / guardian</option><option value="STUDENT">Student</option><option value="BOTH">Both</option>
                    </select>
                  </label>
                  <label className={label}>Only when at least this much is unpaid (₹)
                    <input type="number" min="0" value={policy.smsMinDue} onChange={(e) => set('smsMinDue', Number(e.target.value))} className={field} />
                  </label>
                </div>
                <label className={label}>SMS text (blank = default)
                  <textarea rows={2} maxLength={300} value={policy.smsMessage || ''} placeholder={options.defaultSmsMessage} onChange={(e) => set('smsMessage', e.target.value)} className={field} />
                  <span className="text-[11px] font-normal text-slate-500">Keep it under 160 characters for one SMS. Same {'{name} {amount} {dueDate} {daysOverdue} {institution}'} fields.</span>
                </label>
              </div>
            )}
            {(policy.remindersEnabled || policy.smsRemindersEnabled) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={label}>Days before the due date (0 = none)<input type="number" min="0" max="60" value={policy.reminderBeforeDays} onChange={(e) => set('reminderBeforeDays', Number(e.target.value))} className={field} /></label>
                  <label className={label}>After the due date, every … days (0 = none)<input type="number" min="0" max="90" value={policy.reminderAfterEveryDays} onChange={(e) => set('reminderAfterEveryDays', Number(e.target.value))} className={field} /></label>
                  <label className={label}>At most … reminders after it<input type="number" min="0" max="30" value={policy.reminderAfterMaxTimes} onChange={(e) => set('reminderAfterMaxTimes', Number(e.target.value))} className={field} /></label>
                </div>
                <Toggle checked={policy.reminderOnDueDate} onChange={(v) => set('reminderOnDueDate', v)} title="Remind on the due date" />
                <label className={label}>In-app reminders to
                  <select value={policy.reminderRecipients} onChange={(e) => set('reminderRecipients', e.target.value)} className={field}>
                    <option value="BOTH">Student and parents</option><option value="STUDENT">Student only</option><option value="PARENT">Parents only</option>
                  </select>
                </label>
                <label className={label}>In-app message (blank = default)
                  <textarea rows={3} maxLength={500} value={policy.reminderMessage || ''} placeholder={options.defaultReminderMessage} onChange={(e) => set('reminderMessage', e.target.value)} className={field} />
                  <span className="text-[11px] font-normal text-slate-500">You can use {'{name} {fee} {amount} {dueDate} {daysOverdue} {when} {lateFee} {institution}'}</span>
                </label>
                <button type="button" onClick={runNow} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg">Send today's reminders now</button>
              </>
            )}
          </Section>
          <Section icon={Workflow} title="Automatic fees" hint="Fees are worked out from each fee head's rules (quota, hostel, bus route, siblings …) set in the Fee Structure Builder.">
            <Toggle checked={policy.autoAssignOnAdmission} onChange={(v) => set('autoAssignOnAdmission', v)} title="Assign fees on admission" hint="Single and bulk admission get their class's published fees straight away" />
            <Toggle checked={policy.autoAssignOnPromotion} onChange={(v) => set('autoAssignOnPromotion', v)} title="Assign fees on promotion" hint="The new class's published fees" />
            <Toggle checked={policy.autoAdjustOnServiceChange} onChange={(v) => set('autoAdjustOnServiceChange', v)} title="Adjust fees when hostel or transport changes" hint="A bed allotted or vacated, a bus route given or changed" />
            <div>
              <p className={label}>Changes in the middle of the year</p>
              <Choice value={policy.midYearChange} onChange={(v) => set('midYearChange', v)} options={[
                ['PRORATA', 'Pro-rata', 'By the months left in the academic year'],
                ['FULL', 'Full amount', 'The whole difference'],
                ['NEXT_TERM', 'From next term', 'No change now'],
              ]} />
            </div>
            <div>
              <p className={label}>When a student leaves (withdrawal / transfer)</p>
              <Choice value={policy.onLeaving} onChange={(v) => set('onLeaving', v)} options={[
                ['KEEP', 'Keep all dues', 'Collect everything (as before)'],
                ['STOP_FUTURE', 'Stop future instalments', 'Cancel what is not yet due'],
                ['WRITE_OFF', 'Write off', 'Clear all unpaid fees (needs approval rights)'],
              ]} />
              <p className="text-[11px] text-slate-500 mt-1">Applied from the Student Exit screen with "Settle fees".</p>
            </div>
          </Section>
        </>
      )}

      {tab === 'recalc' && <RecalcTab />}

      {tab !== 'rules' && tab !== 'recalc' && (listLoading || !list ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <ListTab tab={tab} list={list} options={options} reload={loadList} />
      ))}
    </div>
  );
};

const Table = ({ head, children }) => (
  <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500"><tr>{head.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
    </table>
  </div>
);
const empty = (text) => <p className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">{text}</p>;
const name = (s) => (s ? `${s.firstName} ${s.lastName}` : '—');

const ListTab = ({ tab, list, options, reload }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [adding, setAdding] = useState(false);

  if (tab === 'holds') {
    if (!list.enabled) return empty('No holds are switched on — tick them on the Rules tab.');
    if (!list.rows.length) return empty('No student is held right now.');
    return (
      <Table head={['Student', 'Class', 'Blocked', 'Exempted', 'Overdue', 'To release']}>
        {list.rows.map((r) => (
          <tr key={r.studentId}>
            <td className="p-3 font-bold">{name(r.student)}<p className="font-mono text-[10px] text-slate-500">{r.student?.admissionNumber}</p></td>
            <td className="p-3">{r.student?.course?.name} {r.student?.section?.name}</td>
            <td className="p-3 text-rose-600">{r.holds.map((h) => list.labels[h]).join(', ') || '—'}</td>
            <td className="p-3 text-amber-600">{r.exemptTypes.map((h) => list.labels[h]).join(', ') || '—'}</td>
            <td className="p-3 font-mono">{inr(r.overdue)}{r.lateFeeDue > 0 && <span className="text-slate-500"> + {inr(r.lateFeeDue)} late</span>}</td>
            <td className="p-3 font-mono font-bold">{inr(r.amountToClear)}</td>
          </tr>
        ))}
      </Table>
    );
  }
  if (tab === 'exemptions') {
    const revoke = async (id) => {
      try { await feePolicyService.revokeExemption(id); notifySuccess('Exemption revoked'); reload(); } catch (e) { notifyError(e.message); }
    };
    return (
      <div className="space-y-3">
        <button onClick={() => setAdding(true)} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">Exempt a student</button>
        {list.length === 0 ? empty('No exemptions yet.') : (
          <Table head={['Student', 'Exempt from', 'Reason', 'Until', 'Status', '']}>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-bold">{name(r.student)}<p className="font-mono text-[10px] text-slate-500">{r.student?.admissionNumber}</p></td>
                <td className="p-3">{Array.isArray(r.holdTypes) ? r.holdTypes.map((h) => options.holds[h]).join(', ') : 'All holds'}</td>
                <td className="p-3">{r.reason}</td>
                <td className="p-3">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('en-IN') : 'No end date'}</td>
                <td className="p-3">{r.active ? <span className="text-emerald-600 font-bold">Active</span> : <span className="text-slate-400">{r.revokedAt ? 'Revoked' : 'Expired'}</span>}</td>
                <td className="p-3 text-right">{r.active && <button onClick={() => revoke(r.id)} className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg">Revoke</button>}</td>
              </tr>
            ))}
          </Table>
        )}
        {adding && <ExemptionModal holds={options.holds} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      </div>
    );
  }
  if (tab === 'dues-exceptions') {
    const revoke = async (id) => {
      try { await feePolicyService.revokeDuesException(id); notifySuccess('Exception revoked'); reload(); } catch (e) { notifyError(e.message); }
    };
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-slate-500">Students listed here may pay a later year's fee although previous-year dues are unpaid (Rules → Previous year dues), until the end date.</p>
        <button onClick={() => setAdding(true)} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">Allow a student</button>
        {list.length === 0 ? empty('No dues exceptions yet.') : (
          <Table head={['Student', 'Reason', 'Until', 'Status', '']}>
            {list.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-bold">{name(r.student)}<p className="font-mono text-[10px] text-slate-500">{r.student?.admissionNumber}</p></td>
                <td className="p-3">{r.reason}</td>
                <td className="p-3">{new Date(r.validUntil).toLocaleDateString('en-IN')}</td>
                <td className="p-3">{r.active ? <span className="text-emerald-600 font-bold">Active</span> : <span className="text-slate-400">{r.revokedAt ? 'Revoked' : 'Expired'}</span>}</td>
                <td className="p-3 text-right">{r.active && <button onClick={() => revoke(r.id)} className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg">Revoke</button>}</td>
              </tr>
            ))}
          </Table>
        )}
        {adding && <DuesExceptionModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      </div>
    );
  }
  if (tab === 'credit') {
    if (!list.rows.length) return empty('No student holds fee credit.');
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Total credit held: {inr(list.total)}</p>
        <Table head={['Student', 'Class', 'Credit']}>
          {list.rows.map((r) => (
            <tr key={r.student?.id}>
              <td className="p-3 font-bold">{name(r.student)}<p className="font-mono text-[10px] text-slate-500">{r.student?.admissionNumber}</p></td>
              <td className="p-3">{r.student?.course?.name}</td>
              <td className="p-3 font-mono font-bold text-emerald-600">{inr(r.balance)}</td>
            </tr>
          ))}
        </Table>
        <p className="text-[11px] text-slate-500">Use, refund or move credit from the student's screen in Collect Fee.</p>
      </div>
    );
  }
  if (!list.length) return empty('No reminders sent yet.');
  const KIND = { BEFORE: 'Before due', DUE: 'On due date', AFTER: 'Overdue', MANUAL: 'Sent by admin' };
  return (
    <Table head={['Sent', 'Student', 'Fee', 'Type', 'In-app', 'SMS']}>
      {list.map((r) => (
        <tr key={r.id}>
          <td className="p-3 font-mono">{new Date(r.createdAt).toLocaleString('en-IN')}</td>
          <td className="p-3 font-bold">{name(r.student)}</td>
          <td className="p-3">{r.fee}</td>
          <td className="p-3">{KIND[r.kind]}{r.kind === 'AFTER' ? ` #${r.seq}` : ''}</td>
          <td className="p-3">{r.recipients}</td>
          <td className="p-3">{r.smsSent || '—'}</td>
        </tr>
      ))}
    </Table>
  );
};

/** Recalculate a whole class / section from the fee rules: preview, then apply. */
const RecalcTab = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [scope, setScope] = useState({ courseId: '', sectionId: '' });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    courseService.getAll().then((r) => setCourses(r.data || [])).catch(() => {});
    sectionService.getAll().then((r) => setSections(r.data || [])).catch(() => {});
  }, []);
  const params = scope.sectionId ? { sectionId: scope.sectionId } : scope.courseId ? { courseId: scope.courseId } : null;
  const run = async (apply) => {
    if (!params) return;
    setBusy(true);
    try {
      if (apply) {
        notifySuccess((await feePolicyService.applyClassSync(params)).message);
        setPreview(null);
      } else {
        setPreview((await feePolicyService.previewClassSync(params)).data);
      }
    } catch (e) {
      notifyError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const sectionChoices = sections.filter((s) => !scope.courseId || (s.semester?.course?.id || s.semester?.courseId) === scope.courseId);
  return (
    <div className={box}>
      <p className="text-xs text-slate-500">After changing fee rules, quotas, hostel or bus details, recalculate a class to assign missing fees and adjust existing ones. Mid-year changes follow the Fee Policy.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <label className={label}>Class
          <select value={scope.courseId} onChange={(e) => { setScope({ courseId: e.target.value, sectionId: '' }); setPreview(null); }} className={field}>
            <option value="">Choose…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={label}>Section (optional)
          <select value={scope.sectionId} onChange={(e) => { setScope((p) => ({ ...p, sectionId: e.target.value })); setPreview(null); }} className={field}>
            <option value="">Whole class</option>
            {sectionChoices.map((s) => <option key={s.id} value={s.id}>{[s.semester?.course?.name, s.name].filter(Boolean).join(' - ')}</option>)}
          </select>
        </label>
        <button onClick={() => run(false)} disabled={!params || busy} className="px-4 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50">Preview</button>
      </div>
      {preview && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{preview.affected} of {preview.students} student(s) would change</p>
          {preview.rows.length > 0 && (
            <Table head={['Student', 'Fees to assign', 'Fees to adjust', 'Deferred']}>
              {preview.rows.map((r) => (
                <tr key={r.student.id}>
                  <td className="p-3 font-bold">{name(r.student)}<p className="font-mono text-[10px] text-slate-500">{r.student.admissionNumber}</p></td>
                  <td className="p-3">{r.assign.map((a) => `${a.name} ${inr(a.total)}`).join(', ') || '—'}</td>
                  <td className="p-3">{r.adjust.map((a) => `${a.name} ${inr(a.totalFrom)} → ${inr(a.totalTo)}`).join(', ') || '—'}</td>
                  <td className="p-3 text-slate-500">{r.deferred.map((d) => d.name).join(', ') || '—'}</td>
                </tr>
              ))}
            </Table>
          )}
          {preview.affected > 0 && (
            <button onClick={() => run(true)} disabled={busy} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
              {busy ? 'Applying…' : 'Apply to all'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** Allow one student to pay later fees despite previous-year dues — reason + end date required. */
const DuesExceptionModal = ({ onClose, onSaved }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [reason, setReason] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const search = async () => {
    if (!q.trim()) return;
    try { setResults((await studentService.getAll({ search: q, limit: 8 })).data || []); } catch (e) { notifyError(e.message); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!student) { notifyError('Choose a student'); return; }
    setBusy(true);
    try {
      const r = await feePolicyService.createDuesException({ studentId: student.id, reason, validUntil });
      notifySuccess(r.message);
      onSaved();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Allow paying later fees despite previous-year dues</h3>
        {student ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-xs">
            <span className="font-bold">{name(student)} <span className="font-mono text-slate-500">{student.admissionNumber}</span></span>
            <button type="button" onClick={() => setStudent(null)}><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} placeholder="Name, roll or admission no." className={field} />
              <button type="button" onClick={search} className="mt-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800"><Search className="w-4 h-4" /></button>
            </div>
            {results.map((s) => (
              <button type="button" key={s.id} onClick={() => setStudent(s)} className="block w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                {name(s)} <span className="font-mono text-slate-500">{s.admissionNumber}</span>
              </button>
            ))}
          </div>
        )}
        <label className={label}>Reason — who approved it (required)<input required value={reason} onChange={(e) => setReason(e.target.value)} className={field} /></label>
        <label className={label}>Until (required)<input required type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={field} /></label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">{busy ? 'Saving…' : 'Allow'}</button>
        </div>
      </form>
    </div>
  );
};

const ExemptionModal = ({ holds, onClose, onSaved }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [types, setTypes] = useState([]);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    try { setResults((await studentService.getAll({ search: q, limit: 8 })).data || []); } catch (e) { notifyError(e.message); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!student) { notifyError('Choose a student'); return; }
    setBusy(true);
    try {
      const r = await feePolicyService.createExemption({ studentId: student.id, holdTypes: types, reason, expiresAt: expiresAt || undefined });
      notifySuccess(r.message);
      onSaved();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => !busy && onClose()}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Exempt a student from fee holds</h3>
        {student ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-xs">
            <span className="font-bold">{name(student)} <span className="font-mono text-slate-500">{student.admissionNumber}</span></span>
            <button type="button" onClick={() => setStudent(null)}><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} placeholder="Name, roll or admission no." className={field} />
              <button type="button" onClick={search} className="mt-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800"><Search className="w-4 h-4" /></button>
            </div>
            {results.map((s) => (
              <button type="button" key={s.id} onClick={() => setStudent(s)} className="block w-full text-left px-2.5 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                {name(s)} <span className="font-mono text-slate-500">{s.admissionNumber}</span>
              </button>
            ))}
          </div>
        )}
        <div>
          <p className={label}>Exempt from (none ticked = all holds)</p>
          {Object.entries(holds).map(([k, l]) => (
            <Toggle key={k} checked={types.includes(k)} onChange={() => setTypes((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]))} title={l} />
          ))}
        </div>
        <label className={label}>Reason (required)<input required value={reason} onChange={(e) => setReason(e.target.value)} className={field} /></label>
        <label className={label}>Until (optional)<input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={field} /></label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
          <button type="submit" disabled={busy} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60">{busy ? 'Saving…' : 'Exempt'}</button>
        </div>
      </form>
    </div>
  );
};

export default FeePolicyPage;
