import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();

  const handleCustomLoginSuccess = (user, accessToken, activeRoleId) => {
    if (activeRoleId === 'SUPER_ADMIN') {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        throw new Error('Access denied. Only Super Admins can log in to this portal.');
      }
      if (login) {
        login(user, accessToken);
      }
    }
  };

  return <UnifiedLoginPage defaultRole="SUPER_ADMIN" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
