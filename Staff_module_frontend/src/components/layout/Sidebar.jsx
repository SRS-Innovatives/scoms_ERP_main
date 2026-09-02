import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationConfig } from '../../routes/navigationConfig';
import { useInstitution } from '../../context/InstitutionContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, ChevronRight, Search, Sparkles, X } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { institution, isModuleEnabled } = useInstitution();
  const { profile } = useAuth();
  const visibleNavigation = navigationConfig.filter((item) => isModuleEnabled(item.key));
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
    if (!isOpen) { setIsOpen(true); return; } // expand the rail first, then open the submenu
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredNav = visibleNavigation.filter(item => {
    if (!navSearch) return true;
    const titleMatch = item.title.toLowerCase().includes(navSearch.toLowerCase());
    const childMatch = item.children?.some(c => c.title.toLowerCase().includes(navSearch.toLowerCase()));
    return titleMatch || childMatch;
  });

  return (
    <>
      {/* Mobile Backdrop — only when the drawer is fully open on a small screen */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen glass-card border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col bg-white/95 dark:bg-slate-900/95 ${
          isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 shrink-0 ${isOpen ? 'justify-between px-5' : 'justify-center px-2'}`}>
          <div className={`flex items-center gap-3 min-w-0 ${isOpen ? '' : 'justify-center'}`}>
            {institution?.logo ? (
              <img src={institution.logo} alt={institution.name} className="w-9 h-9 rounded-xl object-cover shadow-md shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                {institution?.code?.[0] || institution?.name?.[0] || 'S'}
              </div>
            )}
            {isOpen && (
              <div className="min-w-0">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">{institution?.name || 'Loading...'}</h2>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Staff Portal</span>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar Nav Search */}
        {isOpen && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Filter menu options..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className={`flex-1 overflow-y-auto py-3 space-y-1 ${isOpen ? 'px-3' : 'px-2'}`}>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isMenuExpanded = isOpen && openMenus[item.key];
            const isParentActive = hasChildren && item.children.some(c => location.pathname === c.path);

            if (!hasChildren) {
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  title={!isOpen ? item.title : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-xs font-semibold transition-all ${isOpen ? 'justify-between px-3 py-2.5' : 'justify-center py-2.5'} ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <div className={`flex items-center ${isOpen ? 'gap-3' : ''}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {isOpen && <span>{item.title}</span>}
                  </div>
                  {isOpen && item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
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
                  title={!isOpen ? item.title : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all ${isOpen ? 'justify-between px-3 py-2.5' : 'justify-center py-2.5'} ${
                    isParentActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`flex items-center ${isOpen ? 'gap-3' : ''}`}>
                    <Icon className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    {isOpen && <span>{item.title}</span>}
                  </div>
                  {isOpen && (
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
                  )}
                </button>

                {/* Submenu Dropdown — only ever rendered while the rail is expanded */}
                {isMenuExpanded && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path}
                        className={({ isActive }) =>
                          `block px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                            isActive
                              ? 'bg-sky-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
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

        {/* Footer info inside sidebar */}
        {isOpen && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> SCOMS v4.2 ERP
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {profile ? `Logged in as ${profile.firstName} ${profile.lastName}` : 'Loading profile...'}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
