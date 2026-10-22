import { Grid, Card, Text, Group, ThemeIcon, SimpleGrid, Title, Box } from '@mantine/core';
import {
  IconUsers,
  IconSchool,
  IconCategory,
  IconCash,
  IconCalendarEvent,
  IconPercentage,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGetAdminDashboard } from '../../hooks/useDashboard';
import { QuickActionsDock, type QuickAction } from '../../components/layout/QuickActionsDock';

const SHORTCUTS: QuickAction[] = [
  { to: '/admin/students', label: 'Alumnos', icon: <IconSchool size={22} /> },
  { to: '/admin/teachers', label: 'Profesores', icon: <IconUsers size={22} /> },
  { to: '/admin/categories', label: 'Categorías', icon: <IconCategory size={22} /> },
  { to: '/admin/events', label: 'Agenda', icon: <IconCalendarEvent size={22} /> },
];

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {label}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </div>
        <ThemeIcon size={48} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

function ShortcutCard({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Card
      component={Link}
      to={to}
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

export function AdminDashboard() {
  const { data: dash } = useGetAdminDashboard();

  return (
    <>
      <Title order={3} mb="md">
        Resumen
      </Title>
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Alumnos activos"
            value={dash?.activeStudents ?? '—'}
            icon={<IconSchool size={24} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total alumnos"
            value={dash?.totalStudents ?? '—'}
            icon={<IconUsers size={24} />}
            color="violet"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Ingreso mensual"
            value={dash?.monthlyIncome != null ? `$${dash.monthlyIncome}` : '—'}
            icon={<IconCash size={24} />}
            color="teal"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Asistencia"
            value={dash?.attendanceRate != null ? `${Math.round(dash.attendanceRate)}%` : '—'}
            icon={<IconPercentage size={24} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      {/* En escritorio hay sitio de sobra: tarjetas. En móvil estos accesos
          quedaban al final del scroll, así que viven en el dock flotante. */}
      <Box visibleFrom="sm">
        <Title order={4} mb="md">
          Accesos rápidos
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          {SHORTCUTS.map((s) => (
            <ShortcutCard key={s.to} to={s.to} label={s.label} icon={s.icon} />
          ))}
        </SimpleGrid>
      </Box>

      <QuickActionsDock actions={SHORTCUTS} />
    </>
  );
}
