'use client';

import { Avatar, Badge, Button, Card, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import Link from 'next/link';
import { IconUserPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { iniciales, requiereAtencion } from '../../../lib/students';
import type { Student } from '../../../types';

const hace = (fecha?: string | null) => {
  if (!fecha) return '';
  const dias = dayjs().startOf('day').diff(dayjs(fecha).startOf('day'), 'day');
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
};

/**
 * Altas recientes: a quién hay que terminar de dar de alta. Un alumno nuevo
 * casi siempre llega con el expediente a medias.
 */
export function RecentStudentsCard({
  alumnos,
  deudas,
}: {
  alumnos: Student[];
  deudas?: Record<string, number>;
}) {
  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="xs">
          <IconUserPlus size={18} />
          <Text fw={600}>Altas recientes</Text>
        </Group>
        <Button component={Link} href="/admin/students" variant="subtle" size="compact-sm">
          Ver alumnos
        </Button>
      </Group>

      {alumnos.length === 0 ? (
        <Text size="sm" c="dimmed">
          Sin altas en los últimos 30 días.
        </Text>
      ) : (
        <Stack gap="xs">
          {alumnos.map((a) => (
            <UnstyledButton
              key={a.id}
              component={Link}
              href={`/admin/students/${a.id}`}
              aria-label={`Abrir ficha de ${a.full_name}`}
              style={{ padding: 4, borderRadius: 'var(--mantine-radius-sm)', minHeight: 44 }}
            >
              <Group gap="sm" wrap="nowrap">
                <Avatar
                  size="sm"
                  radius="xl"
                  color="initials"
                  name={a.full_name}
                  src={a.avatar_url || undefined}
                >
                  {iniciales(a.full_name)}
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text size="sm" fw={500} truncate>
                    {a.full_name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {[a.category?.name || 'Sin categoría', hace(a.created_at)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </div>
                {requiereAtencion(a, { deuda: deudas?.[a.id] }) && (
                  <Badge size="xs" variant="light" color="orange">
                    Por atender
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
    </Card>
  );
}
