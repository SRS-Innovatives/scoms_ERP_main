import React, { useState } from 'react';
import StudentTable from '../../components/common/StudentTable';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { mockStudentsList } from '../../data/mockStaffData';
import { useNavigate } from 'react-router-dom';

export const StudentListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const filtered = mockStudentsList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search);
    return matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Student Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Complete student roster for assigned sections.</p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search student by name or roll number..."
        filterOptions={[
          { value: 'All', label: 'All Classes' },
          { value: 'Class 12-A', label: 'Class 12-A' },
          { value: 'Class 11-B', label: 'Class 11-B' }
        ]}
        filterValue={filterClass}
        onFilterChange={setFilterClass}
      />

      <StudentTable
        students={filtered}
        onViewProfile={() => navigate('/staff/performance/progress')}
        onContactParent={() => navigate('/staff/communication/parent-messages')}
      />
    </div>
  );
};

export default StudentListPage;
