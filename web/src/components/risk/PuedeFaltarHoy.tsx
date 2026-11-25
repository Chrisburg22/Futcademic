'use client';

import { Alert, Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core';
import { IconPhone } from '@tabler/icons-react';
import { COLOR_BANDA, useRiesgoCategoria } from '../../hooks/useRisk';
import { ComoSeCalcula } from './ComoSeCalcula';

/**
 * Bloque previo al pase de lista: a quién llamar hoy.
 *
 * No muestra probabilidades ni la palabra «predicción». Muestra el motivo, que
 * es lo único que el profesor puede verificar y usar.
 */
export function PuedeFaltarHoy({
  categoriaId,
  fecha,
  habilitado = true,
}: {
  categoriaId: string | null;
  fecha: string;
  habilitado?: boolean;
}) {
  const { data, isLoading, isError } = useRiesgoCategoria(categoriaId, fecha, habilitado);

  // Un error aquí no estorba el pase de lista: el aviso es un extra.
  if (!habilitado || isLoading || isError || !data) return null;

  const enRiesgo = data.students.filter((a) => a.band === 'alto' || a.band === 'medio');
  const sinHistorial = data.students.filter((a) => a.status === 'sin_historial').length;

  if (enRiesgo.length === 0) {
    if (sinHistorial === 0) return null;
    return (
      <Alert variant="light" color="gray" py="xs">
        <Text size="sm">
          {sinHistorial} {sinHistorial === 1 ? 'alumno' : 'alumnos'} sin historial suficiente para
          estimar nada. Con dos sesiones registradas ya aparecen aquí.
        </Text>
      </Alert>
    );
  }

  return (
    <Card withBorder radius="md" padding="sm">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs">
          <Text fw={600} size="sm">
            Puede faltar hoy
          </Text>
          <Badge variant="light" color="orange">
            {enRiesgo.length}
          </Badge>
        </Group>
        <ComoSeCalcula />
      </Group>

      <Stack gap={6}>
        {enRiesgo.map((alumno) => (
          <Group key={alumno.student_id} justify="space-between" wrap="nowrap" gap="sm">
            <div style={{ minWidth: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="sm" fw={500} truncate>
                  {alumno.full_name || 'Alumno'}
                </Text>
                <Badge variant="dot" color={COLOR_BANDA[alumno.band || 'bajo']} size="xs">
                  {alumno.band}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" truncate>
                {alumno.reasons.map((m) => m.text).join(' · ')}
              </Text>
            </div>
            <Anchor
              href={`/admin/students/${alumno.student_id}`}
              size="xs"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Group gap={4} wrap="nowrap">
                <IconPhone size={12} />
                contactar
              </Group>
            </Anchor>
          </Group>
        ))}
      </Stack>

      {sinHistorial > 0 && (
        <Text size="xs" c="dimmed" mt="xs">
          {sinHistorial} más sin historial suficiente.
        </Text>
      )}
    </Card>
  );
}
