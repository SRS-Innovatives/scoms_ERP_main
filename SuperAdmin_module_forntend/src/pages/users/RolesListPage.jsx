import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import CreateRoleModal from '../../components/modals/CreateRoleModal';
import { ShieldCheck, Loader2 } from 'lucide-react';
import userService from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';

export const RolesListPage = () => {
  const { error: showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await userService.getRoles();
      if (res?.data) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error("Failed to load roles list", err);
      showError("Could not retrieve RBAC system roles.", "Loading Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC)"
        subtitle="Configure platform administrative roles and view real-time tenant/user assignments."
        actionLabel="Create Custom Role"
        onAction={() => setModalOpen(true)}
        badge={`${roles.length} Active Roles`}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {roles.map((role, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all duration-350 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {role.usersCount} {role.usersCount === 1 ? 'User' : 'Users'} Assigned
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-50">{role.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{role.desc}</p>
              </div>
              <div className="pt-2">
                <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-55/10 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  ROLE: {role.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateRoleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RolesListPage;
