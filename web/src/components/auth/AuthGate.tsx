import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  if (profile?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  const needsOnboarding =
    profile &&
    !profile.must_change_password &&
    !(profile as any).onboarded_at &&
    ['profesor', 'padre', 'alumno'].includes(profile.role);
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
