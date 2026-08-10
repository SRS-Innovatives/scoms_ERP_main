import React from 'react';
import AssignmentCard from '../../components/common/AssignmentCard';
import { mockAssignments } from '../../data/mockStaffData';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignmentListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Class Assignments Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage active, evaluating, and archived student homework.</p>
        </div>
        <button
          onClick={() => navigate('/staff/assignments/create')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockAssignments.map((asn) => (
          <AssignmentCard
            key={asn.id}
            assignment={asn}
            onEvaluateClick={() => navigate('/staff/assignments/evaluate')}
            onViewDetails={() => navigate('/staff/assignments/details')}
          />
        ))}
      </div>
    </div>
  );
};

export default AssignmentListPage;
