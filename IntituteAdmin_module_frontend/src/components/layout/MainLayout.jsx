import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';

export const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Body Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Sticky Header Navbar */}
        <Navbar
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onToggleMobile={() => setIsMobileOpen(true)}
        />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumbs />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Pages are lazy-loaded (routes/AppRoutes.jsx): keep the sidebar/navbar on
              screen and show a spinner only in the content area while a page downloads */}
          <Suspense
            fallback={(
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            )}
          >
            <Outlet />
          </Suspense>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
