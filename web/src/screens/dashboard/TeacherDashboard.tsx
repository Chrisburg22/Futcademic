import { Card, Stack, Title, Text, Badge, Group, Grid, ThemeIcon } from '@mantine/core';
import { IconCategory, IconCalendar } from '@tabler/icons-react';
import { useGetProfesorDashboard } from '../../hooks/useDashboard';
import { useGetMyCategories } from '../../hooks/useCategories';
import { useGetTrainings } from '../../hooks/useEvents';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import dayjs from 'dayjs';

export function TeacherDashboard() {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: dash } = useGetProfesorDashboard();
  const { data: categories = [], isLoading } = useGetMyCategories();
  const { data: trainings = [] } = useGetTrainings({ date: today });

  if (isLoading) return <LoadingState />;

  return (
    <Grid>
      {dash && (
        <Grid.Col span={12}>
          <Group gap="md" mb="md">
            <Card withBorder padding="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size={36} radius="md" variant="light" color="teal">
                  <IconCategory size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Categorías</Text>
                  <Text fw={700} size="lg">{dash.categoriesCount ?? categories.length}</Text>
                </div>
              </Group>
            </Card>
            {dash.nextSession && (
              <Card withBorder padding="md" radius="md">
                <Group gap="sm">
                  <ThemeIcon size={36} radius="md" variant="light" color="blue">
                    <IconCalendar size={18} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Próxima sesión</Text>
                    <Text fw={700} size="sm">{dash.nextSession}</Text>
                  </div>
                </Group>
              </Card>
            )}
          </Group>
        </Grid.Col>
      )}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Title order={4} mb="md">
          Mis categorías
        </Title>
        {categories.length === 0 ? (
          <EmptyState description="Aún no tienes categorías asignadas." />
        ) : (
          <Stack>
            {categories.map((c: any) => (
              <Card key={c.id} withBorder padding="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{c.name}</Text>
                    <Text size="xs" c="dimmed">
                      Año {c.birth_year}
                    </Text>
                  </div>
                  <Badge variant="light">
                    {c.students?.length ?? 0} alumnos
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Title order={4} mb="md">
          Sesiones de hoy
        </Title>
        {trainings.length === 0 ? (
          <EmptyState description="No hay sesiones programadas para hoy." />
        ) : (
          <Stack>
            {trainings.map((t: any) => (
              <Card key={t.id} withBorder padding="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{t.category?.name || 'Sesión'}</Text>
                    <Text size="xs" c="dimmed" tt="capitalize">
                      {t.type} · {t.start_time || '—'}
                    </Text>
                  </div>
                  {t.completed && <Badge color="green">Completada</Badge>}
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Grid.Col>
    </Grid>
  );
}
