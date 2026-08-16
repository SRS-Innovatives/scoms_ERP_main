import React, { useState } from 'react';
import Topbar from './Topbar';
import StudentSidebar from './StudentSidebar';
import MobileBottomNav from './MobileBottomNav';
import Breadcrumb from './Breadcrumb';
import Footer from './Footer';

export const StudentLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <StudentSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Breadcrumb />
          {children}
        </main>

        <Footer />
      </div>

      <MobileBottomNav onOpenDrawer={() => setSidebarOpen(true)} />
    </div>
  );
};

export default StudentLayout;
