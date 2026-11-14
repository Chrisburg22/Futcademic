'use client';

import { Avatar, Card, Stack, Text } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useGetStudentTeam } from '../hooks/useStudents';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';
import { TouchRow } from '../components/common/TouchRow';
import { CategorySummary } from '../components/categories/CategorySummary';

/**
 * «Mi equipo» del alumno.
 *
 * Un fallo de la petición caía antes en la rama `!team` y mostraba «No estás
 * asignado a un equipo»: mentirle al alumno sobre su propia categoría. Ahora el
 * error se distingue del vacío y se puede reintentar.
 */
export function TeamPage() {
  const { profile } = useAuth();
  const { data: team, isLoading, isError, refetch } = useGetStudentTeam(profile?.id);

  const cabecera = (
    <PageHeader title="Mi equipo" description="Tu horario, tu cancha y tus compañeros" />
  );

  if (isLoading) {
    return (
      <>
        {cabecera}
        <SkeletonPage rows={2} heroHeight={160} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {cabecera}
        <ErrorState title="No pudimos cargar tu equipo" onRetry={() => refetch()} />
      </>
    );
  }

  if (!team) {
    return (
      <>
        {cabecera}
        <EmptyState
          title="Todavía no tienes equipo"
          description="Cuando la academia te asigne una categoría, aquí verás tu horario y tus compañeros."
        />
      </>
    );
  }

  const companeros = (team.teammates || []) as any[];

  return (
    <>
      {cabecera}
      <Stack gap="md">
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

        <Stack gap="xs">
          <Text fw={600}>Compañeros</Text>
          {companeros.length === 0 ? (
            <Card withBorder radius="md" padding="lg">
              <Text size="sm" c="dimmed">
                Todavía eres el único en tu categoría.
              </Text>
            </Card>
          ) : (
            companeros.map((t) => (
              <TouchRow
                key={t.id}
                leading={
                  <Avatar size={40} radius="xl" src={t.avatar_url || undefined}>
                    {t.full_name?.[0]?.toUpperCase()}
                  </Avatar>
                }
                title={t.full_name}
                withChevron={false}
              />
            ))
          )}
        </Stack>
      </Stack>
    </>
  );
}
