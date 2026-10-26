'use client';

import { Center, Loader } from '@mantine/core';
import { Redirect } from '../navigation/Redirect';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!session) {
    return <Redirect to="/login" />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
