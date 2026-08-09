import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import FormSection from '../../components/common/FormSection';
import { Sun, Moon, Palette } from 'lucide-react';

export const ThemeSettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Portal Appearance & Color Themes</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Glassmorphism card effects, accent colors & dark/light mode toggle</p>
      </div>

      <FormSection title="Theme Preference" icon={Palette}>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            <span>Switch to {theme === 'light' ? 'Dark Mode' : 'Light Mode'} (Currently {theme.toUpperCase()})</span>
          </button>
        </div>
      </FormSection>
    </div>
  );
};

export default ThemeSettingsPage;
