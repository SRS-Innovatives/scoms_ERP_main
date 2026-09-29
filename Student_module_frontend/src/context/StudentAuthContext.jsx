import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';

const StudentAuthContext = createContext();

/** Flattens the real backend Student record into the shape the rest of the app consumes.
 * No hardcoded fallback values anywhere — a field that isn't set on the real record comes
 * through as null/undefined and is rendered as such, never a fabricated placeholder. */
const buildProfile = (raw) => {
  if (!raw) return null;
  const parentLink = raw.parents?.[0]?.parent;
  return {
    id: raw.id,
    admissionNo: raw.admissionNumber,
    regNo: raw.registerNumber || raw.rollNumber || null,
    rollNo: raw.rollNumber,
    name: `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
    email: raw.email,
    phone: raw.phone,
    photo: raw.user?.avatar || null,
    institution: raw.institution?.name || null,
    department: raw.department?.name || null,
    course: raw.course?.name || null,
    batch: raw.section?.semester?.academicYear?.yearName || null,
    semester: raw.section?.semester?.name || null,
    section: raw.section?.name || null,
    status: raw.status,
    dob: raw.dob,
    gender: raw.gender,
    bloodGroup: raw.bloodGroup,
    address: raw.address,
    city: raw.city,
    state: raw.state,
    pincode: raw.pincode,
    fatherName: parentLink?.fatherName || null,
    motherName: parentLink?.motherName || null,
    parentPhone: parentLink?.fatherPhone || parentLink?.motherPhone || parentLink?.guardianPhone || null,
  };
};

const TOKEN_KEYS = [
  'scoms_student_token',
  'scoms_student_user',
  'scoms_access_token',
  'scoms_refresh_token',
  'scoms_user',
  'scoms_current_role',
  'scoms_active_child_id',
];

/** Which real child a Parent is currently viewing — read by api.js on every request (as
 * the X-Active-Student-Id header) so the backend's resolveActiveChild middleware knows
 * which of the parent's real, verified children to scope the request to. A Student
 * caller never sets this; their own studentId already comes from their own JWT. */
const getStoredAuthUser = () => {
  try { return JSON.parse(localStorage.getItem('scoms_student_user') || 'null'); } catch { return null; }
};

export const StudentAuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [authUser, setAuthUser] = useState(getStoredAuthUser);
  const [activeChildId, setActiveChildId] = useState(() => localStorage.getItem('scoms_active_child_id') || null);
  const [loading, setLoading] = useState(true);

  const hasToken = () => !!localStorage.getItem('scoms_student_token');
  const isParent = authUser?.role === 'PARENT';
  const parentChildren = authUser?.children || [];

  const loadProfile = useCallback(() => {
    if (!hasToken()) {
      setStudent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    studentService.getProfile()
      .then((res) => setStudent(buildProfile(res.data)))
      .catch(() => {}) // a real auth failure is handled globally by api.js's 401 redirect
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /** Called by LoginPage right after UnifiedLoginPage has written the real token —
   * re-fetches the authoritative profile from the backend rather than trusting whatever
   * partial shape the login response happened to include. */
  const login = useCallback((userData, token) => {
    if (token) localStorage.setItem('scoms_student_token', token);
    setAuthUser(userData || getStoredAuthUser());
    // A Parent with one real child (the common case) gets that child selected
    // automatically — the switcher only matters once there's more than one.
    const firstChildId = userData?.children?.[0]?.id;
    if (userData?.role === 'PARENT' && firstChildId) {
      localStorage.setItem('scoms_active_child_id', firstChildId);
      setActiveChildId(firstChildId);
    }
    loadProfile();
  }, [loadProfile]);

  /** Switches which real child a Parent is viewing — every subsequent request is scoped
   * to this child (see api.js), re-validated server-side on every single call, never
   * just trusted because the frontend says so. */
  const switchChild = useCallback((studentId) => {
    localStorage.setItem('scoms_active_child_id', studentId);
    setActiveChildId(studentId);
    loadProfile();
  }, [loadProfile]);

  const logout = useCallback(() => {
    TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
    setStudent(null);
    setAuthUser(null);
    setActiveChildId(null);
  }, []);

  const value = {
    student,
    setStudent,
    login,
    logout,
    loading,
    isAuthenticated: hasToken(),
    refetchProfile: loadProfile,
    isParent,
    parentChildren,
    activeChildId,
    switchChild,
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return context;
};

export default StudentAuthContext;
