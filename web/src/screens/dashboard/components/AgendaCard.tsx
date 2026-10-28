'use client';

import { Badge, Button, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import Link from 'next/link';
import { IconBallFootball, IconCalendarEvent, IconClock, IconRun } from '@tabler/icons-react';
import dayjs from 'dayjs';

export type EventoProximo = {
  id: string;
  date: string;
  start_time?: string | null;
  type?: string | null;
  description?: string | null;
  category?: { name?: string | null } | null;
};

/** "Hoy", "Mañana" o "mié 29 oct", sin depender del locale global de dayjs. */
const diaRelativo = (fecha: string) => {
  const dia = dayjs(fecha);
  const dias = dia.startOf('day').diff(dayjs().startOf('day'), 'day');
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(dia.toDate())
    .replace('.', '');
};

const hora = (valor?: string | null) => (valor ? valor.slice(0, 5) : null);

export function AgendaCard({ eventos }: { eventos: EventoProximo[] }) {
  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="xs">
          <IconCalendarEvent size={18} />
          <Text fw={600}>Próximos 7 días</Text>
        </Group>
        <Button component={Link} href="/admin/events" variant="subtle" size="compact-sm">
          Ver agenda
        </Button>
      </Group>

      {eventos.length === 0 ? (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            No hay entrenamientos ni partidos programados esta semana.
          </Text>
          <Button
            component={Link}
            href="/admin/events"
            variant="light"
            size="xs"
            style={{ alignSelf: 'flex-start' }}
          >
            Programar entrenamiento
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          {eventos.map((e) => {
            const esPartido = e.type === 'partido';
            return (
              <Group key={e.id} gap="sm" wrap="nowrap" align="flex-start">
                <ThemeIcon
                  size={34}
                  radius="md"
                  variant="light"
                  color={esPartido ? 'orange' : 'futcamedic'}
                >
                  {esPartido ? <IconBallFootball size={18} /> : <IconRun size={18} />}
                </ThemeIcon>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={600} tt="capitalize">
                      {diaRelativo(e.date)}
                    </Text>
                    {hora(e.start_time) && (
                      <Group gap={2} wrap="nowrap" c="dimmed">
                        <IconClock size={12} />
                        <Text size="xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {hora(e.start_time)}
                        </Text>
                      </Group>
                    )}
                    <Badge size="xs" variant="light" color={esPartido ? 'orange' : 'gray'}>
                      {esPartido ? 'Partido' : 'Entrenamiento'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" truncate>
                    {[e.category?.name, e.description].filter(Boolean).join(' · ') ||
                      'Sin categoría'}
                  </Text>
                </div>
              </Group>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
