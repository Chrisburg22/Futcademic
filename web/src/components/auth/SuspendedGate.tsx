'use client';

import { Button, Card, Center, Stack, Text, Title } from '@mantine/core';
import { IconPlayerPause } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { escucharSuspension, leerSuspension, type Suspension } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Pantalla de academia suspendida.
 *
 * Mientras la academia esté suspendida, la API rechaza todo: pintar la app con
 * cada tarjeta en error no explica nada. Esto dice qué pasó y a quién escribir.
 */
export function SuspendedGate({ children }: { children: React.ReactNode }) {
  const [suspension, setSuspension] = useState<Suspension | null>(leerSuspension());
  const { signOut } = useAuth();

  useEffect(() => escucharSuspension(setSuspension) as unknown as () => void, []);

  if (!suspension) return <>{children}</>;

  return (
    <Center h="100vh" p="md">
      <Card withBorder radius="md" padding="xl" maw={460}>
        <Stack gap="sm" align="center" ta="center">
          <IconPlayerPause size={40} color="var(--mantine-color-red-6)" />
          <Title order={3}>Academia suspendida</Title>
          <Text size="sm">{suspension.message}</Text>
          {suspension.reason && (
            <Text size="sm" c="dimmed">
              Motivo: {suspension.reason}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            Tus datos siguen guardados. Al reactivarse, todo vuelve como estaba.
          </Text>
          <Button variant="light" mt="sm" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
