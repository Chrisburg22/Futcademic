'use client';

import { usePathname } from 'next/navigation';
import { Redirect } from '../navigation/Redirect';
import { useAuth } from '../../contexts/AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const pathname = usePathname();

  if (profile?.must_change_password && pathname !== '/change-password') {
    return <Redirect to="/change-password" />;
  }

  const needsOnboarding =
    profile &&
    !profile.must_change_password &&
    !(profile as any).onboarded_at &&
    ['profesor', 'padre', 'alumno'].includes(profile.role);
  if (needsOnboarding && pathname !== '/onboarding') {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}
