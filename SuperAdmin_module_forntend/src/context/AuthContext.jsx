import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('scoms_superadmin_user');
    if (saved) return JSON.parse(saved);
    return null;
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('scoms_superadmin_user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('scoms_superadmin_token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scoms_superadmin_user');
    localStorage.removeItem('scoms_superadmin_token');
  };

  /** Merges a partial update (e.g. a newly-uploaded avatar) into the stored user and
   * persists it, so the change survives a refresh without needing a full re-login. */
  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('scoms_superadmin_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
