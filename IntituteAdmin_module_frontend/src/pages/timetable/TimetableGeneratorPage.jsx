import React, { useState } from 'react';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Cpu, CheckCircle } from 'lucide-react';

export const TimetableGeneratorPage = () => {
  const { notifySuccess } = useNotification();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      notifySuccess('Conflict-free Timetable generated successfully using AI Constraint Solver algorithm!', 'Generator Success');
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Automated Timetable Generator UI</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered conflict resolution generator for subjects, faculty workload & room availability</p>
      </div>

      <FormSection title="Timetable Generation Parameters" subtitle="Specify constraints & rules for conflict-free scheduling" icon={Cpu}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Academic Semester</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
              <option>Even Semester 2025-26 (Sem 2, 4, 6, 8)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Max Theory Hours / Day</label>
            <input type="number" defaultValue={4} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-medium" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Consecutive Lab Periods</label>
            <input type="number" defaultValue={3} className="w-full p-2.5 bg-slate-50 border rounded-lg font-mono font-medium" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Faculty Overlap Prevention</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
              <option>Strict Constraint (Zero Faculty Overlaps)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Solving Constraints...' : 'Generate Automated Timetable'}</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default TimetableGeneratorPage;
