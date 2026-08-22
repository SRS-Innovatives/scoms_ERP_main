import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useStudentAuth } from '../../context/StudentAuthContext';

export const LoginPage = () => {
  const { login } = useStudentAuth();

  const handleCustomLoginSuccess = (user, accessToken) => {
    if (login) {
      login(user, accessToken);
    }
  };

  return <UnifiedLoginPage defaultRole="STUDENT" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
