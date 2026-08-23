import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { Settings, Cpu, ShieldCheck, Key, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AiConfigPage = () => {
  const { success } = useNotification();
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('sk-proj-**********************');
  const [temperature, setTemperature] = useState(0.3);
  const [features, setFeatures] = useState({
    grading: true,
    assistant: true,
    reporting: false,
  });

  const handleSave = (e) => {
    e.preventDefault();
    success('AI Model configurations saved successfully!');
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <PageHeader title="AI Provider Configurations" subtitle="Select default LLM engines, manage API keys, temperature limits, and toggle feature modules" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-900">
        <StatCard title="Default Model" value="GPT-4o" subtitle="OpenAI Core Engine" icon={Cpu} color="indigo" />
        <StatCard title="API Key Status" value="Configured" subtitle="Active Connection" icon={ShieldCheck} color="emerald" />
        <StatCard title="Token Capping" value="100k / min" subtitle="Rate Limit Active" icon={Settings} color="indigo" />
        <StatCard title="Total Modules" value="3 Features" subtitle="2 Active, 1 Inactive" icon={Cpu} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurations Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Key className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">LLM Provider Details</h3>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">AI Provider Service</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="openai">OpenAI (GPT-4o / GPT-3.5)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Provider API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Model Temperature ({temperature})</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={temperature} 
                onChange={(e) => setTemperature(parseFloat(e.target.value))} 
                className="w-full h-8"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Max Response Tokens</label>
              <input type="number" defaultValue="2048" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Save Configurations
              </button>
            </div>
          </form>
        </div>

        {/* Feature Switches */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">AI Modules Activation</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">AI Exam Question Generator</h4>
                <p className="text-[10px] text-slate-500">Auto-create exams from course materials</p>
              </div>
              <button onClick={() => setFeatures({ ...features, grading: !features.grading })}>
                {features.grading ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">AI Grading & Feedback Assistant</h4>
                <p className="text-[10px] text-slate-500">Auto-evaluate subjective answers</p>
              </div>
              <button onClick={() => setFeatures({ ...features, assistant: !features.assistant })}>
                {features.assistant ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300">AI Institution Report Summarizer</h4>
                <p className="text-[10px] text-slate-500">Summarize attendance & financial trends</p>
              </div>
              <button onClick={() => setFeatures({ ...features, reporting: !features.reporting })}>
                {features.reporting ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiConfigPage;
