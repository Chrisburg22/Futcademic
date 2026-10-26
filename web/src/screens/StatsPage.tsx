import { Card, Grid, Group, Stack, Text, ThemeIcon, Table, Badge } from '@mantine/core';
import { IconFlame, IconCalendar, IconTrophy } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useGetStudentStats } from '../hooks/useStudents';
import { useGetAttendancesByStudent } from '../hooks/useAttendances';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';

export function StatsPage() {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useGetStudentStats(profile?.id);
  const { data: attendances = [] } = useGetAttendancesByStudent(profile?.id);

  if (isLoading) return <LoadingState />;

  return (
    <>
      <PageHeader title="Mis estadísticas" />
      {stats && (
        <Grid mb="md">
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder padding="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size={36} radius="md" variant="light" color="orange">
                  <IconFlame size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Racha actual</Text>
                  <Text fw={700} size="lg">{stats.currentStreak}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder padding="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size={36} radius="md" variant="light" color="red">
                  <IconFlame size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Racha máx</Text>
                  <Text fw={700} size="lg">{stats.maxStreak}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder padding="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size={36} radius="md" variant="light" color="blue">
                  <IconCalendar size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Este mes</Text>
                  <Text fw={700} size="lg">{stats.attendedThisMonth}/{stats.trainingsThisMonth}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card withBorder padding="md" radius="md">
              <Group gap="sm">
                <ThemeIcon size={36} radius="md" variant="light" color="yellow">
                  <IconTrophy size={18} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Logros</Text>
                  <Text fw={700} size="lg">{stats.achievementsUnlocked}/{stats.totalAchievements}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      <Card withBorder padding={0} radius="md">
        <Text fw={600} p="md" pb={0}>Historial de asistencia</Text>
        {attendances.length === 0 ? (
          <Text p="md" c="dimmed" size="sm">Sin registros</Text>
        ) : (
          <Table.ScrollContainer minWidth={400}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Asistió</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {attendances.slice(0, 50).map((a: any) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{dayjs(a.date).format('DD/MM/YYYY')}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm" tt="capitalize">{a.type}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={a.present ? 'green' : 'red'} variant="light" size="sm">
                        {a.present ? 'Sí' : 'No'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </>
  );
}
