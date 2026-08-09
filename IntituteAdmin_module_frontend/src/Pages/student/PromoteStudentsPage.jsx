import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { studentsList } from '../../data/mockData';

export const PromoteStudentsPage = () => {
  const { notifySuccess } = useNotification();
  const [selectedIds, setSelectedIds] = useState([]);
  const [fromSem, setFromSem] = useState('Semester 5');
  const [toSem, setToSem] = useState('Semester 6');

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Current Sem', key: 'yearSem' },
    { header: 'Attendance %', key: 'id', render: () => <span className="font-mono font-bold text-emerald-600">94.8%</span> },
    { header: 'Exam Result', key: 'id', render: () => <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">PASSED</span> }
  ];

  const handlePromote = () => {
    notifySuccess(`Promoted ${selectedIds.length || studentsList.length} students from ${fromSem} to ${toSem}!`, 'Promotion Complete');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Batch Promotion Module</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Bulk promote eligible students to the next semester/academic year after result publication</p>
      </div>

      <FormSection title="Select Semester Transition" subtitle="Map current semester to target promoted semester">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">From Semester</label>
            <select value={fromSem} onChange={(e) => setFromSem(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium">
              <option value="Semester 5">Semester 5 (Current)</option>
              <option value="Semester 3">Semester 3</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Promote To Semester</label>
            <select value={toSem} onChange={(e) => setToSem(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg font-medium">
              <option value="Semester 6">Semester 6 (Next Term)</option>
              <option value="Semester 4">Semester 4</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePromote}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Promote Selected Students</span>
            </button>
          </div>
        </div>
      </FormSection>

      <DataTable
        selectable
        selectedIds={selectedIds}
        onSelectRow={(id, checked) => {
          if (checked) setSelectedIds([...selectedIds, id]);
          else setSelectedIds(selectedIds.filter((x) => x !== id));
        }}
        columns={columns}
        data={studentsList}
      />
    </div>
  );
};

export default PromoteStudentsPage;
