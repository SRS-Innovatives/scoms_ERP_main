import React, { useState, useEffect } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SuperAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN')) {
      navigate('/super-admin/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN')) {
    return null; // Don't render content for unauthorized users
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Breadcrumb />
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SuperAdminLayout;
