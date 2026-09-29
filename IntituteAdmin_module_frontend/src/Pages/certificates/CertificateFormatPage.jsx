import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, FileCheck, RotateCcw, Save, Info } from 'lucide-react';
import certificateTemplateService from '../../services/certificateTemplateService';
import { useInstitution } from '../../context/InstitutionContext';
import { useNotification } from '../../context/NotificationContext';
import ErrorState from '../../components/common/ErrorState';

/**
 * Certificate Format Customization — the certificate-module equivalent of the Report
 * Engine's dynamic configuration screen. Every certificate type's wording, header,
 * footer, signatory and branding is a database row (CertificateTemplate +
 * InstitutionCertificateTemplate), never hardcoded JSX — this page edits that
 * configuration and every future certificate generated from this template picks it up.
 */
export const CertificateFormatPage = () => {
  const { error: showError, success } = useNotification();
  const { institution } = useInstitution();
  const [catalog, setCatalog] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const fetchCatalog = useCallback(() => {
    setLoadingCatalog(true);
    setCatalogError(false);
    certificateTemplateService.getCatalog()
      .then((res) => {
        const list = res.data || [];
        setCatalog(list);
        if (list.length > 0) setSelectedCode(list[0].code);
      })
      .catch((err) => { showError(`Failed to load certificate catalog: ${err.message}`); setCatalogError(true); })
      .finally(() => setLoadingCatalog(false));
  }, [showError]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  useEffect(() => {
    if (!selectedCode) return;
    setLoadingFormat(true);
    certificateTemplateService.getFormatSettings(selectedCode)
      .then((res) => setForm(res.data))
      .catch((err) => showError(`Failed to load format settings: ${err.message}`))
      .finally(() => setLoadingFormat(false));
  }, [selectedCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await certificateTemplateService.updateFormatSettings(selectedCode, {
        enabled: form.enabled,
        customHeaderTitle: form.customHeaderTitle,
        customBodyTemplate: form.customBodyTemplate,
        customFooterNote: form.customFooterNote,
        showLogo: form.showLogo,
        showSeal: form.showSeal,
        showSignature: form.showSignature,
        signatoryName: form.signatoryName,
        signatoryDesignation: form.signatoryDesignation,
        issuePlace: form.issuePlace,
      });
      success('Certificate format saved — every certificate generated from now on will use it.');
    } catch (err) {
      showError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await certificateTemplateService.resetFormatSettings(selectedCode);
      const res = await certificateTemplateService.getFormatSettings(selectedCode);
      setForm(res.data);
      success('Wording reset to the SCOMS default for this certificate type.');
    } catch (err) {
      showError(`Failed to reset: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingCatalog) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (catalogError) {
    return <ErrorState onRetry={fetchCatalog} />;
  }

  const selectedMeta = catalog.find((c) => c.code === selectedCode);
  const previewHeader = form?.customHeaderTitle || form?.defaultHeaderTitle;
  const previewBody = form?.customBodyTemplate || form?.defaultBodyTemplate;
  const previewFooter = form?.customFooterNote || form?.defaultFooterNote;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-500" /> Customize Certificate Format
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Rewrite the wording, header, footer, and signatory for each certificate type your institution issues.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {catalog.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCode(c.code)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
              selectedCode === c.code ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {c.name}{c.isCustomized && <span className="ml-1 opacity-70">•</span>}
          </button>
        ))}
      </div>

      {loadingFormat || !form ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Header Title</label>
              <input
                type="text"
                value={form.customHeaderTitle}
                onChange={(e) => handleField('customHeaderTitle', e.target.value)}
                placeholder={form.defaultHeaderTitle}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Certificate Wording</label>
              <textarea
                rows={6}
                value={form.customBodyTemplate}
                onChange={(e) => handleField('customBodyTemplate', e.target.value)}
                placeholder={form.defaultBodyTemplate}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-serif"
              />
              <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Use <code className="font-mono">{'{{fieldKey}}'}</code> placeholders — they're filled in with the real student's data when a certificate is generated. Leave blank to keep the default wording shown above.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Footer Note</label>
              <input
                type="text"
                value={form.customFooterNote}
                onChange={(e) => handleField('customFooterNote', e.target.value)}
                placeholder={form.defaultFooterNote}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Signatory Name</label>
                <input type="text" value={form.signatoryName} onChange={(e) => handleField('signatoryName', e.target.value)} placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Signatory Designation</label>
                <input type="text" value={form.signatoryDesignation} onChange={(e) => handleField('signatoryDesignation', e.target.value)} placeholder="e.g. Principal"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Issue Place</label>
                <input type="text" value={form.issuePlace} onChange={(e) => handleField('issuePlace', e.target.value)} placeholder="e.g. New Delhi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.showLogo} onChange={(e) => handleField('showLogo', e.target.checked)} /> Show Logo
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.showSeal} onChange={(e) => handleField('showSeal', e.target.checked)} /> Show Seal
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.showSignature} onChange={(e) => handleField('showSignature', e.target.checked)} /> Show Signature
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.enabled} onChange={(e) => handleField('enabled', e.target.checked)} /> Enabled for Students
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Format
              </button>
              <button onClick={handleReset} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 disabled:opacity-50">
                <RotateCcw className="w-3.5 h-3.5" /> Reset Wording to Default
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white text-slate-900 border-4 border-double border-slate-900 rounded-xl p-8 shadow-md h-fit">
            <div className="text-center border-b border-slate-300 pb-3 mb-6">
              {form.showLogo && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">{institution?.name || 'SCOMS'}</p>
              )}
              <h3 className="text-lg font-black uppercase tracking-wide">{previewHeader}</h3>
            </div>
            <p className="text-sm leading-relaxed font-serif text-justify">{previewBody}</p>
            {previewFooter && <p className="text-[10px] text-slate-500 mt-6 italic">{previewFooter}</p>}

            <div className="flex items-end justify-between mt-12 text-xs">
              <div>
                <p className="text-slate-600">Place: <span className="font-bold">{form.issuePlace || '—'}</span></p>
                <p className="text-slate-600">Date: <span className="font-bold">DD/MM/YYYY</span></p>
              </div>
              {form.showSeal && (
                <div className="w-16 h-14 border border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 font-mono">[SEAL]</div>
              )}
              {form.showSignature && (
                <div className="text-center">
                  <p className="border-t border-slate-900 w-36 pt-1 font-bold text-xs">{form.signatoryDesignation || selectedMeta?.name || 'Authorized Signatory'}</p>
                  <p className="text-[10px] text-slate-500">{form.signatoryName || ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateFormatPage;
