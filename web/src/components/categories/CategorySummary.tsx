import { Avatar, Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconClock, IconMapPin, IconUsers } from '@tabler/icons-react';

export interface ResumenEntrenador {
  id: string;
  nombre?: string | null;
  avatar?: string | null;
}

export interface ResumenHorario {
  id: string;
  nombre?: string | null;
  hora?: string | null;
  cancha?: string | null;
}

/**
 * Ficha de solo lectura de una categoría. La comparten el detalle del panel,
 * "Mi equipo" del alumno y la vista del padre, para que las familias y el
 * staff vean lo mismo.
 */
export function CategorySummary({
  nombre,
  color,
  anios,
  descripcion,
  jugadores,
  entrenadores = [],
  horario = [],
}: {
  nombre: string;
  color?: string | null;
  anios?: string;
  descripcion?: string | null;
  jugadores?: number | null;
  entrenadores?: ResumenEntrenador[];
  horario?: ResumenHorario[];
}) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="sm" mb="xs" wrap="wrap">
        <span
          aria-hidden
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: color || 'var(--mantine-color-gray-4)',
          }}
        />
        <Text fw={600}>{nombre}</Text>
        {anios && <Badge variant="light">{anios}</Badge>}
        {jugadores != null && (
          <Badge variant="light" color="blue" leftSection={<IconUsers size={16} />}>
            {jugadores} compañero{jugadores === 1 ? '' : 's'}
          </Badge>
        )}
      </Group>

      {descripcion && (
        <Text size="sm" c="dimmed" mb="sm">
          {descripcion}
        </Text>
      )}

      <Stack gap="xs">
        <div>
          <Text size="sm" c="dimmed" fw={600} mb={4}>
            Horario
          </Text>
          {horario.length === 0 ? (
            <Text size="sm" c="dimmed">
              Sin horario recurrente
            </Text>
          ) : (
            <Stack gap={4}>
              {horario.map((h) => (
                <Group key={h.id} gap="xs" wrap="wrap">
                  <Text size="sm">{h.nombre || 'Entrenamiento'}</Text>
                  {h.hora && (
                    <Badge variant="light" leftSection={<IconClock size={16} />}>
                      {h.hora}
                    </Badge>
                  )}
                  {h.cancha && (
                    <Badge
                      variant="light"
                      color="gray"
                      leftSection={<IconMapPin size={16} />}
                    >
                      {h.cancha}
                    </Badge>
                  )}
                </Group>
              ))}
            </Stack>
          )}
        </div>
        <div>
          <Text size="sm" c="dimmed" fw={600} mb={4}>
            Entrenadores
          </Text>
          {entrenadores.length === 0 ? (
            <Text size="sm" c="dimmed">
              Sin entrenador asignado
            </Text>
          ) : (
            <Group gap="sm" wrap="wrap">
              {entrenadores.map((e) => (
                <Group key={e.id} gap={6} wrap="nowrap">
                  <Avatar size="sm" radius="xl" src={e.avatar || undefined}>
                    {e.nombre?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <Text size="sm">{e.nombre || 'Sin nombre'}</Text>
                </Group>
              ))}
            </Group>
          )}
        </div>

      </Stack>
    </Card>
  );
}
