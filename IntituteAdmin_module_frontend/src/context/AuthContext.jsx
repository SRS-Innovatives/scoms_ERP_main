import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

const TOKEN_KEYS = [
  'scoms_admin_token',
  'scoms_admin_user',
  'scoms_access_token',
  'scoms_refresh_token',
  'scoms_user',
  'scoms_current_role',
];

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasToken = () => !!localStorage.getItem('scoms_admin_token');

  // Route access is decided purely by token presence, checked fresh on every render —
  // never by whether the background profile fetch happened to already succeed once.
  // A genuinely expired/invalid token is caught by api.js's global 401 handler (which
  // clears storage and hard-redirects), not by this flag going stale.
  const loadProfile = useCallback(() => {
    if (!hasToken()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    authService.getMe()
      .then((res) => setProfile(res.data))
      .catch(() => {}) // a real auth failure is handled globally by api.js's 401 redirect
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const logout = useCallback(() => {
    TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
    setProfile(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    profile,
    loading,
    isAuthenticated: hasToken(),
    logout,
    refetchProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
