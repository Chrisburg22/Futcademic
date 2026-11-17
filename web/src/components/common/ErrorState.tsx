import { Button, Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

export type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Sin reintento el usuario se queda sin salida: recargar la página no es una. */
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * Qué se enseña cuando la petición falla.
 *
 * Antes no existía: las pantallas de alumno y padre caían en su estado vacío,
 * así que un error de red se leía como «no estás asignado a un equipo» o «sin
 * registros». Eso es mentirle al usuario.
 */
export function ErrorState({
  title = 'No pudimos cargar esto',
  description = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
  retryLabel = 'Intentar de nuevo',
}: ErrorStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <ThemeIcon size={64} radius="xl" variant="light" color="orange">
          <IconAlertTriangle size={32} />
        </ThemeIcon>
        <Text fw={600} ta="center">
          {title}
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={320}>
          {description}
        </Text>
        {onRetry && (
          <Button variant="light" leftSection={<IconRefresh size={18} />} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
