import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Settings, Cpu, ShieldCheck, ShieldAlert, Key, Loader2, Save } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import aiService from '../../services/aiService';
import ErrorState from '../../components/common/ErrorState';

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o mini — fast & cheap, recommended for a student tutor' },
  { value: 'gpt-4o', label: 'GPT-4o — higher quality, higher cost' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo — cheapest, older model' },
];

export const AiConfigPage = () => {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.3);
  const [apiKey, setApiKey] = useState('');

  const load = () => {
    setLoading(true);
    setError(false);
    aiService.getAiConfig()
      .then((res) => {
        setConfig(res.data);
        setModel(res.data.model);
        setTemperature(res.data.temperature);
      })
      .catch((err) => { showError(`Failed to load AI configuration: ${err.message}`); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // A blank key field means "leave the existing key untouched" — the backend never
      // clears a real, working key just because this form re-saved without re-typing it.
      await aiService.updateAiConfig({ provider: 'openai', model, temperature, ...(apiKey.trim() && { apiKey: apiKey.trim() }) });
      success('AI configuration saved — this powers the AI Study Tutor for every institution.');
      setApiKey('');
      load();
    } catch (err) {
      showError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="AI Provider Configuration" subtitle="One real OpenAI key powers the AI Study Tutor for every institution — usage & cost tracked per tenant on the Usage page" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-900">
        <StatCard title="Provider" value="OpenAI" subtitle={config.model} icon={Cpu} color="indigo" />
        <StatCard
          title="API Key Status"
          value={config.apiKeyConfigured ? 'Configured' : 'Not Configured'}
          subtitle={config.apiKeyConfigured ? 'AI Tutor answers for real' : 'AI Tutor is simulating answers'}
          icon={config.apiKeyConfigured ? ShieldCheck : ShieldAlert}
          color={config.apiKeyConfigured ? 'emerald' : 'rose'}
        />
        <StatCard title="Temperature" value={config.temperature} subtitle="Answer creativity/randomness" icon={Settings} color="indigo" />
      </div>

      {!config.apiKeyConfigured && (
        <div className="glass-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
          No real API key is set yet — every institution's AI Study Tutor is currently returning a clearly-labeled simulated placeholder instead of a real answer. Add a real OpenAI key below to switch it on for everyone.
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">OpenAI Provider Details</h3>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {MODEL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
              OpenAI API Key {config.apiKeyConfigured && <span className="text-emerald-600 font-normal">(a key is already set — leave blank to keep it)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.apiKeyConfigured ? '••••••••••••••••••••' : 'sk-...'}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
            <p className="text-[10px] font-normal text-slate-400 mt-1">Get a key from platform.openai.com — never shown back once saved, only whether one is configured.</p>
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Temperature ({temperature})</label>
            <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full h-8" />
            <p className="text-[10px] font-normal text-slate-400 mt-1">Lower = more focused/consistent answers (recommended for a study tutor). Higher = more creative/varied.</p>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiConfigPage;
