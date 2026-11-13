'use client';

import { Button, Card, Group, Progress, Stack, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconCalendarCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  FALTAS_SEGUIDAS_RIESGO,
  nivelAsistencia,
  type EstadisticaAlumno,
} from '../../lib/attendance';

/**
 * Asistencia del alumno en el resumen de su ficha: el dato que decide si hay
 * que llamar al tutor antes de perderlo.
 */
export function StudentAttendanceCard({
  estadistica,
  onVer,
  titulo = 'Asistencia (90 días)',
}: {
  estadistica: EstadisticaAlumno;
  onVer?: () => void;
  titulo?: string;
}) {
  const nivel = nivelAsistencia(estadistica.porcentaje);
  const sinDatos = estadistica.sesiones === 0;

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Group gap="xs">
          <IconCalendarCheck size={18} />
          <Text fw={600}>{titulo}</Text>
        </Group>
        {onVer && (
          <Button variant="subtle" size="compact-sm" onClick={onVer}>
            Ver historial
          </Button>
        )}
      </Group>
      {sinDatos ? (
        <Text size="sm" c="dimmed">
          Sin sesiones registradas en este periodo.
        </Text>
      ) : (
        <Stack gap={6}>
          <Group justify="space-between" align="flex-end" wrap="nowrap">
            <Text fw={700} size="xl" c={nivel.color} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {estadistica.porcentaje}%
            </Text>
            <Text size="sm" c="dimmed">
              {estadistica.asistidas} de {estadistica.sesiones} sesiones
            </Text>
          </Group>
          <Progress
            value={estadistica.porcentaje}
            color={nivel.color}
            size="sm"
            aria-label={`Asistencia ${estadistica.porcentaje}%`}
          />
          <Group justify="space-between" wrap="nowrap">
            <Text size="xs" c="dimmed">
              {estadistica.ultimaAsistencia
                ? `Última asistencia: ${dayjs(estadistica.ultimaAsistencia).format('DD/MM/YYYY')}`
                : 'No ha asistido en este periodo'}
            </Text>
            {estadistica.faltasSeguidas >= FALTAS_SEGUIDAS_RIESGO && (
              <Tooltip label="Conviene avisar al tutor">
                <Group gap={4} wrap="nowrap" c="orange">
                  <IconAlertTriangle size={14} />
                  <Text size="xs" fw={600}>
                    {estadistica.faltasSeguidas} faltas seguidas
                  </Text>
                </Group>
              </Tooltip>
            )}
          </Group>
        </Stack>
      )}
    </Card>
  );
}
