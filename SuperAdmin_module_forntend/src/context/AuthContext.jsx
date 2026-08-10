import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('scoms_superadmin_user');
    if (saved) return JSON.parse(saved);
    return {
      id: "SA-001",
      name: "Super Admin",
      email: "admin@scoms.edu.in",
      role: "Super Admin",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
    };
  });

  const login = (email, password) => {
    const loggedUser = {
      id: "SA-001",
      name: "Super Admin",
      email,
      role: "Super Admin",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
    };
    setUser(loggedUser);
    localStorage.setItem('scoms_superadmin_user', JSON.stringify(loggedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scoms_superadmin_user');
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
