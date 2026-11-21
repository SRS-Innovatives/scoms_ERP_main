import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import preAdmissionService from '../../services/preAdmissionService';
import admissionCustomFieldService from '../../services/admissionCustomFieldService';
import { KeyRound, RefreshCw, Copy, Check, Loader2, ShieldAlert, Wallet, Save, Plug, ListChecks, Code2 } from 'lucide-react';

// The same server this portal talks to (services/api.js) — so the address shown is always
// the real one for this deployment, never a made-up domain.
const API_BASE = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5002';
  try { return new URL(base, window.location.origin).toString().replace(/\/$/, ''); } catch { return base; }
})();
const ENDPOINT = `${API_BASE}/api/v1/public/pre-admission`;

// The standard fields every application accepts (checked by the server — see
// IntituteAdmin_Backend/src/services/preAdmissionValidation.js).
const STANDARD_FIELDS = [
  { key: 'studentFirstName', type: 'Text', required: true, rule: 'Up to 200 characters' },
  { key: 'studentLastName', type: 'Text', rule: 'Up to 200 characters' },
  { key: 'dob', type: 'Date', rule: 'YYYY-MM-DD, not in the future' },
  { key: 'gender', type: 'Choice', rule: 'MALE, FEMALE or OTHER (male / f / girl … also accepted)' },
  { key: 'classAppliedFor', type: 'Text', rule: 'School: e.g. "Class 5"' },
  { key: 'courseApplied', type: 'Text', rule: 'College: e.g. "B.Tech CSE"' },
  { key: 'academicYear', type: 'Text', rule: 'e.g. "2026-27"' },
  { key: 'parentName', type: 'Text' },
  { key: 'parentPhone', type: 'Phone', required: true, rule: '10–15 digits; spaces, dashes, +91 are fine' },
  { key: 'parentEmail', type: 'Email' },
  { key: 'address', type: 'Text', rule: 'Up to 2000 characters' },
  { key: 'city', type: 'Text' },
  { key: 'state', type: 'Text' },
  { key: 'pincode', type: 'Text', rule: 'Postal code' },
  { key: 'previousSchool', type: 'Text' },
  { key: 'previousClass', type: 'Text' },
  { key: 'referenceNumber', type: 'Text', rule: "Your own system's id for the applicant — sending it again returns the same application" },
];

const CUSTOM_TYPE_RULE = {
  TEXT: 'Up to 500 characters', TEXTAREA: 'Up to 5000 characters', NUMBER: 'A number', DATE: 'YYYY-MM-DD',
  EMAIL: 'A valid email', PHONE: '10–15 digits', SELECT: 'One of the options', CHECKBOX: 'true / false (a required one must be ticked)',
};

const ENDPOINTS = [
  { method: 'GET', path: '/form-schema', what: 'Your custom fields + the application fee — build the form from this' },
  { method: 'POST', path: '/submit', what: 'Send an application (JSON or a plain HTML form)' },
  { method: 'POST', path: '/status', what: 'Applicant checks progress: applicationNumber + parentPhone' },
  { method: 'POST', path: '/{id}/fee/initiate', what: 'Start the application-fee payment (returns order + orderToken)' },
  { method: 'POST', path: '/{id}/fee/verify', what: 'Confirm the payment (Razorpay ids + orderToken)' },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Recommended: a form that builds itself from /form-schema — every field you add and get
 * approved later shows up on the website on its own, with the same checks, show-when rules
 * and per-field error messages; takes the fee through Razorpay when one is set. */
const snippetAuto = (apiKey) => `<!-- SCOMS admission form — paste where the form should appear.
     It builds itself from your fields in SCOMS, so fields you add later appear automatically. -->
<div id="scoms-admission"></div>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function () {
  var API = '${ENDPOINT}';
  var KEY = '${apiKey || 'YOUR_API_KEY_HERE'}';
  var box = document.getElementById('scoms-admission');
  var STANDARD = [
    { key: 'studentFirstName', label: 'Student first name', type: 'text', required: true },
    { key: 'studentLastName', label: 'Student last name', type: 'text' },
    { key: 'dob', label: 'Date of birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['MALE', 'FEMALE', 'OTHER'] },
    { key: 'classAppliedFor', label: 'Class applied for', type: 'text' },
    { key: 'parentName', label: 'Parent name', type: 'text' },
    { key: 'parentPhone', label: 'Parent phone', type: 'tel', required: true },
    { key: 'parentEmail', label: 'Parent email', type: 'email' },
    { key: 'address', label: 'Address', type: 'textarea' }
  ];
  var TYPES = { TEXT: 'text', NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel', TEXTAREA: 'textarea', SELECT: 'select', CHECKBOX: 'checkbox' };

  function call(path, body) {
    return fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': KEY },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
  }

  function makeField(f) {
    var wrap = document.createElement('div');
    wrap.className = 'scoms-field';
    wrap.setAttribute('data-key', f.key);
    var label = document.createElement('label');
    label.textContent = f.label + (f.required ? ' *' : '');
    var input;
    if (f.type === 'select') {
      input = document.createElement('select');
      input.appendChild(new Option('Select...', ''));
      (f.options || []).forEach(function (o) { input.appendChild(new Option(o, o)); });
    } else if (f.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = f.type;
    }
    input.name = f.key;
    if (f.required) input.required = true;
    if (f.type === 'checkbox') { label.insertBefore(input, label.firstChild); wrap.appendChild(label); }
    else { wrap.appendChild(label); wrap.appendChild(input); }
    if (f.help) { var h = document.createElement('small'); h.textContent = f.help; wrap.appendChild(h); }
    var err = document.createElement('div');
    err.className = 'scoms-error';
    err.style.color = '#c00';
    wrap.appendChild(err);
    return wrap;
  }

  call('/form-schema').then(function (res) {
    if (!res.success) { box.textContent = res.message; return; }
    var custom = res.data.customFields.filter(function (f) { return !f.hidden; }).map(function (f) {
      return { key: f.fieldKey, label: f.label, type: TYPES[f.fieldType] || 'text', required: f.required,
               options: f.options, help: f.helpText, when: f.visibilityCondition };
    });
    var fee = res.data.applicationFeeAmount;
    var form = document.createElement('form');
    STANDARD.concat(custom).forEach(function (f) { form.appendChild(makeField(f)); });
    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.textContent = fee ? 'Submit and pay Rs. ' + fee : 'Submit application';
    var msg = document.createElement('p');
    form.appendChild(btn);
    form.appendChild(msg);
    box.appendChild(form);

    // fields that show only when another answer matches (set in SCOMS)
    function applyRules() {
      custom.forEach(function (f) {
        if (!f.when || !f.when.dependsOnFieldKey) return;
        var other = form.elements[f.when.dependsOnFieldKey];
        var v = other ? (other.type === 'checkbox' ? String(other.checked) : other.value) : '';
        var same = v.toLowerCase() === String(f.when.value).toLowerCase();
        var show = f.when.operator === 'not_equals' ? !same : same;
        form.querySelector('[data-key="' + f.key + '"]').style.display = show ? '' : 'none';
        form.elements[f.key].disabled = !show;
        form.elements[f.key].required = show && !!f.required;
      });
    }
    form.addEventListener('change', applyRules);
    applyRules();

    function done(text) { msg.textContent = text; btn.disabled = false; }

    function pay(app) {
      call('/' + app.id + '/fee/initiate', {}).then(function (o) {
        if (!o.success) return done('Application ' + app.applicationNumber + ' is saved, but the payment could not start: ' + o.message);
        var order = o.data;
        new Razorpay({
          key: order.key, amount: Math.round(order.amount * 100), currency: order.currency, order_id: order.orderId,
          description: 'Application fee ' + app.applicationNumber,
          handler: function (p) {
            call('/' + app.id + '/fee/verify', {
              razorpayOrderId: p.razorpay_order_id, razorpayPaymentId: p.razorpay_payment_id,
              razorpaySignature: p.razorpay_signature, orderToken: order.orderToken
            }).then(function (v) {
              if (v.success) { form.reset(); done('Payment received. Your application number is ' + app.applicationNumber); }
              else done('Payment could not be confirmed: ' + v.message + ' Please quote ' + app.applicationNumber + ' to the office.');
            });
          },
          modal: { ondismiss: function () { done('Application ' + app.applicationNumber + ' is saved. The fee is still due - press the button again to pay.'); } }
        }).open();
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('.scoms-error').forEach(function (d) { d.textContent = ''; });
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.disabled) return;
        data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      });
      btn.disabled = true;
      msg.textContent = 'Submitting...';
      call('/submit', data).then(function (r) {
        if (!r.success) {
          (r.errors || []).forEach(function (er) {
            var d = form.querySelector('[data-key="' + er.field + '"] .scoms-error');
            if (d) d.textContent = er.message;
          });
          return done(r.message);
        }
        var app = r.data;
        if (app.feeAmount && !app.feePaid) return pay(app);
        form.reset();
        done('Application received. Your application number is ' + app.applicationNumber);
      }).catch(function () { done('Could not reach the admission server. Please try again.'); });
    });
  });
})();
</script>`;

/** No JavaScript at all — the browser posts straight to SCOMS and is sent back to your own
 * thank-you / error page. Custom fields are written in as they are today. */
const snippetPlainHtml = (apiKey, customFields) => {
  const custom = customFields.filter((f) => !f.hidden).map((f) => {
    const req = f.required ? ' required' : '';
    const label = `${esc(f.label)}${f.required ? ' *' : ''}`;
    if (f.fieldType === 'SELECT') {
      const opts = (Array.isArray(f.options) ? f.options : []).map((o) => `<option>${esc(o)}</option>`).join('');
      return `  <label>${label} <select name="${esc(f.fieldKey)}"${req}><option value="">Select...</option>${opts}</select></label>`;
    }
    if (f.fieldType === 'CHECKBOX') return `  <label><input type="checkbox" name="${esc(f.fieldKey)}" value="true"${req} /> ${label}</label>`;
    if (f.fieldType === 'TEXTAREA') return `  <label>${label} <textarea name="${esc(f.fieldKey)}"${req}></textarea></label>`;
    const type = { NUMBER: 'number', DATE: 'date', EMAIL: 'email', PHONE: 'tel' }[f.fieldType] || 'text';
    return `  <label>${label} <input type="${type}" name="${esc(f.fieldKey)}"${req} /></label>`;
  }).join('\n');
  return `<!-- Plain HTML admission form — no JavaScript needed.
     After submitting, the applicant is sent to your successUrl with ?applicationNumber=...
     (and &feeDue=... if a fee is due), or to your errorUrl with ?error=...
     Fields you add in SCOMS later must be added here by hand — or use the "Auto form". -->
<form action="${ENDPOINT}/submit" method="POST">
  <input type="hidden" name="apiKey" value="${esc(apiKey || 'YOUR_API_KEY_HERE')}" />
  <input type="hidden" name="successUrl" value="https://your-school-website/thank-you" />
  <input type="hidden" name="errorUrl" value="https://your-school-website/apply-error" />

  <label>Student first name * <input name="studentFirstName" required /></label>
  <label>Student last name <input name="studentLastName" /></label>
  <label>Date of birth <input type="date" name="dob" /></label>
  <label>Gender <select name="gender"><option value="">Select...</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></label>
  <label>Class applied for <input name="classAppliedFor" /></label>
  <label>Parent name <input name="parentName" /></label>
  <label>Parent phone * <input type="tel" name="parentPhone" required /></label>
  <label>Parent email <input type="email" name="parentEmail" /></label>
${custom ? `${custom}\n` : ''}
  <button type="submit">Submit application</button>
</form>`;
};

/** From the school's own server (PHP / Node / CRM) — the key never reaches a browser. */
const snippetServer = (apiKey) => `# From your own server — keeps the API key private (recommended for CRMs / backends).
curl -X POST '${ENDPOINT}/submit' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Api-Key: ${apiKey || 'YOUR_API_KEY_HERE'}' \\
  -d '{
    "studentFirstName": "Asha",
    "studentLastName": "Kumar",
    "dob": "2015-06-01",
    "classAppliedFor": "Class 5",
    "parentPhone": "9876543210",
    "parentEmail": "parent@example.com",
    "referenceNumber": "YOUR-CRM-ID-123",
    "applicantIp": "203.0.113.10",
    "customFields": { "your_field_key": "value" }
  }'

# 201 -> new application   { "data": { "id", "applicationNumber", "feeAmount", "feePaid", "duplicate": false } }
# 200 -> already received  (same referenceNumber, or same student + phone within 10 minutes) "duplicate": true
# 400 -> problems          { "message", "errors": [ { "field", "message" }, ... ] }
# 401 -> wrong / missing API key      429 -> over 120 requests an hour from one server

# applicantIp (optional): the applicant's own IP, kept with the application for your records.

// ---- the same from Node.js 18+ ----
const res = await fetch('${ENDPOINT}/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': process.env.SCOMS_API_KEY },
  body: JSON.stringify(application),
});
const result = await res.json();`;

const snippetStatus = (apiKey) => `<!-- "Check my application" box for your website -->
<form id="scoms-status">
  <input name="applicationNumber" placeholder="Application number" required />
  <input name="parentPhone" placeholder="Parent phone used when applying" required />
  <button type="submit">Check status</button>
  <p id="scoms-status-result"></p>
</form>
<script>
document.getElementById('scoms-status').addEventListener('submit', function (e) {
  e.preventDefault();
  var out = document.getElementById('scoms-status-result');
  fetch('${ENDPOINT}/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': '${apiKey || 'YOUR_API_KEY_HERE'}' },
    body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
  }).then(function (r) { return r.json(); }).then(function (r) {
    if (!r.success) { out.textContent = r.message; return; }
    var a = r.data;
    out.textContent = a.studentName + ': ' + a.statusText
      + (a.feeAmount ? (a.feePaid ? ' - fee paid' : ' - fee of Rs. ' + a.feeAmount + ' due') : '');
  });
});
</script>`;

const SNIPPET_TABS = [
  { key: 'auto', label: 'Auto form (recommended)', note: 'Builds itself from your fields — new approved fields appear on your website automatically. Takes the fee online when one is set.' },
  { key: 'html', label: 'Plain HTML form', note: 'No JavaScript. Shows your current custom fields; add new ones by hand. The fee is not taken here — the thank-you page receives feeDue.' },
  { key: 'server', label: 'Server-to-server', note: 'For a school CRM or website backend — the API key stays private on your server.' },
  { key: 'status', label: 'Status check', note: 'Lets parents check progress with their application number and phone.' },
];

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
  const [customFields, setCustomFields] = useState([]);
  const [tab, setTab] = useState('auto');

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
    // the approved custom fields — what a website form may send besides the standard ones
    admissionCustomFieldService.getApproved().then((r) => setCustomFields(Array.isArray(r?.data) ? r.data : [])).catch(() => setCustomFields([]));
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

  const activeSnippet = {
    auto: () => snippetAuto(apiKey),
    html: () => snippetPlainHtml(apiKey, customFields),
    server: () => snippetServer(apiKey),
    status: () => snippetStatus(apiKey),
  }[tab]();
  const activeTab = SNIPPET_TABS.find((t) => t.key === tab);
  const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5';
  const th = 'text-left px-2.5 py-2 font-semibold text-slate-500 dark:text-slate-400';
  const td = 'px-2.5 py-2 align-top text-slate-700 dark:text-slate-300';

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
        <>
          <div className={card}>
            <div className="flex items-center gap-2 mb-1">
              <Plug className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Website API</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Send your API key as an <code className="font-mono">X-Api-Key</code> header (or an <code className="font-mono">apiKey</code> form field). Every application lands straight in your Applications list, and Institute Admins get a notification.
            </p>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
                {ENDPOINT}
              </code>
              <button onClick={() => copy(ENDPOINT, 'endpoint')} className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Copy">
                {copied === 'endpoint' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
              <table className="w-full text-[11px]">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ENDPOINTS.map((e) => (
                    <tr key={e.path}>
                      <td className={`${td} font-mono font-bold whitespace-nowrap`}>{e.method}</td>
                      <td className={`${td} font-mono whitespace-nowrap`}>{e.path}</td>
                      <td className={td}>{e.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Limits: 600 form-schema calls and 120 submissions an hour from one server. A repeat (same referenceNumber, or same student + phone within 10 minutes) returns the first application instead of a copy.
            </p>
          </div>

          <div className={card}>
            <div className="flex items-center gap-2 mb-1">
              <ListChecks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Form Fields</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Use these exact names. Every value is checked by its type; a wrong submission gets back a list of every problem (<code className="font-mono">errors: [{'{'} field, message {'}'}]</code>) so the website can show each one beside its input.
            </p>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr><th className={th}>Field name</th><th className={th}>Type</th><th className={th}>Required</th><th className={th}>Rule</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {STANDARD_FIELDS.map((f) => (
                    <tr key={f.key}>
                      <td className={`${td} font-mono`}>{f.key}</td>
                      <td className={td}>{f.type}</td>
                      <td className={td}>{f.required ? 'Yes' : '—'}</td>
                      <td className={td}>{f.rule || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <td colSpan={4} className="px-2.5 py-1.5 font-semibold text-slate-500 dark:text-slate-400">
                      Your custom fields (approved) — send as <span className="font-mono">customFields: {'{'} key: value {'}'}</span>, or simply as <span className="font-mono">key</span>
                    </td>
                  </tr>
                  {customFields.length === 0 ? (
                    <tr><td colSpan={4} className={`${td} text-slate-400`}>None yet. Fields you add under Admission Form Fields appear here (and in the Auto form) once approved.</td></tr>
                  ) : customFields.map((f) => (
                    <tr key={f.fieldKey}>
                      <td className={`${td} font-mono`}>{f.fieldKey}<div className="font-sans text-slate-400">{f.label}{f.hidden ? ' · hidden' : ''}</div></td>
                      <td className={td}>{f.fieldType}</td>
                      <td className={td}>{f.required ? (f.visibilityCondition?.dependsOnFieldKey ? 'When shown' : 'Yes') : '—'}</td>
                      <td className={td}>
                        {f.fieldType === 'SELECT' && Array.isArray(f.options) ? `One of: ${f.options.join(', ')}` : CUSTOM_TYPE_RULE[f.fieldType] || '—'}
                        {f.visibilityCondition?.dependsOnFieldKey && (
                          <div className="text-slate-400">Shown when {f.visibilityCondition.dependsOnFieldKey} {f.visibilityCondition.operator === 'not_equals' ? 'is not' : 'is'} “{String(f.visibilityCondition.value)}”</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ready-to-Paste Code</h2>
              </div>
              <button onClick={() => copy(activeSnippet, 'snippet')} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                {copied === 'snippet' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SNIPPET_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{activeTab?.note}</p>
            <pre className="p-3.5 bg-slate-900 dark:bg-black rounded-lg text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
              {activeSnippet}
            </pre>
            <p className="text-[10px] text-slate-400 mt-2">
              The key in browser code is visible to visitors — that's expected: it can only submit applications and check status for your institution. Regenerate it any time; use Server-to-server to keep it private.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default PreAdmissionSettingsPage;
