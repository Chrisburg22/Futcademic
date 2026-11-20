'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Menu,
  Progress,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCheck,
  IconColumns3,
  IconHeartbeat,
  IconPhone,
  IconSearch,
  IconUserOff,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  MARCAS,
  coincide,
  marcaDe,
  nivelAsistencia,
  type EstadisticaAlumno,
  type Marca,
  type MarcasPorAlumno,
} from '../../lib/attendance';
import {
  ESTADOS_ALUMNO,
  calcularEdad,
  enlaceWhatsapp,
  iniciales,
  nombreTutor,
  normalizarEstado,
} from '../../lib/students';
import { useLocalPref } from '../../hooks/useLocalPref';
import { EmptyState } from '../common/EmptyState';
import type { Student } from '../../types';

export type ColumnaPase = 'historico' | 'ultima' | 'seguidas' | 'salud' | 'contacto' | 'estado';

const COLUMNAS: { clave: ColumnaPase; titulo: string; soloAdmin?: boolean }[] = [
  { clave: 'historico', titulo: 'Asistencia histórica' },
  { clave: 'seguidas', titulo: 'Faltas seguidas' },
  { clave: 'ultima', titulo: 'Última asistencia' },
  { clave: 'salud', titulo: 'Notas médicas' },
  { clave: 'contacto', titulo: 'Contacto del tutor' },
  { clave: 'estado', titulo: 'Estado del alumno', soloAdmin: true },
];

/** Lo que cabe sin scroll horizontal; el resto se enciende a mano. */
const COLUMNAS_INICIALES: ColumnaPase[] = ['historico', 'seguidas'];

type OrdenPase = 'nombre' | 'sin_marcar' | 'asistencia' | 'seguidas';

const OPCIONES_ORDEN: { value: OrdenPase; label: string }[] = [
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'sin_marcar', label: 'Sin marcar primero' },
  { value: 'asistencia', label: 'Peor asistencia primero' },
  { value: 'seguidas', label: 'Más faltas seguidas' },
];

const OPCIONES_MARCA: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'presente', label: 'Presentes' },
  { value: 'ausente', label: 'Ausentes' },
  { value: 'sin_marcar', label: 'Sin marcar' },
];

type Props = {
  alumnos: Student[];
  marcas: MarcasPorAlumno;
  onMarca: (studentId: string, marca: Marca) => void;
  /** Aplica una marca a los alumnos que hoy se ven en la lista. */
  onMasivo: (ids: string[], marca: Marca) => void;
  estadisticas: Map<string, EstadisticaAlumno>;
  puedeVerEstado: boolean;
  /** Abre la ficha del alumno; el profesor también la tiene. */
  onAbrirAlumno?: (alumno: Student) => void;
};

function MarcaControl({
  alumno,
  marca,
  onMarca,
  compacto,
}: {
  alumno: Student;
  marca: Marca;
  onMarca: Props['onMarca'];
  compacto?: boolean;
}) {
  // Dos botones en vez de un interruptor: un interruptor solo tiene dos
  // estados y aquí «sin marcar» es un tercero que no se puede inventar.
  const boton = (valor: 'presente' | 'ausente', icono: React.ReactNode) => {
    const activo = marca === valor;
    const meta = MARCAS[valor];
    return (
      <Tooltip label={activo ? `${meta.label} (clic para desmarcar)` : meta.label}>
        <ActionIcon
          size={compacto ? 'lg' : 44}
          radius="md"
          variant={activo ? 'filled' : 'light'}
          color={activo ? meta.color : 'gray'}
          aria-pressed={activo}
          aria-label={`${meta.label}: ${alumno.full_name}`}
          onClick={() => onMarca(alumno.id, activo ? 'sin_marcar' : valor)}
        >
          {icono}
        </ActionIcon>
      </Tooltip>
    );
  };
  return (
    <Group gap={6} wrap="nowrap" justify="flex-end">
      {boton('presente', <IconCheck size={20} />)}
      {boton('ausente', <IconX size={20} />)}
    </Group>
  );
}

function Historico({ stat }: { stat?: EstadisticaAlumno }) {
  if (!stat || stat.sesiones === 0) {
    return (
      <Text size="sm" c="dimmed">
        Sin historial
      </Text>
    );
  }
  const nivel = nivelAsistencia(stat.porcentaje);
  return (
    <Group gap="xs" wrap="nowrap">
      <Progress
        value={stat.porcentaje}
        color={nivel.color}
        w={56}
        size="sm"
        aria-hidden
      />
      <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {stat.porcentaje}%
      </Text>
      <Text size="xs" c="dimmed">
        ({stat.asistidas}/{stat.sesiones})
      </Text>
    </Group>
  );
}

function FaltasSeguidas({ stat }: { stat?: EstadisticaAlumno }) {
  if (!stat || stat.faltasSeguidas === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }
  const grave = stat.faltasSeguidas >= 3;
  const texto = `${stat.faltasSeguidas} ${stat.faltasSeguidas === 1 ? 'falta seguida' : 'faltas seguidas'}`;
  return (
    <Tooltip label={texto}>
      <Badge
        variant="light"
        color={grave ? 'red' : 'yellow'}
        leftSection={grave ? <IconAlertTriangle size={12} /> : undefined}
        tabIndex={0}
        aria-label={texto}
      >
        {stat.faltasSeguidas}
      </Badge>
    </Tooltip>
  );
}

function UltimaAsistencia({ stat }: { stat?: EstadisticaAlumno }) {
  if (!stat?.ultimaAsistencia) {
    return (
      <Text size="sm" c="dimmed">
        Nunca
      </Text>
    );
  }
  const dias = dayjs().diff(dayjs(stat.ultimaAsistencia), 'day');
  return (
    <Text size="sm" c={dias > 21 ? 'orange' : undefined}>
      {dayjs(stat.ultimaAsistencia).format('DD/MM/YYYY')}
      {dias > 0 && (
        <Text span size="xs" c="dimmed">
          {' '}
          ({dias} d)
        </Text>
      )}
    </Text>
  );
}

function Contacto({ alumno }: { alumno: Student }) {
  const telefono = alumno.parent?.phone || alumno.phone;
  if (!telefono) {
    return (
      <Text size="sm" c="dimmed">
        Sin teléfono
      </Text>
    );
  }
  const quien = nombreTutor(alumno) || alumno.full_name;
  const whatsapp = enlaceWhatsapp(telefono, `Hola, te escribimos sobre ${alumno.full_name}.`);
  return (
    <Group gap={4} wrap="nowrap">
      <Tooltip label={`Llamar a ${quien}: ${telefono}`}>
        <ActionIcon
          component="a"
          href={`tel:${telefono.replace(/[^\d+]/g, '')}`}
          variant="subtle"
          color="gray"
          aria-label={`Llamar a ${quien}`}
        >
          <IconPhone size={16} />
        </ActionIcon>
      </Tooltip>
      {whatsapp && (
        <Tooltip label={`Escribir a ${quien} por WhatsApp`}>
          <ActionIcon
            component="a"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="green"
            aria-label={`Escribir a ${quien} por WhatsApp`}
          >
            <IconBrandWhatsapp size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

function Identidad({
  alumno,
  compacta,
  onAbrir,
}: {
  alumno: Student;
  compacta?: boolean;
  onAbrir?: () => void;
}) {
  const edad = calcularEdad(alumno.birth_date);
  const estado = normalizarEstado(alumno.status);
  const nombre = (
    <Group gap={6} wrap="nowrap">
      <Text size="sm" fw={600} truncate>
        {alumno.full_name}
      </Text>
      {alumno.medical_notes && (
        <Tooltip multiline w={240} label={`Notas médicas: ${alumno.medical_notes}`}>
          <IconHeartbeat
            size={15}
            color="var(--mantine-color-red-6)"
            aria-label={`${alumno.full_name} tiene notas médicas`}
            tabIndex={0}
          />
        </Tooltip>
      )}
      {estado === 'inactivo' && (
        <Tooltip label="Alumno inactivo">
          <IconUserOff size={14} aria-label="Alumno inactivo" />
        </Tooltip>
      )}
    </Group>
  );
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar
        size={compacta ? 'sm' : 'md'}
        radius="xl"
        color="initials"
        name={alumno.full_name}
        src={alumno.avatar_url || undefined}
      >
        {iniciales(alumno.full_name)}
      </Avatar>
      <div style={{ minWidth: 0 }}>
        {onAbrir ? (
          <UnstyledButton
            onClick={onAbrir}
            style={{ textAlign: 'left' }}
            aria-label={`Abrir ficha de ${alumno.full_name}`}
          >
            {nombre}
          </UnstyledButton>
        ) : (
          nombre
        )}
        <Text size="xs" c="dimmed" truncate>
          {edad != null ? `${edad} años` : 'Sin fecha de nacimiento'}
        </Text>
      </div>
    </Group>
  );
}

export function RollCallList({
  alumnos,
  marcas,
  onMarca,
  onMasivo,
  estadisticas,
  puedeVerEstado,
  onAbrirAlumno,
}: Props) {
  const esMovil = useMediaQuery('(max-width: 48em)');
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('todos');
  const [orden, setOrden] = useState<OrdenPase>('nombre');
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [verInactivos, setVerInactivos] = useState(false);
  const [columnas, setColumnas] = useLocalPref<ColumnaPase[]>(
    'asistencia:columnas',
    COLUMNAS_INICIALES,
  );
  const [densidad, setDensidad] = useLocalPref<'comoda' | 'compacta'>(
    'asistencia:densidad',
    'comoda',
  );

  const inactivos = alumnos.filter((a) => normalizarEstado(a.status) === 'inactivo').length;

  const visibles = useMemo(() => {
    const filtrados = alumnos.filter((a) => {
      if (!verInactivos && normalizarEstado(a.status) === 'inactivo') return false;
      if (filtroMarca !== 'todos' && marcaDe(marcas, a.id) !== filtroMarca) return false;
      if (soloRiesgo && !estadisticas.get(a.id)?.enRiesgo) return false;
      return coincide(a.full_name, busqueda) || coincide(nombreTutor(a), busqueda);
    });
    const stat = (a: Student) => estadisticas.get(a.id);
    return filtrados.sort((a, b) => {
      if (orden === 'sin_marcar') {
        const peso = (x: Student) => (marcaDe(marcas, x.id) === 'sin_marcar' ? 0 : 1);
        if (peso(a) !== peso(b)) return peso(a) - peso(b);
      }
      if (orden === 'asistencia') {
        // Quien no tiene historial no es "el peor": va al final.
        const pct = (x: Student) => stat(x)?.sesiones ? stat(x)!.porcentaje : 101;
        if (pct(a) !== pct(b)) return pct(a) - pct(b);
      }
      if (orden === 'seguidas') {
        const seg = (x: Student) => stat(x)?.faltasSeguidas ?? 0;
        if (seg(a) !== seg(b)) return seg(b) - seg(a);
      }
      return (a.full_name || '').localeCompare(b.full_name || '', 'es');
    });
  }, [alumnos, busqueda, estadisticas, filtroMarca, marcas, orden, soloRiesgo, verInactivos]);

  const idsVisibles = visibles.map((a) => a.id);
  const enRiesgo = alumnos.filter((a) => estadisticas.get(a.id)?.enRiesgo).length;
  const disponibles = COLUMNAS.filter((c) => !c.soloAdmin || puedeVerEstado);
  const activas = disponibles.filter((c) => columnas.includes(c.clave));
  const compacta = densidad === 'compacta';

  const celda = (clave: ColumnaPase, alumno: Student) => {
    const stat = estadisticas.get(alumno.id);
    switch (clave) {
      case 'historico':
        return <Historico stat={stat} />;
      case 'seguidas':
        return <FaltasSeguidas stat={stat} />;
      case 'ultima':
        return <UltimaAsistencia stat={stat} />;
      case 'salud':
        return alumno.medical_notes ? (
          <Text size="xs" lineClamp={2} maw={200}>
            {alumno.medical_notes}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        );
      case 'contacto':
        return <Contacto alumno={alumno} />;
      case 'estado': {
        const meta = ESTADOS_ALUMNO[normalizarEstado(alumno.status)];
        return (
          <Badge variant="light" color={meta.color} size="sm">
            {meta.corto}
          </Badge>
        );
      }
      default:
        return null;
    }
  };

  const filtros = (
    <Stack gap="sm">
      <Group align="flex-end" wrap="wrap" gap="sm">
        <TextInput
          style={{ flex: '1 1 220px' }}
          label="Buscar alumno"
          placeholder="Nombre del alumno o del tutor"
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
        <Select
          w={200}
          label="Mostrar"
          allowDeselect={false}
          value={filtroMarca}
          onChange={(valor) => valor && setFiltroMarca(valor)}
          data={OPCIONES_MARCA}
        />
        <Select
          w={220}
          label="Ordenar por"
          allowDeselect={false}
          value={orden}
          onChange={(valor) => valor && setOrden(valor as OrdenPase)}
          data={OPCIONES_ORDEN}
        />
      </Group>
      <Group gap="xs" wrap="wrap">
        {enRiesgo > 0 && (
          <Button
            size="compact-sm"
            variant={soloRiesgo ? 'filled' : 'light'}
            color="orange"
            aria-pressed={soloRiesgo}
            leftSection={<IconAlertTriangle size={14} />}
            onClick={() => setSoloRiesgo((v) => !v)}
          >
            En riesgo ({enRiesgo})
          </Button>
        )}
        {inactivos > 0 && (
          <Button
            size="compact-sm"
            variant={verInactivos ? 'filled' : 'light'}
            color="gray"
            aria-pressed={verInactivos}
            leftSection={<IconUserOff size={14} />}
            onClick={() => setVerInactivos((v) => !v)}
          >
            {verInactivos ? 'Ocultar inactivos' : `Incluir inactivos (${inactivos})`}
          </Button>
        )}
        {(busqueda || filtroMarca !== 'todos' || soloRiesgo) && (
          <Button
            size="compact-sm"
            variant="subtle"
            leftSection={<IconX size={14} />}
            onClick={() => {
              setBusqueda('');
              setFiltroMarca('todos');
              setSoloRiesgo(false);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </Group>
      <Divider />
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Group gap="xs" wrap="wrap">
          <Text size="sm" c="dimmed" role="status" aria-live="polite">
            {visibles.length === alumnos.length
              ? `${alumnos.length} ${alumnos.length === 1 ? 'alumno' : 'alumnos'}`
              : `${visibles.length} de ${alumnos.length} alumnos`}
          </Text>
          <Button
            size="compact-sm"
            variant="light"
            color="green"
            leftSection={<IconCheck size={14} />}
            disabled={idsVisibles.length === 0}
            onClick={() => onMasivo(idsVisibles, 'presente')}
          >
            Todos presentes
          </Button>
          <Button
            size="compact-sm"
            variant="light"
            color="red"
            leftSection={<IconX size={14} />}
            disabled={idsVisibles.length === 0}
            onClick={() => onMasivo(idsVisibles, 'ausente')}
          >
            Todos ausentes
          </Button>
          <Button
            size="compact-sm"
            variant="subtle"
            color="gray"
            disabled={idsVisibles.length === 0}
            onClick={() => onMasivo(idsVisibles, 'sin_marcar')}
          >
            Desmarcar
          </Button>
        </Group>
        {!esMovil && (
          <Group gap="xs">
            <Menu closeOnItemClick={false} withinPortal shadow="md" width={240}>
              <Menu.Target>
                <ActionIcon variant="default" size="lg" aria-label="Elegir columnas visibles">
                  <IconColumns3 size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Columnas</Menu.Label>
                {disponibles.map((c) => (
                  <Menu.Item
                    key={c.clave}
                    onClick={() =>
                      setColumnas(
                        columnas.includes(c.clave)
                          ? columnas.filter((x) => x !== c.clave)
                          : [...columnas, c.clave],
                      )
                    }
                  >
                    <Checkbox
                      readOnly
                      size="xs"
                      tabIndex={-1}
                      checked={columnas.includes(c.clave)}
                      label={c.titulo}
                      styles={{ label: { cursor: 'pointer' } }}
                    />
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <SegmentedControl
              size="xs"
              aria-label="Densidad de la tabla"
              value={densidad}
              onChange={(valor) => setDensidad(valor as 'comoda' | 'compacta')}
              data={[
                { value: 'comoda', label: 'Cómoda' },
                { value: 'compacta', label: 'Compacta' },
              ]}
            />
          </Group>
        )}
      </Group>
    </Stack>
  );

  const vacio =
    visibles.length === 0 ? (
      <EmptyState
        title="Ningún alumno coincide"
        description="Cambia la búsqueda o los filtros para ver al resto de la categoría."
        action={
          <Button
            variant="light"
            onClick={() => {
              setBusqueda('');
              setFiltroMarca('todos');
              setSoloRiesgo(false);
            }}
          >
            Quitar filtros
          </Button>
        }
      />
    ) : null;

  if (esMovil) {
    return (
      <Stack gap="sm">
        <Card withBorder radius="md" padding="sm">
          {filtros}
        </Card>
        {vacio}
        {visibles.map((a) => {
          const marca = marcaDe(marcas, a.id);
          const stat = estadisticas.get(a.id);
          return (
            <Card
              key={a.id}
              withBorder
              radius="md"
              padding="sm"
              style={{
                borderColor:
                  marca === 'presente'
                    ? 'var(--mantine-color-green-5)'
                    : marca === 'ausente'
                      ? 'var(--mantine-color-red-5)'
                      : undefined,
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Identidad
                    alumno={a}
                    onAbrir={onAbrirAlumno ? () => onAbrirAlumno(a) : undefined}
                  />
                </div>
                <MarcaControl alumno={a} marca={marca} onMarca={onMarca} />
              </Group>
              <Group gap="xs" mt="xs" wrap="wrap">
                <Historico stat={stat} />
                <FaltasSeguidas stat={stat} />
              </Group>
            </Card>
          );
        })}
      </Stack>
    );
  }

  return (
    <Card withBorder radius="md" padding={0}>
      <div style={{ padding: 'var(--mantine-spacing-sm)' }}>{filtros}</div>
      {vacio}
      {visibles.length > 0 && (
        <Table.ScrollContainer minWidth={420 + activas.length * 130}>
          <Table verticalSpacing={compacta ? 4 : 'xs'} highlightOnHover stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Alumno</Table.Th>
                {activas.map((c) => (
                  <Table.Th key={c.clave}>{c.titulo}</Table.Th>
                ))}
                <Table.Th w={140} ta="right">
                  Asistencia
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visibles.map((a) => {
                const marca = marcaDe(marcas, a.id);
                return (
                  <Table.Tr
                    key={a.id}
                    bg={
                      marca === 'presente'
                        ? 'var(--mantine-color-green-light)'
                        : marca === 'ausente'
                          ? 'var(--mantine-color-red-light)'
                          : undefined
                    }
                  >
                    <Table.Td maw={280}>
                      <Identidad
                        alumno={a}
                        compacta={compacta}
                        onAbrir={onAbrirAlumno ? () => onAbrirAlumno(a) : undefined}
                      />
                    </Table.Td>
                    {activas.map((c) => (
                      <Table.Td key={c.clave}>{celda(c.clave, a)}</Table.Td>
                    ))}
                    <Table.Td>
                      <MarcaControl
                        alumno={a}
                        marca={marca}
                        onMarca={onMarca}
                        compacto={compacta}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Card>
  );
}
