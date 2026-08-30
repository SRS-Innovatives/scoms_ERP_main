import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';
import ComposeMessageModal from '../modals/ComposeMessageModal';

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Breadcrumbs />
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Compose Message Global Modal */}
      <ComposeMessageModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
};

export default MainLayout;
