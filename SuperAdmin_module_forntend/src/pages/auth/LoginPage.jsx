import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();

  const handleCustomLoginSuccess = (user, accessToken) => {
    if (login) {
      login(user, accessToken);
    }
  };

  return <UnifiedLoginPage defaultRole="SUPER_ADMIN" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
