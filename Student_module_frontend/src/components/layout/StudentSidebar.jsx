import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationConfig } from '../../routes/navigationConfig';
import { ChevronDown, ChevronRight, Search, Sparkles, X } from 'lucide-react';
import { useStudentAuth } from '../../context/StudentAuthContext';

export const StudentSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { student } = useStudentAuth();

  const [openMenus, setOpenMenus] = useState(() => {
    const initial = {};
    navigationConfig.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(child => location.pathname === child.path);
        if (isActive) initial[item.key] = true;
      }
    });
    return initial;
  });

  const [navSearch, setNavSearch] = useState('');

  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredNav = navigationConfig.filter(item => {
    if (!navSearch) return true;
    const titleMatch = item.title.toLowerCase().includes(navSearch.toLowerCase());
    const childMatch = item.children?.some(c => c.title.toLowerCase().includes(navSearch.toLowerCase()));
    return titleMatch || childMatch;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 glass-card border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 flex flex-col bg-white/95 dark:bg-slate-900/95 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md">
              S
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">SCOMS Campus</h2>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Student Portal</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Mini Profile Summary */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2.5">
            <img src={student?.photo} alt={student?.name} className="w-9 h-9 rounded-xl object-cover border border-indigo-400" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{student?.name}</h4>
              <p className="text-[10px] text-slate-500 truncate">{student?.admissionNo} • {student?.semester}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search student features..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isMenuExpanded = openMenus[item.key];
            const isParentActive = hasChildren && item.children.some(c => location.pathname === c.path);

            if (!hasChildren) {
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            }

            return (
              <div key={item.key} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isParentActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isMenuExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </div>
                </button>

                {/* Submenu Dropdown */}
                {isMenuExpanded && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`
                        }
                      >
                        <span>{child.title}</span>
                        {child.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                            {child.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Assistant Quick Banner */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <NavLink
            to="/student/ai"
            onClick={() => setIsOpen(false)}
            className="block p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:brightness-110 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" /> AI Study Assistant
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-normal text-indigo-100 mt-0.5">Instant concept explanations & study plan</p>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
