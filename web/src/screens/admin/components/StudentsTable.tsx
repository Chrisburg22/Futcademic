'use client';

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Card,
  Checkbox,
  Divider,
  Group,
  Menu,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronDown,
  IconColumns3,
  IconDots,
  IconEdit,
  IconEye,
  IconPhone,
  IconShirt,
  IconTrash,
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';
import {
  ESTADOS_ALUMNO,
  ESTADOS_EXPEDIENTE,
  OPCIONES_ESTADO,
  calcularEdad,
  deudaDe,
  iniciales,
  nombreDocumento,
  nombreTutor,
  normalizarEstado,
  pendientesDelAlumno,
  type CampoOrden,
  type ContextoAlumnos,
  type Orden,
} from '../../../lib/students';
import type { Student, StudentStatus } from '../../../types';

export type ColumnaAlumno =
  | 'categoria'
  | 'estado'
  | 'expediente'
  | 'adeudo'
  | 'uniforme'
  | 'atencion'
  | 'edad'
  | 'contacto'
  | 'alta';

export type Densidad = 'compacta' | 'comoda';

/** Catálogo de columnas opcionales; «Alumno» y las acciones son fijas. */
export const COLUMNAS: {
  clave: ColumnaAlumno;
  titulo: string;
  orden?: CampoOrden;
  /** Solo el admin ve el cobro. */
  soloAdmin?: boolean;
  centrada?: boolean;
}[] = [
  { clave: 'categoria', titulo: 'Categoría', orden: 'categoria' },
  { clave: 'estado', titulo: 'Estado', orden: 'estado', soloAdmin: true },
  { clave: 'expediente', titulo: 'Expediente' },
  { clave: 'adeudo', titulo: 'Adeudo', orden: 'adeudo', soloAdmin: true },
  { clave: 'uniforme', titulo: 'Uniforme', centrada: true },
  { clave: 'atencion', titulo: 'Por atender', centrada: true },
  { clave: 'edad', titulo: 'Edad', orden: 'edad', centrada: true },
  { clave: 'contacto', titulo: 'Contacto' },
  { clave: 'alta', titulo: 'Alta', orden: 'alta' },
];

/**
 * Lo que cabe sin scroll horizontal en un portátil. El resto se enciende
 * desde el menú de columnas y se recuerda por navegador.
 */
export const COLUMNAS_INICIALES: ColumnaAlumno[] = [
  'categoria',
  'estado',
  'expediente',
  'adeudo',
  'uniforme',
];

type Props = {
  alumnos: Student[];
  orden: Orden;
  onOrden: (campo: CampoOrden) => void;
  seleccion: Set<string>;
  onSeleccion: (ids: string[], marcado: boolean) => void;
  puedeAdministrar: boolean;
  contexto?: ContextoAlumnos;
  columnas: ColumnaAlumno[];
  onColumnas: (columnas: ColumnaAlumno[]) => void;
  densidad: Densidad;
  onDensidad: (densidad: Densidad) => void;
  porPagina: number;
  onPorPagina: (porPagina: number) => void;
  onAbrir: (alumno: Student) => void;
  onEditar: (alumno: Student) => void;
  onEliminar: (alumno: Student) => void;
  onEstado: (alumno: Student, estado: StudentStatus) => void;
  onUniforme: (alumno: Student) => void;
};

const pesos = (monto: number) => `$${monto.toLocaleString('es-MX')}`;

const soloDigitos = (telefono?: string | null) => (telefono || '').replace(/\D/g, '');

function Expediente({ alumno }: { alumno: Student }) {
  const clave = (alumno.expediente_status || 'incompleto') as keyof typeof ESTADOS_EXPEDIENTE;
  const meta = ESTADOS_EXPEDIENTE[clave] || ESTADOS_EXPEDIENTE.incompleto;
  const faltan = alumno.expediente_missing || [];
  const badge = (
    <Badge color={meta.color} variant="light" size="sm">
      {meta.label}
    </Badge>
  );
  if (!faltan.length) return badge;
  return (
    <Tooltip
      multiline
      w={220}
      label={`Falta: ${faltan.map(nombreDocumento).join(', ')}`}
      withArrow
    >
      <span tabIndex={0} style={{ display: 'inline-block' }}>
        {badge}
      </span>
    </Tooltip>
  );
}

function Adeudo({ alumno, contexto }: { alumno: Student; contexto?: ContextoAlumnos }) {
  const deuda = deudaDe(alumno, contexto);
  const estado = normalizarEstado(alumno.status);
  if (estado === 'becado') {
    return (
      <Text size="sm" c="dimmed">
        Becado
      </Text>
    );
  }
  if (deuda <= 0) {
    return (
      <Group gap={4} wrap="nowrap" c="dimmed">
        <IconCheck size={14} />
        <Text size="sm">Al día</Text>
      </Group>
    );
  }
  return (
    <Text size="sm" fw={600} c="red" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {pesos(deuda)}
    </Text>
  );
}

function Atencion({ alumno, contexto }: { alumno: Student; contexto?: ContextoAlumnos }) {
  const pendientes = pendientesDelAlumno(alumno, { deuda: deudaDe(alumno, contexto) });
  const urgentes = pendientes.filter((p) => p.severidad === 'alta').length;
  if (pendientes.length === 0) {
    return (
      <Tooltip label="Sin pendientes">
        <IconCheck size={16} color="var(--mantine-color-green-6)" aria-label="Sin pendientes" />
      </Tooltip>
    );
  }
  return (
    <Tooltip
      multiline
      w={260}
      withArrow
      label={pendientes.map((p) => `• ${p.mensaje}`).join('\n')}
    >
      <Badge
        variant="light"
        color={urgentes ? 'orange' : 'yellow'}
        leftSection={<IconAlertTriangle size={12} />}
        tabIndex={0}
        style={{ cursor: 'help' }}
      >
        {pendientes.length}
      </Badge>
    </Tooltip>
  );
}

function Contacto({ alumno }: { alumno: Student }) {
  const telefono = alumno.parent?.phone || alumno.phone;
  const tutor = nombreTutor(alumno);
  if (!telefono) {
    return (
      <Text size="sm" c="dimmed">
        Sin teléfono
      </Text>
    );
  }
  const digitos = soloDigitos(telefono);
  const whatsapp = digitos.length >= 10 ? `https://wa.me/${digitos.length === 10 ? `52${digitos}` : digitos}` : null;
  return (
    <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
      <Tooltip label={`Llamar a ${tutor || alumno.full_name}: ${telefono}`}>
        <ActionIcon
          component="a"
          href={`tel:${digitos}`}
          variant="subtle"
          color="gray"
          aria-label={`Llamar a ${tutor || alumno.full_name}`}
        >
          <IconPhone size={16} />
        </ActionIcon>
      </Tooltip>
      {whatsapp && (
        <Tooltip label="Escribir por WhatsApp">
          <ActionIcon
            component="a"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="green"
            aria-label={`Escribir por WhatsApp a ${tutor || alumno.full_name}`}
          >
            <IconBrandWhatsapp size={16} />
          </ActionIcon>
        </Tooltip>
      )}
      <Text size="xs" c="dimmed" visibleFrom="lg">
        {telefono}
      </Text>
    </Group>
  );
}

function EstadoMenu({
  alumno,
  editable,
  onEstado,
}: {
  alumno: Student;
  editable: boolean;
  onEstado: Props['onEstado'];
}) {
  const estado = normalizarEstado(alumno.status);
  const meta = ESTADOS_ALUMNO[estado];
  if (!editable) {
    return (
      <Badge color={meta.color} variant="light">
        {meta.label}
      </Badge>
    );
  }
  return (
    <Menu position="bottom-start" withinPortal shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton aria-label={`Estado de ${alumno.full_name}: ${meta.label}. Cambiar`}>
          <Badge
            color={meta.color}
            variant="light"
            style={{ cursor: 'pointer' }}
            rightSection={<IconChevronDown size={12} />}
          >
            {meta.label}
          </Badge>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Cambiar estado</Menu.Label>
        {OPCIONES_ESTADO.map((o) => (
          <Menu.Item
            key={o.value}
            disabled={o.value === estado}
            onClick={() => onEstado(alumno, o.value)}
            leftSection={
              <Badge color={ESTADOS_ALUMNO[o.value].color} variant="dot" size="xs" p={0} />
            }
          >
            {o.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function EncabezadoOrdenable({
  campo,
  orden,
  onOrden,
  centrada,
  children,
}: {
  campo: CampoOrden;
  orden: Orden;
  onOrden: Props['onOrden'];
  centrada?: boolean;
  children: React.ReactNode;
}) {
  const activo = orden.campo === campo;
  const Icono = !activo ? IconArrowsSort : orden.direccion === 'asc' ? IconArrowUp : IconArrowDown;
  return (
    <Table.Th
      aria-sort={activo ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : 'none'}
      ta={centrada ? 'center' : undefined}
    >
      <UnstyledButton onClick={() => onOrden(campo)} style={{ font: 'inherit', fontWeight: 600 }}>
        <Group gap={4} wrap="nowrap" justify={centrada ? 'center' : undefined}>
          {children}
          <Icono size={14} opacity={activo ? 1 : 0.4} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function Identidad({ alumno, compacta }: { alumno: Student; compacta?: boolean }) {
  const edad = calcularEdad(alumno.birth_date);
  const tutor = nombreTutor(alumno);
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
        <Text size="sm" fw={600} truncate>
          {alumno.full_name}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {[edad != null ? `${edad} años` : null, tutor ? `Tutor: ${tutor}` : 'Sin tutor']
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </div>
    </Group>
  );
}

function CategoriaBadge({ alumno }: { alumno: Student }) {
  const color = alumno.category?.color || undefined;
  return alumno.category?.name ? (
    <Badge
      variant="light"
      color={color ? undefined : 'blue'}
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      {alumno.category.name}
    </Badge>
  ) : (
    <Text size="sm" c="dimmed">
      Sin categoría
    </Text>
  );
}

function Acciones({
  alumno,
  puedeAdministrar,
  onAbrir,
  onEditar,
  onEliminar,
}: Pick<Props, 'puedeAdministrar' | 'onAbrir' | 'onEditar' | 'onEliminar'> & { alumno: Student }) {
  return (
    <Menu position="bottom-end" withinPortal shadow="md" width={190}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label={`Acciones para ${alumno.full_name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <IconDots size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
        <Menu.Item leftSection={<IconEye size={16} />} onClick={() => onAbrir(alumno)}>
          Ver ficha
        </Menu.Item>
        <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEditar(alumno)}>
          Edición rápida
        </Menu.Item>
        {puedeAdministrar && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => onEliminar(alumno)}
            >
              Eliminar alumno
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

function BotonUniforme({ alumno, onUniforme }: { alumno: Student; onUniforme: Props['onUniforme'] }) {
  const entregado = !!alumno.uniform_delivered;
  return (
    <Tooltip label={entregado ? 'Uniforme entregado (clic para deshacer)' : 'Marcar uniforme entregado'}>
      <ActionIcon
        size="lg"
        variant={entregado ? 'filled' : 'light'}
        color={entregado ? 'green' : 'gray'}
        aria-pressed={entregado}
        aria-label={`Uniforme de ${alumno.full_name}: ${entregado ? 'entregado' : 'pendiente'}`}
        onClick={(e) => {
          e.stopPropagation();
          onUniforme(alumno);
        }}
      >
        <IconShirt size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

/** Ajustes de la tabla: columnas, densidad y tamaño de página. */
function OpcionesTabla({
  columnas,
  onColumnas,
  densidad,
  onDensidad,
  porPagina,
  onPorPagina,
  disponibles,
}: Pick<
  Props,
  'columnas' | 'onColumnas' | 'densidad' | 'onDensidad' | 'porPagina' | 'onPorPagina'
> & { disponibles: typeof COLUMNAS }) {
  return (
    <Group justify="space-between" p="xs" wrap="wrap" gap="xs">
      <Group gap="xs">
        <Menu closeOnItemClick={false} withinPortal shadow="md" width={230}>
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
                  onColumnas(
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
          onChange={(valor) => onDensidad(valor as Densidad)}
          data={[
            { value: 'comoda', label: 'Cómoda' },
            { value: 'compacta', label: 'Compacta' },
          ]}
        />
      </Group>
      <Select
        size="xs"
        w={140}
        aria-label="Alumnos por página"
        allowDeselect={false}
        value={String(porPagina)}
        onChange={(valor) => valor && onPorPagina(Number(valor))}
        data={[
          { value: '25', label: '25 por página' },
          { value: '50', label: '50 por página' },
          { value: '100', label: '100 por página' },
        ]}
      />
    </Group>
  );
}

export function StudentsTable(props: Props) {
  const {
    alumnos,
    orden,
    onOrden,
    seleccion,
    onSeleccion,
    puedeAdministrar,
    contexto,
    columnas,
    densidad,
    onAbrir,
    onEstado,
    onUniforme,
  } = props;
  const esMovil = useMediaQuery('(max-width: 48em)');
  const compacta = densidad === 'compacta';

  const idsVisibles = alumnos.map((a) => a.id);
  const todos = idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id));
  const algunos = idsVisibles.some((id) => seleccion.has(id));

  const disponibles = COLUMNAS.filter((c) => !c.soloAdmin || puedeAdministrar);
  const visibles = disponibles.filter((c) => columnas.includes(c.clave));

  const celda = (clave: ColumnaAlumno, a: Student) => {
    switch (clave) {
      case 'categoria':
        return <CategoriaBadge alumno={a} />;
      case 'estado':
        return <EstadoMenu alumno={a} editable={puedeAdministrar} onEstado={onEstado} />;
      case 'expediente':
        return <Expediente alumno={a} />;
      case 'adeudo':
        return <Adeudo alumno={a} contexto={contexto} />;
      case 'uniforme':
        return <BotonUniforme alumno={a} onUniforme={onUniforme} />;
      case 'atencion':
        return <Atencion alumno={a} contexto={contexto} />;
      case 'edad': {
        const edad = calcularEdad(a.birth_date);
        return (
          <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {edad ?? '—'}
          </Text>
        );
      }
      case 'contacto':
        return <Contacto alumno={a} />;
      case 'alta':
        return (
          <Text size="sm" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {a.created_at ? dayjs(a.created_at).format('DD/MM/YYYY') : '—'}
          </Text>
        );
      default:
        return null;
    }
  };

  /** Las columnas que se interactúan no deben abrir la ficha al hacer clic. */
  const propia = (clave: ColumnaAlumno) =>
    clave === 'estado' || clave === 'uniforme' || clave === 'contacto';

  if (esMovil) {
    return (
      <Stack gap="xs">
        {alumnos.map((a) => (
          <Card
            key={a.id}
            withBorder
            padding="sm"
            radius="md"
            style={{ borderColor: seleccion.has(a.id) ? 'var(--mantine-color-blue-5)' : undefined }}
          >
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                <Checkbox
                  aria-label={`Seleccionar a ${a.full_name}`}
                  checked={seleccion.has(a.id)}
                  onChange={(e) => onSeleccion([a.id], e.currentTarget.checked)}
                />
                <UnstyledButton
                  onClick={() => onAbrir(a)}
                  style={{ minWidth: 0, flex: 1 }}
                  aria-label={`Abrir ficha de ${a.full_name}`}
                >
                  <Identidad alumno={a} />
                </UnstyledButton>
              </Group>
              <Acciones {...props} alumno={a} />
            </Group>
            <Group gap="xs" mt="sm" wrap="wrap">
              <CategoriaBadge alumno={a} />
              <EstadoMenu alumno={a} editable={puedeAdministrar} onEstado={onEstado} />
              <Expediente alumno={a} />
              {puedeAdministrar && deudaDe(a, contexto) > 0 && (
                <Badge variant="light" color="red">
                  Debe {pesos(deudaDe(a, contexto))}
                </Badge>
              )}
              <BotonUniforme alumno={a} onUniforme={onUniforme} />
            </Group>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Card withBorder padding={0} radius="md">
      <OpcionesTabla {...props} disponibles={disponibles} />
      <Divider />
      <Table.ScrollContainer minWidth={420 + visibles.length * 108}>
        <Table
          verticalSpacing={compacta ? 4 : 'xs'}
          highlightOnHover
          stickyHeader
          stickyHeaderOffset={0}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={44}>
                <Checkbox
                  aria-label="Seleccionar todos los alumnos de esta página"
                  checked={todos}
                  indeterminate={algunos && !todos}
                  onChange={(e) => onSeleccion(idsVisibles, e.currentTarget.checked)}
                />
              </Table.Th>
              <EncabezadoOrdenable campo="nombre" orden={orden} onOrden={onOrden}>
                Alumno
              </EncabezadoOrdenable>
              {visibles.map((c) =>
                c.orden ? (
                  <EncabezadoOrdenable
                    key={c.clave}
                    campo={c.orden}
                    orden={orden}
                    onOrden={onOrden}
                    centrada={c.centrada}
                  >
                    {c.titulo}
                  </EncabezadoOrdenable>
                ) : (
                  <Table.Th key={c.clave} ta={c.centrada ? 'center' : undefined}>
                    {c.titulo}
                  </Table.Th>
                ),
              )}
              <Table.Th w={56}>
                <Box
                  component="span"
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    clip: 'rect(0 0 0 0)',
                  }}
                >
                  Acciones
                </Box>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {alumnos.map((a) => (
              <Table.Tr
                key={a.id}
                bg={seleccion.has(a.id) ? 'var(--mantine-color-blue-light)' : undefined}
                style={{ cursor: 'pointer' }}
                onClick={() => onAbrir(a)}
              >
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    aria-label={`Seleccionar a ${a.full_name}`}
                    checked={seleccion.has(a.id)}
                    onChange={(e) => onSeleccion([a.id], e.currentTarget.checked)}
                  />
                </Table.Td>
                <Table.Td maw={300}>
                  <UnstyledButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrir(a);
                    }}
                    style={{ width: '100%', textAlign: 'left' }}
                    aria-label={`Abrir ficha de ${a.full_name}`}
                  >
                    <Identidad alumno={a} compacta={compacta} />
                  </UnstyledButton>
                </Table.Td>
                {visibles.map((c) => (
                  <Table.Td
                    key={c.clave}
                    ta={c.centrada ? 'center' : undefined}
                    onClick={propia(c.clave) ? (e) => e.stopPropagation() : undefined}
                  >
                    {celda(c.clave, a)}
                  </Table.Td>
                ))}
                <Table.Td>
                  <Acciones {...props} alumno={a} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
