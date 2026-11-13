'use client';

import { Badge, Card, Grid, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconLock, IconTrophy } from '@tabler/icons-react';
import { useGetAchievements } from '../hooks/useAchievements';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';

/**
 * Logros del alumno.
 *
 * Antes el progreso vivía solo como texto en la cabecera y los bloqueados se
 * distinguían **solo** por `opacity: 0.55`, que no es una señal: ahora llevan
 * candado y dicen qué falta. Y la rejilla pasa a dos columnas en teléfono:
 * medallas grandes se escanean mejor que una columna de tarjetas anchas.
 */
export function AchievementsPage() {
  const { data, isLoading, isError, refetch } = useGetAchievements();

  const cabecera = <PageHeader title="Logros" />;

  if (isLoading) {
    return (
      <>
        {cabecera}
        <SkeletonPage rows={3} heroHeight={60} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {cabecera}
        <ErrorState title="No pudimos cargar tus logros" onRetry={() => refetch()} />
      </>
    );
  }

  if (!data || data.achievements.length === 0) {
    return (
      <>
        {cabecera}
        <EmptyState
          title="Todavía no hay logros"
          description="La academia irá publicando retos para desbloquear."
        />
      </>
    );
  }

  const porcentaje = data.totalCount
    ? Math.round((data.unlockedCount / data.totalCount) * 100)
    : 0;

  return (
    <>
      {cabecera}

      <Card withBorder radius="md" padding="lg" mb="md">
        <Stack gap="xs">
          <Text fw={700} fz={22} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {data.unlockedCount} de {data.totalCount} desbloqueados
          </Text>
          <Progress
            value={porcentaje}
            size="lg"
            radius="xl"
            color="yellow"
            aria-label={`Progreso de logros: ${porcentaje}%`}
          />
        </Stack>
      </Card>

      <Grid>
        {data.achievements.map((a) => (
          <Grid.Col key={a.id} span={{ base: 6, sm: 4 }}>
            <Card withBorder padding="md" radius="md" h="100%">
              <Stack gap="xs" align="center">
                <ThemeIcon
                  size={56}
                  radius="xl"
                  variant="light"
                  color={a.unlocked ? 'yellow' : 'gray'}
                >
                  {a.unlocked ? <IconTrophy size={28} /> : <IconLock size={28} />}
                </ThemeIcon>
                <Text fw={600} ta="center" lh={1.25} style={{ overflowWrap: 'anywhere' }}>
                  {a.name}
                </Text>
                {a.description && (
                  <Text size="sm" c="dimmed" ta="center" lh={1.3}>
                    {a.description}
                  </Text>
                )}
                {a.unlocked ? (
                  <Badge variant="light" color="teal" leftSection={<IconTrophy size={14} />}>
                    {a.unlocked_at
                      ? `Logrado el ${new Date(a.unlocked_at).toLocaleDateString('es-MX')}`
                      : 'Logrado'}
                  </Badge>
                ) : (
                  // Icono y palabra, no solo opacidad: el estado tiene que
                  // leerse, no deducirse del color.
                  <Badge variant="light" color="gray" leftSection={<IconLock size={14} />}>
                    Te falta
                  </Badge>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </>
  );
}
