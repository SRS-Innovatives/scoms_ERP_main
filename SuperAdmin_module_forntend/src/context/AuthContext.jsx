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

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
