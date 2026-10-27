import { useMemo } from 'react';
import { Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import {
  IconCalendarEvent,
  IconCash,
  IconPercentage,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import { useGetAdminDashboard } from '../../hooks/useDashboard';
import classes from './chat.module.css';

interface AdminDashboard {
  activeStudents: number;
  totalStudents: number;
  monthlyIncome: number;
  pendingPayments: number;
  attendanceRate: number;
  upcomingEvents: { id: string; date: string; start_time?: string | null; type?: string | null }[];
}

interface Suggestion {
  key: string;
  title: string;
  prompt: string;
  color: string;
  icon: React.ReactNode;
}

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const FALLBACK: Suggestion[] = [
  {
    key: 'deudas',
    title: '¿Quién debe la mensualidad?',
    prompt: '¿Quién debe la mensualidad?',
    color: 'orange',
    icon: <IconCash size={18} />,
  },
  {
    key: 'hoy',
    title: '¿Qué entrenamientos hay hoy?',
    prompt: '¿Qué entrenamientos hay hoy?',
    color: 'blue',
    icon: <IconCalendarEvent size={18} />,
  },
  {
    key: 'resumen',
    title: '¿Cómo va la academia este mes?',
    prompt: '¿Cómo va la academia este mes?',
    color: 'teal',
    icon: <IconTrendingUp size={18} />,
  },
];

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Arranque del chat con datos reales de la academia. Un estado vacío que dice
 * "tienes 7 pagos por cobrar" convierte mejor que tres frases genéricas.
 */
export function ChatSuggestions({
  onPick,
  compact,
}: {
  onPick: (text: string) => void;
  /** Versión apilada para el widget flotante. */
  compact?: boolean;
}) {
  const { data } = useGetAdminDashboard();
  const dashboard = data as AdminDashboard | undefined;

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!dashboard) return FALLBACK;
    const list: Suggestion[] = [];
    const today = todayKey();
    const todayEvents = (dashboard.upcomingEvents ?? []).filter((e) => e.date === today);

    if (dashboard.pendingPayments > 0) {
      const n = dashboard.pendingPayments;
      list.push({
        key: 'deudas',
        title: `${n} ${n === 1 ? 'pago pendiente' : 'pagos pendientes'} por cobrar`,
        prompt: '¿Quiénes deben la mensualidad?',
        color: 'orange',
        icon: <IconCash size={18} />,
      });
    }

    if (todayEvents.length > 0) {
      const n = todayEvents.length;
      list.push({
        key: 'hoy',
        title: `${n} ${n === 1 ? 'entrenamiento hoy' : 'entrenamientos hoy'}`,
        prompt: '¿Qué entrenamientos hay hoy?',
        color: 'blue',
        icon: <IconCalendarEvent size={18} />,
      });
    }

    if (dashboard.attendanceRate > 0) {
      list.push({
        key: 'asistencia',
        title: `Asistencia de hoy: ${dashboard.attendanceRate}%`,
        prompt: '¿Cómo va la asistencia de hoy?',
        color: 'grape',
        icon: <IconPercentage size={18} />,
      });
    }

    if (dashboard.monthlyIncome > 0) {
      list.push({
        key: 'ingresos',
        title: `Ingresos del mes: ${money.format(dashboard.monthlyIncome)}`,
        prompt: '¿Cómo va la academia este mes?',
        color: 'teal',
        icon: <IconTrendingUp size={18} />,
      });
    }

    if (dashboard.activeStudents > 0) {
      list.push({
        key: 'alumnos',
        title: `${dashboard.activeStudents} alumnos activos`,
        prompt: 'Dame un resumen de la academia',
        color: 'indigo',
        icon: <IconUsers size={18} />,
      });
    }

    return list.length > 0 ? list.slice(0, 4) : FALLBACK;
  }, [dashboard]);

  if (compact) {
    return (
      <Stack gap={6} w="100%">
        {suggestions.map((s) => (
          <Button
            key={s.key}
            variant="light"
            color={s.color}
            size="sm"
            radius="md"
            justify="flex-start"
            leftSection={s.icon}
            onClick={() => onPick(s.prompt)}
            styles={{ label: { whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.3 } }}
          >
            {s.title}
          </Button>
        ))}
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%" maw={560}>
      {suggestions.map((s) => (
        <UnstyledButton key={s.key} onClick={() => onPick(s.prompt)}>
          <Paper withBorder radius="md" p="sm" h="100%" className={classes.suggestion}>
            <Group wrap="nowrap" gap="sm" align="flex-start">
              <ThemeIcon variant="light" color={s.color} size={34} radius="md">
                {s.icon}
              </ThemeIcon>
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} lh={1.3}>
                  {s.title}
                </Text>
                <Text size="xs" c="dimmed" mt={2} lh={1.3}>
                  {s.prompt}
                </Text>
              </div>
            </Group>
          </Paper>
        </UnstyledButton>
      ))}
    </SimpleGrid>
  );
}
