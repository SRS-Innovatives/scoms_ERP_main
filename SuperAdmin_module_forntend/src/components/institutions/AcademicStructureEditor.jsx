import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import Select from '../common/Select';

/**
 * Edits an institution's academicConfig (only its overrides of the type's defaults) for
 * the onboarding wizard and the institution edit form. Every default, option list and
 * level order comes from the backend catalog (shared/academic/academicStructure.js) — this
 * component holds no school/college rules of its own. The backend re-validates and
 * normalizes whatever is sent.
 */

export const INSTITUTION_TYPE_OPTIONS = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'AUTONOMOUS_COLLEGE', label: 'Autonomous College' },
  { value: 'UNIVERSITY', label: 'University' },
];

const LEVEL_TITLES = {
  faculty: 'Faculty / School level',
  program: 'Program level',
  batch: 'Admission Batch level',
};

const LABEL_TITLES = {
  faculty: 'Faculty / School',
  department: 'Department',
  program: 'Program',
  course: 'Course / Standard',
  batch: 'Batch',
  semester: 'Semester / Term',
  section: 'Section',
  subject: 'Subject',
  academicYear: 'Academic Year',
  classTeacher: 'Class Teacher / Advisor',
  teacher: 'Teacher / Faculty member',
};

const GRADING_LABELS = { MARKS: 'Marks / Percentage', GRADES: 'Letter Grades', CGPA: 'Credits & CGPA' };
const AUTHORITY_LABELS = {
  BOARD: 'School Board (CBSE / State Board etc.)',
  AFFILIATING_UNIVERSITY: 'Affiliating University',
  INSTITUTION: 'This Institution (self-governed)',
};

/** Effective structure for the live preview: catalog defaults + the overrides being edited. */
export const previewAcademicStructure = (catalog, type, config = {}) => {
  const defaults = catalog?.types?.[type];
  if (!defaults) return null;
  const levels = { ...defaults.levels, ...(config.levels || {}) };
  const periodType = config.periodType || defaults.periodType;
  const periodLabel = catalog.periodTypes.find((p) => p.value === periodType)?.label;
  const labels = { ...defaults.labels, ...(periodLabel && { semester: periodLabel }) };
  Object.entries(config.labels || {}).forEach(([k, v]) => { if (v && v.trim()) labels[k] = v.trim(); });
  return {
    ...defaults,
    levels,
    periodType,
    labels,
    hierarchy: catalog.levelOrder.filter((k) => levels[k]),
    regulations: { ...defaults.regulations, ...(defaults.regulationsConfigurable ? config.regulations || {} : {}) },
  };
};

const inputClass = 'w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200';

export const AcademicStructureEditor = ({ catalog, type, value = {}, onChange }) => {
  if (!catalog) return <p className="text-xs text-slate-400">Loading academic structure options...</p>;
  const defaults = catalog.types[type];
  if (!defaults) return <p className="text-xs text-slate-500">Pick an Institution Type in Step 1 to configure its academic structure.</p>;

  const preview = previewAcademicStructure(catalog, type, value);
  const update = (section, key, v) => onChange({ ...value, [section]: { ...(value[section] || {}), [key]: v } });

  return (
    <div className="space-y-5">
      {/* Hierarchy preview */}
      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900">
        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 mb-2">Academic hierarchy</p>
        <div className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <span>Institution</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span>{preview.labels.academicYear}</span>
          {preview.hierarchy.map((level) => (
            <React.Fragment key={level}>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>{preview.labels[level]}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Optional levels */}
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Levels in use</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {catalog.optionalLevels.map((level) => (
            <label key={level} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-indigo-600"
                checked={Boolean(preview.levels[level])}
                onChange={(e) => update('levels', level, e.target.checked)}
              />
              {LEVEL_TITLES[level] || level}
            </label>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Department, Course/Standard, Semester/Term, Section and Subject are always used. Turning a level off only hides it — no records are deleted.</p>
      </div>

      {/* Period type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Academic period"
          required
          value={preview.periodType}
          onChange={(v) => onChange({ ...value, periodType: v })}
          options={catalog.periodTypes}
        />
      </div>

      {/* Terminology */}
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Terminology</p>
        <p className="text-[10px] text-slate-400 mb-2">Leave blank to use the default shown. These names appear across the Institute Admin, Staff and Student portals.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {catalog.labelKeys
            .filter((key) => !['faculty', 'program', 'batch'].includes(key) || preview.levels[key])
            .map((key) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">{LABEL_TITLES[key] || key}</label>
                <input
                  className={inputClass}
                  maxLength={40}
                  value={value.labels?.[key] || ''}
                  placeholder={preview.labels[key]}
                  onChange={(e) => update('labels', key, e.target.value)}
                />
              </div>
            ))}
        </div>
      </div>

      {/* Regulations */}
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Academic regulations</p>
        {defaults.regulationsConfigurable ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Grading scheme"
                required
                value={preview.regulations.gradingScheme}
                onChange={(v) => update('regulations', 'gradingScheme', v)}
                options={catalog.gradingSchemes.map((g) => ({ value: g, label: GRADING_LABELS[g] || g }))}
              />
              <Select
                label="Examination authority"
                required
                value={preview.regulations.examAuthority}
                onChange={(v) => update('regulations', 'examAuthority', v)}
                options={catalog.examAuthorities.map((a) => ({ value: a, label: AUTHORITY_LABELS[a] || a }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600" checked={Boolean(preview.regulations.creditsEnabled)} onChange={(e) => update('regulations', 'creditsEnabled', e.target.checked)} />
                Subjects carry credits
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600" checked={Boolean(preview.regulations.internalAssessmentEnabled)} onChange={(e) => update('regulations', 'internalAssessmentEnabled', e.target.checked)} />
                Internal assessment
              </label>
              {preview.regulations.internalAssessmentEnabled && (
                <label className="flex items-center gap-2">
                  Internal weight (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={`${inputClass} w-20`}
                    value={preview.regulations.internalAssessmentWeight}
                    onChange={(e) => update('regulations', 'internalAssessmentWeight', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </label>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Institution-defined regulations (optional)</label>
              <textarea
                rows={3}
                maxLength={2000}
                className={inputClass}
                value={value.regulations?.notes || ''}
                placeholder="e.g. Minimum 75% attendance to sit end-semester exams; 40% pass mark per subject"
                onChange={(e) => update('regulations', 'notes', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Regulations follow the {AUTHORITY_LABELS[defaults.regulations.examAuthority] || defaults.regulations.examAuthority}
            {' '}({GRADING_LABELS[defaults.regulations.gradingScheme]}). Choose Autonomous College or University to configure them.
          </p>
        )}
      </div>
    </div>
  );
};

/** Client-side checks mirroring the backend's, so the wizard can block Next early. */
export const validateAcademicConfig = (catalog, type, config = {}) => {
  const errors = [];
  if (!catalog?.types?.[type]) return errors;
  const w = config.regulations?.internalAssessmentWeight;
  if (catalog.types[type].regulationsConfigurable && w !== undefined && w !== '' && (!Number.isInteger(Number(w)) || w < 0 || w > 100)) {
    errors.push('Internal assessment weight must be a whole number from 0 to 100');
  }
  return errors;
};

export default AcademicStructureEditor;
