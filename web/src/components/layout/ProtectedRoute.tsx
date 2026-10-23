import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { useMyPermissionGate } from '../../hooks/usePermissions';
import type { Role, TeacherPermissions } from '../../types';

export function ProtectedRoute({
  children,
  roles,
  permission,
}: {
  children: React.ReactNode;
  roles?: Role[];
  /** Permiso de profesor exigido además del rol. Los demás roles lo cumplen. */
  permission?: keyof TeacherPermissions;
}) {
  const { session, profile, isLoading } = useAuth();
  const { can, isLoading: permissionsLoading } = useMyPermissionGate();
  const location = useLocation();

  if (isLoading || (permission && permissionsLoading)) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (permission && profile && !can(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
