import { Card, Stack, Title, Text, Badge, Group, Grid, ThemeIcon } from '@mantine/core';
import { IconFlame, IconCalendar, IconTrophy } from '@tabler/icons-react';
import { useGetAlumnoDashboard } from '../../hooks/useDashboard';
import { LoadingState } from '../../components/common/LoadingState';

export function StudentDashboard() {
  const { data: dash, isLoading } = useGetAlumnoDashboard();

  if (isLoading) return <LoadingState />;

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" variant="light" color="orange">
              <IconFlame size={18} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Racha</Text>
              <Text fw={700} size="lg">{dash?.currentStreak ?? 0}</Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" variant="light" color="blue">
              <IconCalendar size={18} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Este mes</Text>
              <Text fw={700} size="lg">{dash?.trainingsThisMonth ?? 0}</Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md" variant="light" color="yellow">
              <IconTrophy size={18} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Logros</Text>
              <Text fw={700} size="lg">{dash?.achievementsUnlocked ?? 0}</Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Group gap="sm">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Categoría</Text>
              <Text fw={700} size="sm">{dash?.category ?? '—'}</Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>

      {dash?.nextTraining && (
        <Grid.Col span={12}>
          <Card withBorder padding="md" radius="md">
            <Group gap="xs">
              <Badge variant="light" color="blue">Próximo</Badge>
              <Text>{dash.nextTraining}</Text>
            </Group>
          </Card>
        </Grid.Col>
      )}
    </Grid>
  );
}
