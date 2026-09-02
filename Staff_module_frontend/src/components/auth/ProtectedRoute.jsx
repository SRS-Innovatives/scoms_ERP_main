import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Guards every /staff/* route — a missing/invalid token redirects to login instead of
 * rendering a dashboard shell that then floods every widget with auth-failure errors. */
export const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated, profile, refetchProfile } = useAuth();

  // This component mounts fresh the moment the user lands here right after login (the
  // unauthenticated /staff/login route is a separate <Route>, so AuthContext's one-time
  // mount-time profile fetch never re-ran) — pick up the now-valid token immediately.
  useEffect(() => {
    if (isAuthenticated && !profile) refetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
