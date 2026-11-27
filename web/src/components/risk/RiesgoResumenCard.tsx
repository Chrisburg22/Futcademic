'use client';

import { Card, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useResumenRiesgo } from '../../hooks/useRisk';
import { ComoSeCalcula } from './ComoSeCalcula';

/** Tarjeta del panel del admin: cuántos alumnos conviene mirar esta semana. */
export function RiesgoResumenCard({ habilitado = true }: { habilitado?: boolean }) {
  const { data, isError } = useResumenRiesgo(habilitado);

  if (!habilitado || isError || !data || data.total === 0) return null;

  const enRiesgo = data.por_banda.alto + data.por_banda.medio;

  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" mb={4}>
        <Group gap={6}>
          <IconAlertTriangle size={18} color="var(--mantine-color-orange-6)" />
          <Text fw={600} size="sm">
            En riesgo de faltar
          </Text>
        </Group>
        <ComoSeCalcula />
      </Group>

      <Stack gap={2}>
        <Text fz={28} fw={700} lh={1.2}>
          {enRiesgo}
          <Text span fz="sm" c="dimmed" fw={400}>
            {' '}
            de {data.total} alumnos
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {data.por_banda.alto} con señales claras, {data.por_banda.medio} para mirar de reojo.
          {data.sin_historial > 0 &&
            ` ${data.sin_historial} sin historial suficiente: pasar lista los incorpora.`}
        </Text>
      </Stack>
    </Card>
  );
}
