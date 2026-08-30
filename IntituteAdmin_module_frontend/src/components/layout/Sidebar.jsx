import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, X, Building2 } from 'lucide-react';
import { navigationConfig } from '../../routes/navigationConfig';
import { useInstitution } from '../../context/InstitutionContext';

export const Sidebar = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { institution, isModuleEnabled } = useInstitution();
  const visibleNavigation = navigationConfig.filter((item) => isModuleEnabled(item.key));
  const [openMenus, setOpenMenus] = useState({
    setup: location.pathname.includes('/admin/setup'),
    student: location.pathname.includes('/admin/student'),
    staff: location.pathname.includes('/admin/staff'),
    attendance: location.pathname.includes('/admin/attendance'),
    fee: location.pathname.includes('/admin/fee'),
    examination: location.pathname.includes('/admin/examination'),
    timetable: location.pathname.includes('/admin/timetable'),
    communication: location.pathname.includes('/admin/communication'),
    library: location.pathname.includes('/admin/library'),
    transport: location.pathname.includes('/admin/transport'),
    hostel: location.pathname.includes('/admin/hostel'),
    inventory: location.pathname.includes('/admin/inventory'),
    certificates: location.pathname.includes('/admin/certificates'),
    reports: location.pathname.includes('/admin/reports'),
    settings: location.pathname.includes('/admin/settings')
  });

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden no-print"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col no-print ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                  {institution?.name || 'SCOMS'} Admin
                </span>
                <span className="text-[10px] text-slate-400 font-medium">SCOMS ERP v3.4</span>
              </div>
            )}
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleNavigation.map((item) => {
            const hasSub = item.children && item.children.length > 0;
            const isOpen = openMenus[item.key];
            const isChildActive = hasSub && item.children.some((c) => location.pathname === c.path);

            if (!hasSub) {
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <div key={item.key} className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isChildActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={isCollapsed ? item.title : ''}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-slate-400">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </button>

                {/* Submenu Children */}
                {!isCollapsed && isOpen && (
                  <div className="pl-8 pr-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4 my-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
