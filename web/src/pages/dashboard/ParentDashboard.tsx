import { Card, Stack, Title, Text, Group, Avatar, Grid, Badge, ThemeIcon, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGetMyChildren } from '../../hooks/useStudents';
import { useGetPadreDashboard } from '../../hooks/useDashboard';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export function ParentDashboard() {
  const { data: children = [], isLoading } = useGetMyChildren();
  const { data: dash } = useGetPadreDashboard();

  if (isLoading) return <LoadingState />;

  return (
    <>
      {dash?.paymentAlert && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" mb="md">
          {dash.paymentAlert}
        </Alert>
      )}
      <Title order={3} mb="md">
        Mis hijos
      </Title>
      {children.length === 0 ? (
        <EmptyState description="Aún no hay alumnos vinculados a tu cuenta." />
      ) : (
        <Grid>
          {children.map((c: any) => (
            <Grid.Col key={c.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder padding="lg" radius="md">
                <Stack gap="xs">
                  <Group>
                    <Avatar src={c.avatar_url || undefined} radius="xl" size="lg">
                      {c.full_name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                      <Text fw={600}>{c.full_name}</Text>
                      <Text size="xs" c="dimmed">
                        {c.category?.name || 'Sin categoría'}
                      </Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    <Badge
                      component={Link}
                      to={`/attendance?student_id=${c.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      Asistencias
                    </Badge>
                    <Badge
                      component={Link}
                      to={`/finances?student_id=${c.id}`}
                      style={{ cursor: 'pointer' }}
                      color="orange"
                    >
                      Pagos
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </>
  );
}
