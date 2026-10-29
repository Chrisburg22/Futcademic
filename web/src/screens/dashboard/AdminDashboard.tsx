'use client';

import { useMemo } from 'react';
import {
  Button,
  Card,
  Grid,
  Group,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  Box,
} from '@mantine/core';
import {
  IconCalendarEvent,
  IconCash,
  IconCategory,
  IconClipboardCheck,
  IconCoin,
  IconPercentage,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useGetAdminDashboard } from '../../hooks/useDashboard';
import { useGetStudents } from '../../hooks/useStudents';
import { useGetPendingPayments } from '../../hooks/usePayments';
import { QuickActionsDock, type QuickAction } from '../../components/layout/QuickActionsDock';
import { enlaceAlListado, resumirAlumnos, type ContextoAlumnos } from '../../lib/students';
import type { Student } from '../../types';
import { MetricCard } from './components/MetricCard';
import { WorkQueueCard } from './components/WorkQueueCard';
import { AgendaCard, type EventoProximo } from './components/AgendaCard';
import { RecentStudentsCard } from './components/RecentStudentsCard';

const SHORTCUTS: QuickAction[] = [
  { to: '/admin/students', label: 'Alumnos', icon: <IconSchool size={22} /> },
  { to: '/admin/teachers', label: 'Profesores', icon: <IconUsers size={22} /> },
  { to: '/admin/categories', label: 'Categorías', icon: <IconCategory size={22} /> },
  { to: '/admin/events', label: 'Agenda', icon: <IconCalendarEvent size={22} /> },
];

const pesos = (monto: number) => `$${Number(monto).toLocaleString('es-MX')}`;

/** "Martes, 27 de octubre" — con `tt="capitalize"` saldría "27 De Octubre". */
const hoyEnTexto = () => {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

function ShortcutCard({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Card
      component={Link}
      href={to}
      withBorder
      padding="lg"
      radius="md"
      style={{ textDecoration: 'none' }}
    >
      <Group>
        <ThemeIcon size={40} radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Text fw={600}>{label}</Text>
      </Group>
    </Card>
  );
}

/**
 * Inicio del administrador: no es un escaparate de números, es el tablero de
 * la jornada. Primero qué pasa hoy, luego qué falta por atender y qué viene
 * esta semana, y cada cifra enlaza a la pantalla donde se resuelve.
 */
export function AdminDashboard() {
  const { data: dash, isLoading: cargandoDash } = useGetAdminDashboard();
  const { data: students = [] } = useGetStudents();
  const { data: cobranza } = useGetPendingPayments();
  const alumnos = students as Student[];

  const contexto: ContextoAlumnos = useMemo(() => {
    if (!cobranza?.pending) return {};
    const deudas: Record<string, number> = {};
    for (const fila of cobranza.pending as any[]) {
      deudas[fila.id] = Number(fila.pending_amount) || 0;
    }
    return { deudas };
  }, [cobranza]);

  const resumen = useMemo(() => resumirAlumnos(alumnos, contexto), [alumnos, contexto]);
  const recientes = useMemo(() => {
    const hace30 = dayjs().subtract(30, 'day');
    return alumnos
      .filter((a) => a.created_at && dayjs(a.created_at).isAfter(hace30))
      .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf())
      .slice(0, 5);
  }, [alumnos]);

  const eventos = (dash?.upcomingEvents ?? []) as EventoProximo[];
  const asistencia = dash?.attendanceRate != null ? Math.round(dash.attendanceRate) : null;
  const porCobrar = cobranza?.total_pending_amount;
  const activos = dash?.activeStudents ?? resumen.activos;
  const totales = dash?.totalStudents ?? resumen.total;

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md" wrap="wrap" gap="sm">
        <Title order={4} lh={1.2}>
          {hoyEnTexto()}
        </Title>
        <Group gap="xs">
          <Button
            component={Link}
            href="/attendance"
            leftSection={<IconClipboardCheck size={16} />}
          >
            Pase de lista
          </Button>
          <Button
            component={Link}
            href="/finances"
            variant="default"
            leftSection={<IconCash size={16} />}
          >
            Cobros
          </Button>
        </Group>
      </Group>

      <Grid mb="md">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Alumnos activos"
            value={activos}
            hint={`de ${totales} en la academia`}
            icon={<IconSchool size={20} />}
            color="futcamedic"
            href={enlaceAlListado({ estado: 'activo' })}
            cargando={cargandoDash}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Asistencia de hoy"
            value={asistencia != null ? `${asistencia}%` : '—'}
            hint={asistencia ? 'de la lista de hoy' : 'Aún sin pase de lista'}
            icon={<IconPercentage size={20} />}
            color="blue"
            href="/attendance"
            cargando={cargandoDash}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Por cobrar"
            value={porCobrar != null ? pesos(porCobrar) : '—'}
            hint={
              resumen.conAdeudo
                ? `${resumen.conAdeudo} ${resumen.conAdeudo === 1 ? 'alumno' : 'alumnos'} con adeudo`
                : 'Todos al corriente'
            }
            icon={<IconCoin size={20} />}
            color="orange"
            // El número es dinero: se cobra en Finanzas, no en el listado.
            href="/finances?tab=cobranza"
            cargando={!cobranza}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <MetricCard
            label="Ingreso mensual"
            value={dash?.monthlyIncome != null ? pesos(dash.monthlyIncome) : '—'}
            hint="Mensualidades cobradas"
            icon={<IconCash size={20} />}
            color="teal"
            href="/finances"
            cargando={cargandoDash}
          />
        </Grid.Col>
      </Grid>

      <Grid mb="md">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <WorkQueueCard resumen={resumen} verCobranza={!!contexto.deudas} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <AgendaCard eventos={eventos} />
        </Grid.Col>
      </Grid>

      <Grid mb="md">
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <RecentStudentsCard alumnos={recientes} deudas={contexto.deudas} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          {/* En escritorio hay sitio de sobra: tarjetas. En móvil estos accesos
              quedaban al final del scroll, así que viven en el dock flotante. */}
          <Box visibleFrom="sm">
            <Title order={4} mb="sm">
              Accesos rápidos
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {SHORTCUTS.map((s) => (
                <ShortcutCard key={s.to} to={s.to} label={s.label} icon={s.icon} />
              ))}
            </SimpleGrid>
          </Box>
        </Grid.Col>
      </Grid>

      <QuickActionsDock actions={SHORTCUTS} />
    </>
  );
}
