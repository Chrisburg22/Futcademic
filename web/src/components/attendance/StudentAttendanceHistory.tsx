'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendarCheck,
  IconCalendarStats,
  IconCheck,
  IconDownload,
  IconFlame,
  IconPercentage,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useGetAttendancesByStudent } from '../../hooks/useAttendances';
import {
  FALTAS_SEGUIDAS_RIESGO,
  OPCIONES_PERIODO,
  PORCENTAJE_RIESGO,
  asistenciaPorMes,
  descargarCsv,
  enPeriodo,
  estadisticaDeRegistros,
  etiquetaTipo,
  nivelAsistencia,
  registrosACsv,
  type Periodo,
  type RegistroAlumno,
  type TipoSesion,
} from '../../lib/attendance';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { TouchRow } from '../common/TouchRow';
import { AttendanceStrip } from './AttendanceStrip';

const TAMANO_PAGINA = 20;

type Props = {
  studentId: string;
  /** Para nombrar el CSV y los textos; opcional. */
  nombre?: string | null;
};

function Kpi({
  titulo,
  valor,
  pie,
  color,
  icono,
}: {
  titulo: string;
  valor: string | number;
  pie?: string;
  color: string;
  icono: React.ReactNode;
}) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={34} radius="md" variant="light" color={color}>
          {icono}
        </ThemeIcon>
        <div style={{ minWidth: 0 }}>
          <Text fw={700} size="xl" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {valor}
          </Text>
          <Text size="xs" c="dimmed" lh={1.3}>
            {titulo}
          </Text>
          {pie && (
            <Text size="xs" c="dimmed" lh={1.3} truncate>
              {pie}
            </Text>
          )}
        </div>
      </Group>
    </Paper>
  );
}

/**
 * Historial de asistencia de un alumno: cuánto viene, en qué meses dejó de
 * venir y cada sesión registrada. Lo usan la ficha del alumno y la pantalla
 * del padre, que consultan el mismo endpoint.
 */
export function StudentAttendanceHistory({ studentId, nombre }: Props) {
  const { data, isLoading, isError, refetch } = useGetAttendancesByStudent(studentId);
  const [periodo, setPeriodo] = useState<Periodo>('90');
  const [tipo, setTipo] = useState<'todos' | TipoSesion>('todos');
  const [visibles, setVisibles] = useState(TAMANO_PAGINA);

  const todos: RegistroAlumno[] = useMemo(
    () =>
      ((data || []) as any[]).map((r) => ({
        id: r.id,
        date: dayjs(r.date).format('YYYY-MM-DD'),
        type: r.type,
        present: !!r.present,
      })),
    [data],
  );

  const filtrados = useMemo(
    () =>
      todos.filter(
        (r) => (tipo === 'todos' || r.type === tipo) && enPeriodo(r.date, periodo),
      ),
    [todos, periodo, tipo],
  );

  const stat = useMemo(
    () => estadisticaDeRegistros(filtrados, { studentId, nombre: nombre || 'Alumno' }),
    [filtrados, nombre, studentId],
  );
  const meses = useMemo(() => asistenciaPorMes(filtrados), [filtrados]);
  const recientes = useMemo(
    () => [...filtrados].sort((a, b) => b.date.localeCompare(a.date)),
    [filtrados],
  );

  if (isLoading) return <Skeleton height={260} radius="md" />;

  /*
   * Un fallo de red caía en el estado vacío y decía «Sin asistencias
   * registradas»: le miente al usuario y además lo deja sin salida.
   */
  if (isError) {
    return (
      <Card withBorder radius="md">
        <ErrorState
          title="No pudimos cargar la asistencia"
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  if (todos.length === 0) {
    return (
      <Card withBorder radius="md">
        <EmptyState
          title="Sin asistencias registradas"
          description="Aparecerán aquí cuando el profesor pase lista."
          icon={<IconCalendarCheck size={32} />}
        />
      </Card>
    );
  }

  const nivel = nivelAsistencia(stat.porcentaje);

  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="sm">
        <Group align="flex-end" wrap="wrap" gap="sm">
          <Select
            w={190}
            label="Periodo"
            allowDeselect={false}
            value={periodo}
            onChange={(valor) => {
              if (!valor) return;
              setPeriodo(valor as Periodo);
              setVisibles(TAMANO_PAGINA);
            }}
            data={OPCIONES_PERIODO}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              Tipo
            </Text>
            <SegmentedControl
              aria-label="Tipo de sesión"
              value={tipo}
              onChange={(valor) => {
                setTipo(valor as 'todos' | TipoSesion);
                setVisibles(TAMANO_PAGINA);
              }}
              data={[
                { value: 'todos', label: 'Todas' },
                { value: 'entrenamiento', label: 'Entrenos' },
                { value: 'partido', label: 'Partidos' },
              ]}
            />
          </div>
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            onClick={() =>
              descargarCsv(
                `asistencia-${(nombre || 'alumno').replace(/\s+/g, '-').toLowerCase()}.csv`,
                registrosACsv(filtrados),
              )
            }
          >
            Exportar CSV
          </Button>
        </Group>
      </Card>

      {filtrados.length === 0 ? (
        <Card withBorder radius="md">
          <EmptyState
            title="Sin registros en este periodo"
            description="Prueba con un periodo más amplio."
            action={
              <Button variant="light" onClick={() => setPeriodo('todo')}>
                Ver todo el historial
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            <Kpi
              titulo="Asistencia"
              valor={`${stat.porcentaje}%`}
              pie={nivel.label}
              color={nivel.color}
              icono={<IconPercentage size={18} />}
            />
            <Kpi
              titulo="Asistió"
              valor={stat.asistidas}
              pie={`de ${stat.sesiones} sesiones`}
              color="green"
              icono={<IconCalendarCheck size={18} />}
            />
            <Kpi titulo="Faltó" valor={stat.faltas} color="red" icono={<IconX size={18} />} />
            <Kpi
              titulo="Faltas seguidas"
              valor={stat.faltasSeguidas}
              pie={
                stat.ultimaAsistencia
                  ? `Última: ${dayjs(stat.ultimaAsistencia).format('DD/MM/YYYY')}`
                  : 'Nunca ha asistido'
              }
              color={stat.faltasSeguidas >= FALTAS_SEGUIDAS_RIESGO ? 'orange' : 'gray'}
              icono={<IconFlame size={18} />}
            />
          </SimpleGrid>

          {/*
            La tendencia de un golpe, antes de cualquier tabla: ni un alumno ni
            un padre lee cincuenta filas para saber si está yendo.
          */}
          <Card withBorder radius="md" padding="md">
            <Stack gap="sm">
              <Text fw={600}>Últimas sesiones</Text>
              <AttendanceStrip registros={recientes} />
            </Stack>
          </Card>

          {stat.enRiesgo && (
            <Alert variant="light" color="orange" icon={<IconAlertTriangle size={18} />}>
              Está por debajo del {PORCENTAJE_RIESGO}% de asistencia o lleva{' '}
              {FALTAS_SEGUIDAS_RIESGO} faltas seguidas. Conviene hablar con el tutor.
            </Alert>
          )}

          {meses.length > 1 && (
            <Card withBorder radius="md" padding="md">
              <Group gap="xs" mb="sm">
                <IconCalendarStats size={18} />
                <Text fw={600}>Asistencia por mes</Text>
              </Group>
              <Stack gap="xs">
                {meses.map((m) => {
                  const nivelMes = nivelAsistencia(m.porcentaje);
                  return (
                    <Group key={m.mes} gap="sm" wrap="nowrap">
                      <Text size="sm" w={90} tt="capitalize">
                        {m.etiqueta}
                      </Text>
                      <Progress
                        value={m.porcentaje}
                        color={nivelMes.color}
                        size="md"
                        style={{ flex: 1 }}
                        aria-label={`${m.etiqueta}: ${m.porcentaje}%`}
                      />
                      <Text size="sm" w={110} ta="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {m.porcentaje}%{' '}
                        <Text span size="xs" c="dimmed">
                          ({m.asistidas}/{m.sesiones})
                        </Text>
                      </Text>
                    </Group>
                  );
                })}
              </Stack>
            </Card>
          )}

          <Card withBorder radius="md" padding={0}>
            <Group justify="space-between" p="sm">
              <Text fw={600}>Sesiones registradas</Text>
              <Text size="sm" c="dimmed">
                {filtrados.length}
              </Text>
            </Group>
            <Divider />
            {/*
              En teléfono, filas táctiles: la tabla obligaba a desplazarse a lo
              ancho (`minWidth={360}`) en una pantalla de 375 px. Las dos ramas
              se montan siempre y las elige el CSS, para que no haya parpadeo en
              el primer pintado.
            */}
            <Box hiddenFrom="sm" p="sm">
              <Stack gap="xs">
                {recientes.slice(0, visibles).map((r) => (
                  <TouchRow
                    key={r.id}
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
                    subtitle={r.present ? 'Asistió' : 'Faltó'}
                    tags={
                      <Badge variant="light" size="sm">
                        {etiquetaTipo(r.type)}
                      </Badge>
                    }
                    withChevron={false}
                  />
                ))}
              </Stack>
            </Box>

            <Box visibleFrom="sm">
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Asistencia</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recientes.slice(0, visibles).map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>{dayjs(r.date).format('ddd DD/MM/YYYY')}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {etiquetaTipo(r.type)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={r.present ? 'green' : 'red'} variant="light" size="sm">
                          {r.present ? 'Asistió' : 'Faltó'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
            {recientes.length > visibles && (
              <Group justify="center" p="sm">
                <Button variant="subtle" onClick={() => setVisibles((v) => v + TAMANO_PAGINA)}>
                  Ver más ({recientes.length - visibles} restantes)
                </Button>
              </Group>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}
