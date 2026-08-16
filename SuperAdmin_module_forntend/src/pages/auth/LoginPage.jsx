import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();

  const handleCustomLoginSuccess = (user) => {
    if (login) {
      login(user.email || 'superadmin@scoms.in', 'Password@123');
    }
  };

  return <UnifiedLoginPage defaultRole="SUPER_ADMIN" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
