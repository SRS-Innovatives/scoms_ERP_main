import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useStudentAuth } from '../../context/StudentAuthContext';

export const LoginPage = () => {
  const { login } = useStudentAuth();

  const handleCustomLoginSuccess = (user) => {
    if (login) {
      login(user.admissionNumber || user.email || 'ADM/2025/00001', 'Password@123');
    }
  };

  return <UnifiedLoginPage defaultRole="STUDENT" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
