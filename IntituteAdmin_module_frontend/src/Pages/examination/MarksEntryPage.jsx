import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import FormSection from '../../components/common/FormSection';
import { useNotification } from '../../context/NotificationContext';
import { Save, CheckCircle2 } from 'lucide-react';
import { studentsList } from '../../data/mockData';

export const MarksEntryPage = () => {
  const { notifySuccess } = useNotification();
  const [marksData, setMarksData] = useState(
    studentsList.map((s) => ({ ...s, cat1Marks: 88, cat2Marks: 92, assignmentMarks: 10, totalInternal: 47 }))
  );

  const columns = [
    { header: 'Roll No', key: 'rollNo', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Student Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    {
      header: 'CAT-1 (Max 50)',
      key: 'cat1Marks',
      render: (val, row) => (
        <input
          type="number"
          defaultValue={val}
          className="w-16 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-center text-xs"
        />
      )
    },
    {
      header: 'CAT-2 (Max 50)',
      key: 'cat2Marks',
      render: (val, row) => (
        <input
          type="number"
          defaultValue={val}
          className="w-16 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-center text-xs"
        />
      )
    },
    {
      header: 'Assignment (Max 10)',
      key: 'assignmentMarks',
      render: (val, row) => (
        <input
          type="number"
          defaultValue={val}
          className="w-16 p-1.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-bold text-center text-xs"
        />
      )
    },
    { header: 'Total Internal (Max 50)', key: 'totalInternal', render: (val) => <span className="font-mono font-bold text-emerald-600">{val} / 50</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Marks Entry Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enter Internal Assessment (CAT-1, CAT-2, Assignments & Attendance marks)</p>
        </div>

        <button
          onClick={() => notifySuccess('Marks saved and locked for COE verification!')}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>Save & Lock Marks</span>
        </button>
      </div>

      <FormSection title="Select Course Subject & Class">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Subject</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
              <option>CS8601 - Mobile Computing</option>
              <option>CS8602 - Compiler Design</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Class Section</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
              <option>3rd Year CSE - Section A</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Assessment Type</label>
            <select className="w-full p-2.5 bg-slate-50 border rounded-lg font-medium">
              <option>Continuous Assessment Test 1 & 2</option>
            </select>
          </div>
        </div>
      </FormSection>

      <DataTable columns={columns} data={marksData} />
    </div>
  );
};

export default MarksEntryPage;
