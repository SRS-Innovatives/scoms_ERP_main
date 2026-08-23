import React from 'react';
import UnifiedLoginPage from '../../../../shared/components/UnifiedLoginPage';
import { useStudentAuth } from '../../context/StudentAuthContext';

export const LoginPage = () => {
  const { login } = useStudentAuth();

  const handleCustomLoginSuccess = (user, accessToken, activeRoleId) => {
    if (activeRoleId === 'STUDENT') {
      if (user.role !== 'STUDENT' && user.role !== 'PARENT') {
        throw new Error('Access denied. Only Students or Parents can log in to this portal.');
      }
      if (login) {
        login(user, accessToken);
      }
    }
  };

  return <UnifiedLoginPage defaultRole="STUDENT" onCustomLoginSuccess={handleCustomLoginSuccess} />;
};

export default LoginPage;
