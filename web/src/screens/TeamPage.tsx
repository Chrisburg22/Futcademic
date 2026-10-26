import { Card, Group, Stack, Text, Avatar, Badge } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useGetStudentTeam } from '../hooks/useStudents';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

export function TeamPage() {
  const { profile } = useAuth();
  const { data: team, isLoading } = useGetStudentTeam(profile?.id);

  return (
    <>
      <PageHeader title="Mi equipo" />
      {isLoading ? (
        <LoadingState />
      ) : !team ? (
        <EmptyState description="No estás asignado a un equipo." />
      ) : (
        <Stack>
          <Card withBorder padding="lg" radius="md">
            <Group gap="xs" mb="sm">
              <IconUsers size={18} />
              <Text fw={600} size="lg">
                {team.teamName || 'Equipo'}
              </Text>
              {team.color && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: team.color,
                  }}
                />
              )}
            </Group>
            {team.birthYear && (
              <Text size="sm" c="dimmed" mb="sm">
                Año {team.birthYear}
              </Text>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text fw={600} mb="xs">
              Compañeros
            </Text>
            {(team.teammates || []).length === 0 ? (
              <Text size="sm" c="dimmed">Sin compañeros</Text>
            ) : (
              <Stack gap="xs">
                {team.teammates.map((t: any) => (
                  <Group key={t.id} gap="sm">
                    <Avatar size="sm" radius="xl" src={t.avatar_url || undefined}>
                      {t.full_name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Text size="sm">{t.full_name}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Text fw={600} mb="xs">
              Profesores
            </Text>
            <Group gap="xs">
              {(team.teachers || []).map((t: any) => (
                <Badge key={t.id} variant="light" color="violet">
                  {t.full_name}
                </Badge>
              ))}
            </Group>
          </Card>

          {(team.schedules || []).length > 0 && (
            <Card withBorder padding="lg" radius="md">
              <Text fw={600} mb="xs">Horarios</Text>
              <Stack gap="xs">
                {team.schedules.map((s: any, i: number) => (
                  <Text key={i} size="sm">
                    {s.day} — {s.start_time} {s.venue ? `(${s.venue})` : ''}
                  </Text>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      )}
    </>
  );
}
