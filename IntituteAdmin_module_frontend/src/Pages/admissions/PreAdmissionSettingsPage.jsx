import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import preAdmissionService from '../../services/preAdmissionService';
import { KeyRound, RefreshCw, Copy, Check, Loader2, ShieldAlert } from 'lucide-react';

const PUBLIC_ENDPOINT = 'https://api.scoms.in/api/v1/public/pre-admission/submit';
// Local backend for dev/testing — the real deployed URL is what an institution's live
// website would actually point at; both are shown so the snippet works either way.
const LOCAL_ENDPOINT = 'http://localhost:5002/api/v1/public/pre-admission/submit';

const snippet = (apiKey, endpoint) => `<!-- Paste this into your institution's admission-form page -->
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
  const res = await fetch('${endpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': '${apiKey || 'YOUR_API_KEY_HERE'}',
    },
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

export const PreAdmissionSettingsPage = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const fetchKey = useCallback(async () => {
    setLoading(true);
    try {
      const res = await preAdmissionService.getApiKeySettings();
      setApiKey(res.data.apiKey);
    } catch (error) {
      notifyError(`Failed to load API key: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => { fetchKey(); }, [fetchKey]);

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

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  };

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

      {apiKey && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Public Submission Endpoint</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Send a <code className="font-mono">POST</code> request here with the <code className="font-mono">X-Api-Key</code> header set to your key above — every submission lands directly in your Pre-Admission Applications list.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
              POST {PUBLIC_ENDPOINT}
            </code>
            <button onClick={() => copy(PUBLIC_ENDPOINT, 'endpoint')} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Copy">
              {copied === 'endpoint' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Ready-to-paste HTML + JS Snippet</h3>
            <button onClick={() => copy(snippet(apiKey, LOCAL_ENDPOINT), 'snippet')} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              {copied === 'snippet' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Snippet</>}
            </button>
          </div>
          <pre className="p-3.5 bg-slate-900 dark:bg-black rounded-lg text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
            {snippet(apiKey, LOCAL_ENDPOINT)}
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
