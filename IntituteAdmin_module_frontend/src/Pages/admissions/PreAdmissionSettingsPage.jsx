import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import preAdmissionService from '../../services/preAdmissionService';
import { KeyRound, RefreshCw, Copy, Check, Loader2, ShieldAlert, Wallet, Save } from 'lucide-react';

const PUBLIC_ENDPOINT = 'https://api.scoms.in/api/v1/public/pre-admission';
// Local backend for dev/testing — the real deployed URL is what an institution's live
// website would actually point at; both are shown so the snippet works either way.
const LOCAL_ENDPOINT = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/v1/public/pre-admission`;

/** The free (no fee) version — submit and done. */
const snippetNoFee = (apiKey, endpoint) => `<!-- Paste this into your institution's admission-form page -->
<form id="scoms-admission-form">
  <input name="studentFirstName" placeholder="Student First Name" required />
  <input name="studentLastName" placeholder="Student Last Name" />
  <input name="parentPhone" placeholder="Parent Phone" required />
  <input name="parentEmail" placeholder="Parent Email" type="email" />
  <input name="classAppliedFor" placeholder="Class Applied For" />
  <button type="submit">Submit Application</button>
</form>

<script>
document.getElementById('scoms-admission-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const res = await fetch('${endpoint}/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': '${apiKey || 'YOUR_API_KEY_HERE'}' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (result.success) {
    alert('Application submitted! Reference: ' + result.data.applicationNumber);
    e.target.reset();
  } else {
    alert('Submission failed: ' + result.message);
  }
});
</script>`;

/** The fee-collecting version — submits the application, then immediately opens a real
 * Razorpay Checkout for the amount you set below, and verifies the payment server-side
 * before the applicant sees a success message. */
const snippetWithFee = (apiKey, endpoint) => `<!-- Paste this into your institution's admission-form page -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<form id="scoms-admission-form">
  <input name="studentFirstName" placeholder="Student First Name" required />
  <input name="studentLastName" placeholder="Student Last Name" />
  <input name="parentPhone" placeholder="Parent Phone" required />
  <input name="parentEmail" placeholder="Parent Email" type="email" />
  <input name="classAppliedFor" placeholder="Class Applied For" />
  <button type="submit">Submit Application & Pay</button>
</form>

<script>
const API_KEY = '${apiKey || 'YOUR_API_KEY_HERE'}';
document.getElementById('scoms-admission-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  // 1. Submit the application — the server snapshots the fee amount due right now.
  const submitRes = await fetch('${endpoint}/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify(data),
  });
  const submitResult = await submitRes.json();
  if (!submitResult.success) { alert('Submission failed: ' + submitResult.message); return; }
  const { id: applicationId, applicationNumber, feeAmount } = submitResult.data;
  if (!feeAmount) { alert('Application submitted! Reference: ' + applicationNumber); e.target.reset(); return; }

  // 2. Create a real payment order for exactly this application's fee.
  const orderRes = await fetch('${endpoint}/' + applicationId + '/fee/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
  });
  const order = (await orderRes.json()).data;

  // 3. Open Razorpay Checkout — verify the real signature server-side once it returns.
  const rzp = new Razorpay({
    key: order.key, amount: order.amount * 100, currency: order.currency, order_id: order.orderId,
    name: '${'{{Your Institution Name}}'}',
    description: 'Application Fee — ' + applicationNumber,
    handler: async function (response) {
      const verifyRes = await fetch('${endpoint}/' + applicationId + '/fee/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      const verifyResult = await verifyRes.json();
      if (verifyResult.success) { alert('Payment confirmed! Reference: ' + applicationNumber); e.target.reset(); }
      else { alert('Payment could not be verified: ' + verifyResult.message); }
    },
  });
  rzp.open();
});
</script>`;

export const PreAdmissionSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [apiKey, setApiKey] = useState(null);
  const [feeAmount, setFeeAmount] = useState(null);
  const [feeInput, setFeeInput] = useState('');
  const [savingFee, setSavingFee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await preAdmissionService.getApiKeySettings();
      setApiKey(res.data.apiKey);
      setFeeAmount(res.data.feeAmount);
      setFeeInput(res.data.feeAmount ? String(res.data.feeAmount) : '');
    } catch (error) {
      notifyError(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await preAdmissionService.regenerateApiKey();
      setApiKey(res.data.apiKey);
      notifySuccess('A new API key was generated. Update your website integration with this new key.');
    } catch (error) {
      notifyError(`Failed to generate key: ${error.message}`);
    } finally {
      setRegenerating(false);
      setConfirming(false);
    }
  };

  const handleSaveFee = async () => {
    setSavingFee(true);
    try {
      const value = feeInput.trim() === '' ? null : Number(feeInput);
      const res = await preAdmissionService.updateFeeAmount(value);
      setFeeAmount(res.data.feeAmount);
      notifySuccess(res.message);
    } catch (error) {
      notifyError(`Failed to save fee: ${error.message}`);
    } finally {
      setSavingFee(false);
    }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const activeSnippet = feeAmount ? snippetWithFee(apiKey, LOCAL_ENDPOINT) : snippetNoFee(apiKey, LOCAL_ENDPOINT);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pre-Admission Integration</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Connect your institution's own website admission form directly into SCOMS with this API key
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">API Key</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
              {apiKey}
            </code>
            <button onClick={() => copy(apiKey, 'key')} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Copy">
              {copied === 'key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">No API key has been generated yet — generate one below to start accepting applications from your website.</p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {confirming ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" /> The current key will stop working immediately. Continue?
              </p>
              <button onClick={handleRegenerate} disabled={regenerating} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
                {regenerating ? 'Generating...' : 'Yes, regenerate'}
              </button>
              <button onClick={() => setConfirming(false)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-semibold text-xs">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              {apiKey ? 'Regenerate Key' : 'Generate API Key'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Application Fee</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          When set, every new application must pay this amount online (via Razorpay) before it's accepted. Leave blank for a free application form. Changing this only affects <strong>new</strong> submissions — applications already received keep the fee they were submitted under.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
            <input
              type="number" min="0" step="1"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              placeholder="No fee"
              className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
          <button onClick={handleSaveFee} disabled={savingFee} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs disabled:opacity-50">
            <Save className="w-4 h-4" /> {savingFee ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {apiKey && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Public Submission Endpoint</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Send a <code className="font-mono">POST</code> request here with the <code className="font-mono">X-Api-Key</code> header set to your key above — every submission lands directly in your Pre-Admission Applications list.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
              POST {PUBLIC_ENDPOINT}/submit
            </code>
            <button onClick={() => copy(`${PUBLIC_ENDPOINT}/submit`, 'endpoint')} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Copy">
              {copied === 'endpoint' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ready-to-paste HTML + JS Snippet {feeAmount ? '(with online payment)' : '(no fee)'}
            </h3>
            <button onClick={() => copy(activeSnippet, 'snippet')} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              {copied === 'snippet' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Snippet</>}
            </button>
          </div>
          <pre className="p-3.5 bg-slate-900 dark:bg-black rounded-lg text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
            {activeSnippet}
          </pre>
          <p className="text-[10px] text-slate-400 mt-2">
            The snippet points at your local dev backend — swap the URL for <span className="font-mono">{PUBLIC_ENDPOINT}</span> once this instance is live.
          </p>
        </div>
      )}
    </div>
  );
};

export default PreAdmissionSettingsPage;
