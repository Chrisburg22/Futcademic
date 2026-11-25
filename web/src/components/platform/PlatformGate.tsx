'use client';

import { Center, Loader } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from '../navigation/Redirect';

/**
 * Solo el rol `plataforma` entra a `/platform/*`. El resto se va a su panel.
 *
 * Es la contraparte del `requirePlatform` del backend: la API ya responde 403,
 * esto evita pintar una consola vacía antes del error.
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!session) return <Redirect to="/login" />;
  if (profile && profile.role !== 'plataforma') return <Redirect to="/" />;

  return <>{children}</>;
}
