'use client';

import { useMemo, useState } from 'react';
import { Badge, Card, Group, Progress, Stack, Text, ThemeIcon, Button } from '@mantine/core';
import { IconCalendarCheck, IconCheck, IconFlame, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useGetAttendancesByStudent } from '../hooks/useAttendances';
import { useGetStudentStats } from '../hooks/useStudents';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonPage } from '../components/common/SkeletonPage';
import { TouchRow } from '../components/common/TouchRow';
import { AttendanceStrip, type RegistroAsistencia } from '../components/attendance/AttendanceStrip';

const POR_PAGINA = 20;
const DIAS = 90;

/**
 * «Mi asistencia» del alumno.
 *
 * Antes esta ruta no existía: un alumno que entraba a `/attendance` aterrizaba
 * en el pase de lista del profesor, con selector de categoría y switches para
 * marcar a sus compañeros. Aquí solo ve lo suyo, y lo ve como una tira de
 * sesiones en vez de una tabla con scroll lateral.
 */
export function StudentAttendancePage() {
  const { profile } = useAuth();
  const {
    data: registros = [],
    isLoading,
    isError,
    refetch,
  } = useGetAttendancesByStudent(profile?.id);
  const { data: stats } = useGetStudentStats(profile?.id);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const ordenados = useMemo(
    () =>
      [...(registros as RegistroAsistencia[])].sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
      ),
    [registros],
  );

  const ultimos90 = useMemo(() => {
    const desde = dayjs().subtract(DIAS, 'day');
    const dentro = ordenados.filter((r) => dayjs(r.date).isAfter(desde));
    const asistidas = dentro.filter((r) => r.present).length;
    return {
      total: dentro.length,
      asistidas,
      porcentaje: dentro.length ? Math.round((asistidas / dentro.length) * 100) : null,
    };
  }, [ordenados]);

  const cabecera = (
    <PageHeader title="Mi asistencia" description={`Tus últimas sesiones y cómo vas`} />
  );

  if (isLoading) {
    return (
      <>
        {cabecera}
        <SkeletonPage rows={4} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {cabecera}
        <ErrorState
          title="No pudimos cargar tu asistencia"
          description="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => refetch()}
        />
      </>
    );
  }

  if (ordenados.length === 0) {
    return (
      <>
        {cabecera}
        <EmptyState
          icon={<IconCalendarCheck size={32} />}
          title="Todavía no hay sesiones"
          description="Cuando tu entrenador pase lista, aquí verás si asististe."
        />
      </>
    );
  }

  const color =
    ultimos90.porcentaje == null
      ? 'gray'
      : ultimos90.porcentaje >= 80
        ? 'teal'
        : ultimos90.porcentaje >= 60
          ? 'yellow'
          : 'orange';

  return (
    <>
      {cabecera}

      <Stack gap="md">
        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Tus últimos {DIAS} días
            </Text>
            <Group gap="sm" align="baseline" wrap="nowrap">
              <Text fw={700} fz={44} lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {ultimos90.porcentaje != null ? `${ultimos90.porcentaje}%` : '—'}
              </Text>
              <Text size="sm" c="dimmed">
                {ultimos90.asistidas} de {ultimos90.total} sesiones
              </Text>
            </Group>
            <Progress
              value={ultimos90.porcentaje ?? 0}
              color={color}
              size="lg"
              radius="xl"
              aria-label={`Asistencia de los últimos ${DIAS} días: ${ultimos90.porcentaje ?? 0}%`}
            />
            {stats && (
              <Group gap="xs" wrap="wrap">
                <Badge
                  size="lg"
                  variant="light"
                  color="orange"
                  tt="none"
                  leftSection={<IconFlame size={16} />}
                >
                  Racha de {stats.currentStreak}
                </Badge>
                <Badge size="lg" variant="light" color="gray" tt="none">
                  Tu mejor racha: {stats.maxStreak}
                </Badge>
              </Group>
            )}
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>Tus últimas sesiones</Text>
            <AttendanceStrip registros={ordenados} />
          </Stack>
        </Card>

        <Stack gap="xs">
          <Text fw={600}>Todo el historial</Text>
          {ordenados.slice(0, visibles).map((r, i) => (
            <TouchRow
              key={r.id ?? `${r.date}-${i}`}
              leading={
                <ThemeIcon
                  size={40}
                  radius="xl"
                  variant="light"
                  color={r.present ? 'teal' : 'red'}
                >
                  {r.present ? <IconCheck size={20} /> : <IconX size={20} />}
                </ThemeIcon>
              }
              title={dayjs(r.date).format('dddd D [de] MMMM')}
              subtitle={r.present ? 'Asististe' : 'Faltaste'}
              tags={
                r.type ? (
                  <Badge variant="light" tt="capitalize">
                    {r.type}
                  </Badge>
                ) : undefined
              }
              withChevron={false}
            />
          ))}
          {visibles < ordenados.length && (
            <Button
              variant="default"
              onClick={() => setVisibles((v) => v + POR_PAGINA)}
              aria-label={`Ver ${POR_PAGINA} sesiones más`}
            >
              Ver más
            </Button>
          )}
        </Stack>
      </Stack>
    </>
  );
}
