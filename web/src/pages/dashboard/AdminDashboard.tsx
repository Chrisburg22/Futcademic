import { Grid, Card, Text, Group, ThemeIcon, SimpleGrid, Title } from '@mantine/core';
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

      <Title order={4} mb="md">
        Accesos rápidos
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <ShortcutCard to="/admin/students" label="Alumnos" icon={<IconSchool size={20} />} />
        <ShortcutCard to="/admin/teachers" label="Profesores" icon={<IconUsers size={20} />} />
        <ShortcutCard
          to="/admin/categories"
          label="Categorías"
          icon={<IconCategory size={20} />}
        />
        <ShortcutCard
          to="/admin/events"
          label="Agenda"
          icon={<IconCalendarEvent size={20} />}
        />
      </SimpleGrid>
    </>
  );
}
