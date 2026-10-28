'use client';

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Card,
  Checkbox,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronDown,
  IconDots,
  IconEdit,
  IconEye,
  IconShirt,
  IconTrash,
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import {
  ESTADOS_ALUMNO,
  ESTADOS_EXPEDIENTE,
  OPCIONES_ESTADO,
  calcularEdad,
  iniciales,
  nombreDocumento,
  nombreTutor,
  normalizarEstado,
  type CampoOrden,
  type Orden,
} from '../../../lib/students';
import type { Student, StudentStatus } from '../../../types';

type Props = {
  alumnos: Student[];
  orden: Orden;
  onOrden: (campo: CampoOrden) => void;
  seleccion: Set<string>;
  onSeleccion: (ids: string[], marcado: boolean) => void;
  puedeAdministrar: boolean;
  onAbrir: (alumno: Student) => void;
  onEditar: (alumno: Student) => void;
  onEliminar: (alumno: Student) => void;
  onEstado: (alumno: Student, estado: StudentStatus) => void;
  onUniforme: (alumno: Student) => void;
};

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
  children,
}: {
  campo: CampoOrden;
  orden: Orden;
  onOrden: Props['onOrden'];
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

function Identidad({ alumno }: { alumno: Student }) {
  const edad = calcularEdad(alumno.birth_date);
  const tutor = nombreTutor(alumno);
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar size="md" radius="xl" color="initials" name={alumno.full_name} src={alumno.avatar_url || undefined}>
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

export function StudentsTable(props: Props) {
  const { alumnos, orden, onOrden, seleccion, onSeleccion, puedeAdministrar, onAbrir, onEstado, onUniforme } = props;
  const esMovil = useMediaQuery('(max-width: 48em)');

  const idsVisibles = alumnos.map((a) => a.id);
  const todos = idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id));
  const algunos = idsVisibles.some((id) => seleccion.has(id));

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
              <BotonUniforme alumno={a} onUniforme={onUniforme} />
            </Group>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Card withBorder padding={0} radius="md">
      <Table.ScrollContainer minWidth={860}>
        <Table verticalSpacing="xs" highlightOnHover stickyHeader stickyHeaderOffset={0}>
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
              <EncabezadoOrdenable campo="categoria" orden={orden} onOrden={onOrden}>
                Categoría
              </EncabezadoOrdenable>
              <EncabezadoOrdenable campo="estado" orden={orden} onOrden={onOrden}>
                Estado
              </EncabezadoOrdenable>
              <Table.Th>Expediente</Table.Th>
              <Table.Th ta="center">Uniforme</Table.Th>
              <Table.Th w={56}>
                <Box component="span" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
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
                <Table.Td maw={320}>
                  <UnstyledButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrir(a);
                    }}
                    style={{ width: '100%', textAlign: 'left' }}
                    aria-label={`Abrir ficha de ${a.full_name}`}
                  >
                    <Identidad alumno={a} />
                  </UnstyledButton>
                </Table.Td>
                <Table.Td>
                  <CategoriaBadge alumno={a} />
                </Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <EstadoMenu alumno={a} editable={puedeAdministrar} onEstado={onEstado} />
                </Table.Td>
                <Table.Td>
                  <Expediente alumno={a} />
                </Table.Td>
                <Table.Td ta="center">
                  <BotonUniforme alumno={a} onUniforme={onUniforme} />
                </Table.Td>
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
