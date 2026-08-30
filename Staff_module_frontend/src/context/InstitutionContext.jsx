import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const InstitutionContext = createContext();

// Must match shared/constants/institutionModules.js CORE_MODULE_KEYS
const CORE_MODULE_KEYS = ['dashboard', 'setup', 'settings'];

export const InstitutionProvider = ({ children }) => {
  const [institution, setInstitution] = useState(null);
  const [enabledModules, setEnabledModules] = useState(null); // null = not yet resolved
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('scoms_staff_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then((res) => {
        const inst = res.data?.institution || null;
        setInstitution(inst);
        setEnabledModules(inst?.enabledModules || null);
      })
      .catch((err) => console.error('Failed to load institution context', err))
      .finally(() => setLoading(false));
  }, []);

  // Core modules are always visible. While the institution context hasn't resolved yet
  // (or for institutions that predate module assignment) we fail-open so the sidebar
  // doesn't flash empty/incomplete during the initial load.
  const isModuleEnabled = (key) => {
    if (CORE_MODULE_KEYS.includes(key)) return true;
    if (!enabledModules) return true;
    return enabledModules.includes(key);
  };

  return (
    <InstitutionContext.Provider value={{ institution, enabledModules, loading, isModuleEnabled }}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => useContext(InstitutionContext);

export default InstitutionContext;
