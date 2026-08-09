import React, { useState } from 'react';
import DataTable from '../../components/common/DataTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { courses as initialCourses } from '../../data/mockData';
import { useNotification } from '../../context/NotificationContext';

export const CourseClassSetupPage = () => {
  const { notifySuccess } = useNotification();
  const [search, setSearch] = useState('');
  const [coursesList] = useState(initialCourses);

  const columns = [
    { header: 'Course Code', key: 'code', render: (val) => <span className="font-mono font-bold text-indigo-600">{val}</span> },
    { header: 'Course Name', key: 'name', render: (val) => <span className="font-bold text-slate-900 dark:text-white">{val}</span> },
    { header: 'Department', key: 'dept' },
    { header: 'Degree / Type', key: 'type' },
    { header: 'Duration', key: 'duration' },
    { header: 'Sanctioned Seats', key: 'totalSeats', render: (val) => `${val} Seats` },
    { header: 'Annual Fees', key: 'feesPerYear', render: (val) => <span className="font-mono font-bold">₹{val.toLocaleString()}</span> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Course & Class Setup</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure UG/PG degree programs, classes, seat capacity, and annual fee structure</p>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search courses..."
        addLabel="Add New Course"
        onAddClick={() => notifySuccess('Add Course Modal')}
      />

      <DataTable columns={columns} data={coursesList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))} />
    </div>
  );
};

export default CourseClassSetupPage;
