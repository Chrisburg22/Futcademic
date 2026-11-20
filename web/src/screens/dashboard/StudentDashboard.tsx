'use client';

import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconCalendar,
  IconCalendarOff,
  IconFlame,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-react';
import { useGetAlumnoDashboard } from '../../hooks/useDashboard';
import { KpiCarousel, type KpiItem } from '../../components/common/KpiCarousel';
import { ErrorState } from '../../components/common/ErrorState';
import { SkeletonPage } from '../../components/common/SkeletonPage';

/**
 * Inicio del alumno.
 *
 * Antes eran cuatro tarjetas de indicadores sin una sola acción ni un enlace: ni
 * a sus estadísticas, ni a su equipo, ni a sus logros. Y si la petición fallaba
 * pintaba ceros (`?? 0`), que se lee como «no has entrenado nunca».
 *
 * Ahora lo primero responde la única pregunta del día —¿tengo entrenamiento y a
 * qué hora?— y cada indicador lleva a su pantalla.
 */
export function StudentDashboard() {
  const { data: dash, isLoading, isError, refetch } = useGetAlumnoDashboard();

  if (isLoading) return <SkeletonPage rows={2} heroHeight={120} />;

  if (isError) {
    return (
      <ErrorState
        title="No pudimos cargar tu información"
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => refetch()}
      />
    );
  }

  const indicadores: KpiItem[] = [
    {
      key: 'racha',
      label: 'Sesiones seguidas',
      value: dash?.currentStreak ?? 0,
      icon: <IconFlame size={20} />,
      color: 'orange',
      href: '/stats',
    },
    {
      key: 'mes',
      label: 'Entrenamientos este mes',
      value: dash?.trainingsThisMonth ?? 0,
      icon: <IconCalendar size={20} />,
      color: 'blue',
      href: '/attendance',
    },
    {
      key: 'logros',
      label: 'Logros desbloqueados',
      value: dash?.achievementsUnlocked ?? 0,
      icon: <IconTrophy size={20} />,
      color: 'yellow',
      href: '/achievements',
    },
    {
      key: 'categoria',
      label: 'Tu categoría',
      value: dash?.category ?? '—',
      icon: <IconUsers size={20} />,
      color: 'teal',
      href: '/team',
    },
  ];

  const proximo = dash?.nextTraining;

  return (
    <Stack gap="md">
      {/* Lo único que un alumno abre la app para saber. */}
      <Card withBorder radius="md" padding="lg">
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon size={52} radius="md" variant="light" color={proximo ? 'futcamedic' : 'gray'}>
            {proximo ? <IconCalendar size={26} /> : <IconCalendarOff size={26} />}
          </ThemeIcon>
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text size="sm" c="dimmed">
              Tu próximo entrenamiento
            </Text>
            {proximo ? (
              <Text fw={700} fz={22} lh={1.2} style={{ overflowWrap: 'anywhere' }}>
                {proximo}
              </Text>
            ) : (
              <>
                <Text fw={700} fz={22} lh={1.2}>
                  Sin entrenamiento programado
                </Text>
                <Text size="sm" c="dimmed">
                  Tu entrenador lo publicará aquí.
                </Text>
              </>
            )}
            {dash?.category && (
              <Badge variant="light" size="lg" mt={4}>
                {dash.category}
              </Badge>
            )}
          </Stack>
        </Group>
      </Card>

      <KpiCarousel items={indicadores} aria-label="Tus números" />
    </Stack>
  );
}
