import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { createAcademicHelpers } from '../../../shared/components/academicStructure';

const InstitutionContext = createContext();

export const InstitutionProvider = ({ children }) => {
  const [institution, setInstitution] = useState(null);
  const [enabledModules, setEnabledModules] = useState(null); // null = not yet resolved

  useEffect(() => {
    const token = localStorage.getItem('scoms_student_token');
    if (!token) return;
    authService
      .getMe()
      .then((res) => {
        setInstitution(res.data?.institution || null);
        setEnabledModules(res.data?.institution?.enabledModules || null);
      })
      .catch((err) => console.error('Failed to load institution context', err));
  }, []);

  // Nav items without a `module` tag are always visible. Fail-open while unresolved
  // (or for institutions that predate module assignment) so nothing flashes empty.
  const isModuleEnabled = (moduleKey) => {
    if (!moduleKey) return true;
    if (!enabledModules) return true;
    return enabledModules.includes(moduleKey);
  };

  // Institution type -> levels/labels/regulations, resolved server-side (see /auth/me)
  const academic = useMemo(() => createAcademicHelpers(institution?.academicStructure), [institution]);

  return (
    <InstitutionContext.Provider value={{ institution, enabledModules, isModuleEnabled, academic }}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => useContext(InstitutionContext);
export const useAcademic = () => useContext(InstitutionContext).academic;

export default InstitutionContext;
