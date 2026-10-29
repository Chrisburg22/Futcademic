'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconCalendarStats,
  IconDownload,
  IconPercentage,
  IconSearch,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useGetAttendancesByCategory } from '../../hooks/useAttendances';
import {
  FALTAS_SEGUIDAS_RIESGO,
  OPCIONES_PERIODO,
  PORCENTAJE_RIESGO,
  coincide,
  descargarCsv,
  estadisticasACsv,
  estadisticasPorAlumno,
  etiquetaTipo,
  filtrarRegistros,
  nivelAsistencia,
  ordenarEstadisticas,
  resumirCategoria,
  sesionesACsv,
  sesionesDeRegistros,
  type CampoOrdenAsistencia,
  type EstadisticaAlumno,
  type OrdenAsistencia,
  type Periodo,
  type TipoSesion,
  type VistaHistorico,
} from '../../lib/attendance';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import type { Attendance } from '../../types';

const SIN_REGISTROS: Attendance[] = [];

type Props = {
  categoryId: string;
  categoriaNombre?: string;
  /**
   * Periodo y vista pueden venir de fuera (la pantalla de asistencias los
   * guarda en la URL) o quedarse dentro, como en la ficha de la categoría.
   */
  periodo?: Periodo;
  onPeriodo?: (periodo: Periodo) => void;
  vista?: VistaHistorico;
  onVista?: (vista: VistaHistorico) => void;
  /** Abre el pase de lista de una sesión concreta. */
  onAbrirSesion?: (fecha: string, tipo: TipoSesion) => void;
  onAbrirAlumno?: (studentId: string) => void;
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

function Tendencia({ valores }: { valores: boolean[] }) {
  if (valores.length === 0) return null;
  return (
    <Group gap={3} wrap="nowrap" aria-label={`Últimas ${valores.length} sesiones`}>
      {valores.map((presente, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: presente
              ? 'var(--mantine-color-green-6)'
              : 'var(--mantine-color-red-6)',
          }}
        />
      ))}
    </Group>
  );
}

function Encabezado({
  campo,
  orden,
  onOrden,
  children,
}: {
  campo: CampoOrdenAsistencia;
  orden: OrdenAsistencia;
  onOrden: (campo: CampoOrdenAsistencia) => void;
  children: React.ReactNode;
}) {
  const activo = orden.campo === campo;
  const Icono = !activo ? IconArrowsSort : orden.direccion === 'asc' ? IconArrowUp : IconArrowDown;
  return (
    <Table.Th
      aria-sort={activo ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <UnstyledButton onClick={() => onOrden(campo)} style={{ font: 'inherit', fontWeight: 600 }}>
        <Group gap={4} wrap="nowrap">
          {children}
          <Icono size={14} opacity={activo ? 1 : 0.4} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function PorAlumno({
  estadisticas,
  onAbrirAlumno,
}: {
  estadisticas: EstadisticaAlumno[];
  onAbrirAlumno?: (studentId: string) => void;
}) {
  const [orden, setOrden] = useState<OrdenAsistencia>({ campo: 'porcentaje', direccion: 'asc' });
  const ordenadas = useMemo(() => ordenarEstadisticas(estadisticas, orden), [estadisticas, orden]);

  const cambiar = (campo: CampoOrdenAsistencia) =>
    setOrden((previo) =>
      previo.campo === campo
        ? { campo, direccion: previo.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: campo === 'nombre' ? 'asc' : 'desc' },
    );

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table highlightOnHover verticalSpacing="xs" stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Encabezado campo="nombre" orden={orden} onOrden={cambiar}>
              Alumno
            </Encabezado>
            <Encabezado campo="porcentaje" orden={orden} onOrden={cambiar}>
              Asistencia
            </Encabezado>
            <Table.Th ta="center">Asistió</Table.Th>
            <Encabezado campo="faltas" orden={orden} onOrden={cambiar}>
              Faltó
            </Encabezado>
            <Encabezado campo="seguidas" orden={orden} onOrden={cambiar}>
              Faltas seguidas
            </Encabezado>
            <Encabezado campo="ultima" orden={orden} onOrden={cambiar}>
              Última asistencia
            </Encabezado>
            <Table.Th>Tendencia</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {ordenadas.map((e) => {
            const nivel = nivelAsistencia(e.porcentaje);
            return (
              <Table.Tr
                key={e.studentId}
                style={onAbrirAlumno ? { cursor: 'pointer' } : undefined}
                onClick={onAbrirAlumno ? () => onAbrirAlumno(e.studentId) : undefined}
              >
                <Table.Td maw={260}>
                  <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={600} truncate>
                      {e.nombre}
                    </Text>
                    {e.enRiesgo && (
                      <Tooltip
                        label={`Menos de ${PORCENTAJE_RIESGO}% de asistencia o ${FALTAS_SEGUIDAS_RIESGO}+ faltas seguidas`}
                      >
                        <IconAlertTriangle
                          size={14}
                          color="var(--mantine-color-orange-6)"
                          aria-label="En riesgo"
                          tabIndex={0}
                        />
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={e.porcentaje} color={nivel.color} w={70} size="sm" aria-hidden />
                    <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {e.porcentaje}%
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td ta="center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {e.asistidas}
                </Table.Td>
                <Table.Td style={{ fontVariantNumeric: 'tabular-nums' }}>{e.faltas}</Table.Td>
                <Table.Td>
                  {e.faltasSeguidas > 0 ? (
                    <Badge
                      variant="light"
                      color={e.faltasSeguidas >= FALTAS_SEGUIDAS_RIESGO ? 'red' : 'yellow'}
                    >
                      {e.faltasSeguidas}
                    </Badge>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={e.ultimaAsistencia ? undefined : 'dimmed'}>
                    {e.ultimaAsistencia
                      ? dayjs(e.ultimaAsistencia).format('DD/MM/YYYY')
                      : 'Nunca'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Tendencia valores={e.tendencia} />
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function PorSesion({
  registros,
  busqueda,
  onAbrirSesion,
}: {
  registros: Attendance[];
  busqueda: string;
  onAbrirSesion?: (fecha: string, tipo: TipoSesion) => void;
}) {
  const sesiones = useMemo(() => sesionesDeRegistros(registros), [registros]);
  if (sesiones.length === 0) {
    return <EmptyState description="Sin sesiones en este periodo." />;
  }
  const nombre = (r: any) =>
    r.student?.full_name ||
    [r.student?.first_name, r.student?.last_name].filter(Boolean).join(' ') ||
    'Alumno';

  return (
    <Accordion variant="separated" radius="md">
      {sesiones.map((s) => {
        const nivel = nivelAsistencia(s.porcentaje);
        return (
          <Accordion.Item key={s.clave} value={s.clave}>
            <Accordion.Control>
              <Group justify="space-between" wrap="nowrap" pr="md" gap="sm">
                <Group gap="xs" wrap="nowrap">
                  <Text fw={500} size="sm">
                    {dayjs(s.date).format('ddd DD MMM YYYY')}
                  </Text>
                  <Badge variant="light" size="sm">
                    {etiquetaTipo(s.type)}
                  </Badge>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Progress value={s.porcentaje} w={70} size="sm" color={nivel.color} aria-hidden />
                  <Text size="xs" c="dimmed" w={96} ta="right">
                    {s.presentes}/{s.total} ({s.porcentaje}%)
                  </Text>
                </Group>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                {onAbrirSesion && (
                  <Group>
                    <Button
                      size="compact-sm"
                      variant="light"
                      onClick={() => onAbrirSesion(s.date, s.type as TipoSesion)}
                    >
                      Abrir pase de lista de este día
                    </Button>
                  </Group>
                )}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {(['presentes', 'ausentes'] as const).map((grupo) => {
                    const lista = s.registros
                      .filter((r) => (grupo === 'presentes' ? r.present : !r.present))
                      .filter((r) => coincide(nombre(r), busqueda))
                      .sort((a, b) => nombre(a).localeCompare(nombre(b), 'es'));
                    return (
                      <div key={grupo}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
                          {grupo === 'presentes' ? 'Asistieron' : 'Faltaron'} ({lista.length})
                        </Text>
                        {lista.length === 0 ? (
                          <Text size="sm" c="dimmed">
                            Nadie
                          </Text>
                        ) : (
                          <Stack gap={2}>
                            {lista.map((r) => (
                              <Text key={r.id} size="sm">
                                {nombre(r)}
                              </Text>
                            ))}
                          </Stack>
                        )}
                      </div>
                    );
                  })}
                </SimpleGrid>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/**
 * Histórico de una categoría. Responde dos preguntas distintas: «quién está
 * dejando de venir» (por alumno) y «cómo salió cada sesión» (por sesión).
 */
export function CategoryAttendanceHistory({
  categoryId,
  categoriaNombre,
  periodo: periodoExterno,
  onPeriodo,
  vista: vistaExterna,
  onVista,
  onAbrirSesion,
  onAbrirAlumno,
}: Props) {
  const { data, isLoading } = useGetAttendancesByCategory(categoryId);
  const registros = (data as Attendance[] | undefined) ?? SIN_REGISTROS;
  const [periodoPropio, setPeriodoPropio] = useState<Periodo>('90');
  const [vistaPropia, setVistaPropia] = useState<VistaHistorico>('alumnos');
  const periodo = periodoExterno ?? periodoPropio;
  const vista = vistaExterna ?? vistaPropia;
  const cambiarPeriodo = (valor: Periodo) =>
    onPeriodo ? onPeriodo(valor) : setPeriodoPropio(valor);
  const cambiarVista = (valor: VistaHistorico) => (onVista ? onVista(valor) : setVistaPropia(valor));
  const [tipo, setTipo] = useState<'todos' | TipoSesion>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [soloRiesgo, setSoloRiesgo] = useState(false);

  const delPeriodo = useMemo(
    () =>
      filtrarRegistros(registros, {
        periodo,
        tipo: tipo === 'todos' ? null : tipo,
      }),
    [registros, periodo, tipo],
  );

  const todasLasEstadisticas = useMemo(() => estadisticasPorAlumno(delPeriodo), [delPeriodo]);
  const resumen = useMemo(
    () => resumirCategoria(delPeriodo, todasLasEstadisticas),
    [delPeriodo, todasLasEstadisticas],
  );
  const estadisticas = useMemo(
    () =>
      todasLasEstadisticas.filter(
        (e) => coincide(e.nombre, busqueda) && (!soloRiesgo || e.enRiesgo),
      ),
    [todasLasEstadisticas, busqueda, soloRiesgo],
  );

  if (isLoading) return <LoadingState label="Cargando el histórico…" />;

  if (registros.length === 0) {
    return (
      <Card withBorder radius="md">
        <EmptyState
          title="Sin asistencias registradas"
          description="Aparecerán aquí en cuanto se guarde el primer pase de lista de esta categoría."
          icon={<IconCalendarStats size={32} />}
        />
      </Card>
    );
  }

  const nivel = nivelAsistencia(resumen.porcentaje);
  const sufijo = `${(categoriaNombre || 'categoria').replace(/\s+/g, '-').toLowerCase()}-${periodo}`;

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        <Kpi
          titulo="Sesiones"
          valor={resumen.sesiones}
          color="blue"
          icono={<IconCalendarStats size={18} />}
        />
        <Kpi
          titulo="Asistencia media"
          valor={`${resumen.porcentaje}%`}
          pie={nivel.label}
          color={nivel.color}
          icono={<IconPercentage size={18} />}
        />
        <Kpi
          titulo="Alumnos"
          valor={resumen.alumnos}
          pie={`${resumen.marcas} marcas`}
          color="grape"
          icono={<IconUsers size={18} />}
        />
        <Kpi
          titulo="En riesgo"
          valor={resumen.enRiesgo}
          pie={`< ${PORCENTAJE_RIESGO}% o ${FALTAS_SEGUIDAS_RIESGO}+ faltas seguidas`}
          color={resumen.enRiesgo ? 'orange' : 'gray'}
          icono={<IconAlertTriangle size={18} />}
        />
      </SimpleGrid>

      <Card withBorder radius="md" padding="sm">
        <Stack gap="sm">
          <Group align="flex-end" wrap="wrap" gap="sm">
            <Select
              w={190}
              label="Periodo"
              allowDeselect={false}
              value={periodo}
              onChange={(valor) => valor && cambiarPeriodo(valor as Periodo)}
              data={OPCIONES_PERIODO}
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                Tipo
              </Text>
              <SegmentedControl
                aria-label="Tipo de sesión"
                value={tipo}
                onChange={(valor) => setTipo(valor as 'todos' | TipoSesion)}
                data={[
                  { value: 'todos', label: 'Todas' },
                  { value: 'entrenamiento', label: 'Entrenos' },
                  { value: 'partido', label: 'Partidos' },
                ]}
              />
            </div>
            <TextInput
              style={{ flex: '1 1 200px' }}
              label="Buscar alumno"
              placeholder="Nombre del alumno"
              leftSection={<IconSearch size={16} />}
              value={busqueda}
              onChange={(e) => setBusqueda(e.currentTarget.value)}
              rightSection={
                busqueda ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Borrar búsqueda"
                    onClick={() => setBusqueda('')}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : undefined
              }
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                Ver
              </Text>
              <SegmentedControl
                aria-label="Forma de ver el histórico"
                value={vista}
                onChange={(valor) => cambiarVista(valor as VistaHistorico)}
                data={[
                  { value: 'alumnos', label: 'Por alumno' },
                  { value: 'sesiones', label: 'Por sesión' },
                ]}
              />
            </div>
          </Group>
          <Divider />
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Group gap="xs" wrap="wrap">
              <Text size="sm" c="dimmed" role="status" aria-live="polite">
                {vista === 'alumnos'
                  ? `${estadisticas.length} de ${resumen.alumnos} alumnos`
                  : `${resumen.sesiones} ${resumen.sesiones === 1 ? 'sesión' : 'sesiones'}`}
              </Text>
              {resumen.enRiesgo > 0 && vista === 'alumnos' && (
                <Button
                  size="compact-sm"
                  variant={soloRiesgo ? 'filled' : 'light'}
                  color="orange"
                  aria-pressed={soloRiesgo}
                  leftSection={<IconAlertTriangle size={14} />}
                  onClick={() => setSoloRiesgo((v) => !v)}
                >
                  Solo en riesgo ({resumen.enRiesgo})
                </Button>
              )}
            </Group>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<IconDownload size={14} />}
              onClick={() =>
                vista === 'alumnos'
                  ? descargarCsv(`asistencia-${sufijo}.csv`, estadisticasACsv(estadisticas))
                  : descargarCsv(
                      `sesiones-${sufijo}.csv`,
                      sesionesACsv(sesionesDeRegistros(delPeriodo)),
                    )
              }
            >
              Exportar CSV
            </Button>
          </Group>
        </Stack>
      </Card>

      {resumen.enRiesgo > 0 && !soloRiesgo && vista === 'alumnos' && (
        <Alert
          variant="light"
          color="orange"
          icon={<IconAlertTriangle size={18} />}
          title={`${resumen.enRiesgo} ${resumen.enRiesgo === 1 ? 'alumno está' : 'alumnos están'} dejando de venir`}
        >
          <Group gap="xs">
            <Text size="sm">
              Menos de {PORCENTAJE_RIESGO}% de asistencia o {FALTAS_SEGUIDAS_RIESGO} faltas
              seguidas. Conviene llamar al tutor antes de perderlos.
            </Text>
            <Button size="compact-xs" variant="light" color="orange" onClick={() => setSoloRiesgo(true)}>
              Ver solo esos
            </Button>
          </Group>
        </Alert>
      )}

      {delPeriodo.length === 0 ? (
        <Card withBorder radius="md">
          <EmptyState
            title="Sin registros en este periodo"
            description="Prueba con un periodo más amplio o cambia el tipo de sesión."
            action={
              <Button variant="light" onClick={() => cambiarPeriodo('todo')}>
                Ver todo el historial
              </Button>
            }
          />
        </Card>
      ) : vista === 'alumnos' ? (
        <Card withBorder radius="md" padding={0}>
          {estadisticas.length === 0 ? (
            <EmptyState
              title="Ningún alumno coincide"
              description="Cambia la búsqueda o quita el filtro de riesgo."
            />
          ) : (
            <PorAlumno estadisticas={estadisticas} onAbrirAlumno={onAbrirAlumno} />
          )}
        </Card>
      ) : (
        <PorSesion registros={delPeriodo} busqueda={busqueda} onAbrirSesion={onAbrirSesion} />
      )}
    </Stack>
  );
}
