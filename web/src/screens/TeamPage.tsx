import { Avatar, Card, Group, Stack, Text } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useGetStudentTeam } from '../hooks/useStudents';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { CategorySummary } from '../components/categories/CategorySummary';

export function TeamPage() {
  const { profile } = useAuth();
  const { data: team, isLoading } = useGetStudentTeam(profile?.id);

  return (
    <>
      <PageHeader title="Mi equipo" description="Tu categoría, entrenadores y horario" />
      {isLoading ? (
        <LoadingState />
      ) : !team ? (
        <EmptyState description="No estás asignado a un equipo." />
      ) : (
        <Stack>
          {/* `getStudentTeam` devuelve los entrenadores como {id, name, avatar}
              y los horarios como {name, time, venue}; antes esta pantalla leía
              `full_name`, `day` y `start_time`, así que salían vacíos. */}
          <CategorySummary
            nombre={team.teamName || 'Equipo'}
            color={team.color}
            anios={team.birthYear ? String(team.birthYear) : undefined}
            jugadores={team.totalTeammates}
            entrenadores={(team.teachers || []).map((t: any) => ({
              id: t.id,
              nombre: t.name,
              avatar: t.avatar,
            }))}
            horario={(team.schedules || []).map((s: any) => ({
              id: s.id,
              nombre: s.name,
              hora: s.time,
              cancha: s.venue,
            }))}
          />

          <Card withBorder padding="lg" radius="md">
            <Text fw={600} mb="xs">
              Compañeros
            </Text>
            {(team.teammates || []).length === 0 ? (
              <Text size="sm" c="dimmed">
                Sin compañeros
              </Text>
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
        </Stack>
      )}
    </>
  );
}
