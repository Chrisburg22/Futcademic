'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';

/**
 * Último recurso del service worker: se sirve cuando se navega sin red a una
 * pantalla que nunca se había abierto, así que no hay copia guardada.
 */
export default function OfflinePage() {
  return (
    <Center h="100vh" p="md">
      <Stack align="center" gap="md" maw={420}>
        <IconWifiOff size={48} stroke={1.5} />
        <Title order={2} ta="center">
          Sin conexión
        </Title>
        <Text c="dimmed" ta="center">
          Esta pantalla no estaba guardada en el dispositivo. Las que ya abriste con conexión
          siguen disponibles con los últimos datos descargados.
        </Text>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
        <Button variant="subtle" onClick={() => window.location.assign('/')}>
          Ir al inicio
        </Button>
      </Stack>
    </Center>
  );
}
