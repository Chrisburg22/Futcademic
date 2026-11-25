'use client';

import { Badge, Card, Group, List, Stack, Text, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { COLOR_BANDA, useRiesgoAlumno } from '../../hooks/useRisk';
import { ComoSeCalcula } from './ComoSeCalcula';

/**
 * Bloque de riesgo en la ficha del alumno: para cuando el admin ya está
 * investigando un caso concreto. Aquí sí se muestra el número, porque quien
 * abre una ficha quiere el detalle y tiene el enlace a su procedencia al lado.
 */
export function RiesgoAlumnoCard({
  studentId,
  habilitado = true,
}: {
  studentId: string;
  habilitado?: boolean;
}) {
  const { data, isError } = useRiesgoAlumno(studentId, habilitado);

  if (!habilitado || isError || !data) return null;

  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>Asistencia y riesgo</Text>
        <ComoSeCalcula />
      </Group>

      {data.status !== 'ok' ? (
        <Text size="sm" c="dimmed">
          {data.status === 'sin_historial'
            ? `Solo ${data.marcas} ${data.marcas === 1 ? 'sesión' : 'sesiones'} registradas: hacen falta dos para estimar algo.`
            : 'Nunca ha asistido. Conviene revisar si sigue inscrito.'}
        </Text>
      ) : (
        <Stack gap="xs">
          <Group gap="sm">
            <Badge variant="light" color={COLOR_BANDA[data.band || 'bajo']} size="lg">
              riesgo {data.band}
            </Badge>
            <Text size="sm" c="dimmed">
              {Math.round((data.risk || 0) * 100)} % para la próxima sesión
            </Text>
          </Group>

          {data.reasons.length > 0 && (
            <List size="sm" spacing={2}>
              {data.reasons.map((m) => (
                <List.Item key={m.key}>{m.text}</List.Item>
              ))}
            </List>
          )}
        </Stack>
      )}

      {data.historial.length > 0 && (
        <>
          <Text size="xs" c="dimmed" mt="md" mb={4}>
            Últimas sesiones
          </Text>
          <Group gap={6}>
            {[...data.historial].reverse().map((m) => (
              <Tooltip
                key={m.date}
                label={`${dayjs(m.date).format('DD/MM/YYYY')} · ${m.present ? 'presente' : 'ausente'}`}
              >
                {m.present ? (
                  <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />
                ) : (
                  <IconCircleX size={20} color="var(--mantine-color-red-6)" />
                )}
              </Tooltip>
            ))}
          </Group>
        </>
      )}
    </Card>
  );
}
