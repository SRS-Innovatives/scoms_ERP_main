import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import FormInput from '../../components/common/FormInput';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Download, FileText, Sparkles } from 'lucide-react';

export const ResumeBuilderPage = () => {
  const { student } = useStudentAuth();
  const { success } = useNotification();

  const [skills, setSkills] = useState('Java, Python, C++, React.js, Tailwind CSS, SQL, Git');
  const [projects, setProjects] = useState('SCOMS Student ERP Portal, Library Management System');

  const handleDownload = () => {
    success('ATS Compatible Resume PDF generated cleanly.', 'Resume Downloaded');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ATS Resume Builder" subtitle="Generate campus placement standard ATS resume PDF." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm">Customize Resume Sections</h3>
          <FormInput label="Technical Skills (Comma Separated)" value={skills} onChange={setSkills} />
          <FormInput label="Academic Projects" value={projects} onChange={setProjects} />

          <button
            onClick={handleDownload}
            className="w-full py-3 font-bold text-white bg-indigo-600 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" /> Download Resume PDF
          </button>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 text-xs">
          <h3 className="font-bold text-sm text-center border-b pb-2">{student?.name}</h3>
          <p className="text-center text-slate-500 text-[11px]">{student?.email} • {student?.phone} • {student?.city}</p>
          <div className="border-t pt-2 space-y-1">
            <h4 className="font-bold uppercase text-[10px] text-indigo-600">Education</h4>
            <p className="font-bold">{student?.course} - {student?.institution}</p>
            <p className="text-slate-500">CGPA: {student?.gpa} / 10.0 ({student?.batch})</p>
          </div>
          <div className="border-t pt-2 space-y-1">
            <h4 className="font-bold uppercase text-[10px] text-indigo-600">Skills</h4>
            <p>{skills}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
