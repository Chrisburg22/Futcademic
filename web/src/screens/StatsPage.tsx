'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconCalendar, IconCheck, IconFlame, IconTrophy, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useGetStudentStats } from '../hooks/useStudents';
import { useGetAttendancesByStudent } from '../hooks/useAttendances';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';
import { KpiCarousel, type KpiItem } from '../components/common/KpiCarousel';
import { TouchRow } from '../components/common/TouchRow';
import type { RegistroAsistencia } from '../components/attendance/AttendanceStrip';

const POR_PAGINA = 20;

/**
 * «Mis estadísticas» del alumno.
 *
 * Dos cosas que arreglar: el historial vivía en un `Table.ScrollContainer` con
 * `minWidth={400}`, o sea scroll lateral garantizado en un teléfono de 375 px, y
 * se cortaba en 50 filas sin forma de ver más. Las etiquetas abreviadas («Racha
 * máx») tampoco ayudaban a quien no usa apps.
 */
export function StatsPage() {
  const { profile } = useAuth();
  const { data: stats, isLoading, isError, refetch } = useGetStudentStats(profile?.id);
  const {
    data: attendances = [],
    isLoading: cargandoHistorial,
    isError: errorHistorial,
    refetch: recargarHistorial,
  } = useGetAttendancesByStudent(profile?.id);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const ordenados = useMemo(
    () =>
      [...(attendances as RegistroAsistencia[])].sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      ),
    [attendances],
  );

  const cabecera = <PageHeader title="Mis estadísticas" />;

  if (isLoading) {
    return (
      <>
        {cabecera}
        <SkeletonPage rows={3} heroHeight={100} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {cabecera}
        <ErrorState
          title="No pudimos cargar tus estadísticas"
          onRetry={() => refetch()}
        />
      </>
    );
  }

  const indicadores: KpiItem[] = stats
    ? [
        {
          key: 'racha',
          label: 'Racha actual',
          value: stats.currentStreak,
          icon: <IconFlame size={20} />,
          color: 'orange',
        },
        {
          key: 'maxima',
          label: 'Tu mejor racha',
          value: stats.maxStreak,
          icon: <IconFlame size={20} />,
          color: 'red',
        },
        {
          key: 'mes',
          label: 'Asististe este mes',
          value: `${stats.attendedThisMonth}/${stats.trainingsThisMonth}`,
          icon: <IconCalendar size={20} />,
          color: 'blue',
        },
        {
          key: 'logros',
          label: 'Logros',
          value: `${stats.achievementsUnlocked}/${stats.totalAchievements}`,
          icon: <IconTrophy size={20} />,
          color: 'yellow',
          href: '/achievements',
        },
      ]
    : [];

  const fila = (a: RegistroAsistencia, i: number) => (
    <TouchRow
      key={a.id ?? `${a.date}-${i}`}
      leading={
        <ThemeIcon size={40} radius="xl" variant="light" color={a.present ? 'teal' : 'red'}>
          {a.present ? <IconCheck size={20} /> : <IconX size={20} />}
        </ThemeIcon>
      }
      title={dayjs(a.date).format('dddd D [de] MMMM')}
      subtitle={a.present ? 'Asististe' : 'Faltaste'}
      tags={
        a.type ? (
          <Badge variant="light" tt="capitalize">
            {a.type}
          </Badge>
        ) : undefined
      }
      withChevron={false}
    />
  );

  return (
    <>
      {cabecera}

      {indicadores.length > 0 && (
        <Box mb="md">
          <KpiCarousel items={indicadores} aria-label="Tus números" />
        </Box>
      )}

      <Stack gap="sm">
        <Text fw={600}>Historial de asistencia</Text>

        {errorHistorial ? (
          <ErrorState
            title="No pudimos cargar tu historial"
            onRetry={() => recargarHistorial()}
          />
        ) : cargandoHistorial ? (
          <SkeletonPage rows={3} heroHeight={0} />
        ) : ordenados.length === 0 ? (
          <EmptyState
            title="Todavía no hay sesiones"
            description="Cuando tu entrenador pase lista, aquí verás si asististe."
          />
        ) : (
          <>
            {/* En teléfono, filas tocables; la tabla se queda para escritorio,
                donde sí cabe sin scroll lateral. */}
            <Box hiddenFrom="sm">
              <Stack gap="xs">
                {ordenados.slice(0, visibles).map(fila)}
                {visibles < ordenados.length && (
                  <Button variant="default" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
                    Ver más
                  </Button>
                )}
              </Stack>
            </Box>

            <Box visibleFrom="sm">
              <Card withBorder padding={0} radius="md">
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Asistió</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ordenados.slice(0, 50).map((a, i) => (
                      <Table.Tr key={a.id ?? `${a.date}-${i}`}>
                        <Table.Td>{dayjs(a.date).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" size="sm" tt="capitalize">
                            {a.type}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            {a.present ? <IconCheck size={16} /> : <IconX size={16} />}
                            <Text size="sm">{a.present ? 'Sí' : 'No'}</Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Box>
          </>
        )}
      </Stack>
    </>
  );
}
