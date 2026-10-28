'use client';

import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group,
  Indicator,
  Paper,
  Pill,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import {
  FILTROS_VACIOS,
  OPCIONES_ADEUDO,
  OPCIONES_ALTA,
  OPCIONES_EMERGENCIA,
  OPCIONES_EXPEDIENTE,
  OPCIONES_ESTADO,
  OPCIONES_MEDICAS,
  OPCIONES_ORDEN,
  OPCIONES_TUTOR,
  OPCIONES_UNIFORME,
  chipsDeFiltros,
  contarFiltros,
  hayFiltros,
  type FiltrosAlumnos,
} from '../../../lib/students';

type Props = {
  filtros: FiltrosAlumnos;
  onChange: (cambios: Partial<FiltrosAlumnos>) => void;
  orden: string;
  onOrden: (valor: string) => void;
  categorias: { id: string; name: string }[];
  anios: string[];
  /** Cuántos alumnos coinciden y cuántos hay en total. */
  mostrados: number;
  total: number;
  puedeCambiarEstado: boolean;
  /** Solo el admin ve el cobro, así que solo él filtra por adeudo. */
  puedeVerPagos?: boolean;
  /** Cuántos alumnos tienen algo urgente, para el atajo "Por atender". */
  porAtender?: number;
};

/** Los filtros que viven detrás de «Más filtros». */
const SECUNDARIOS: (keyof FiltrosAlumnos)[] = [
  'uniforme',
  'anio',
  'tutor',
  'adeudo',
  'emergencia',
  'medicas',
  'alta',
];

export function StudentsToolbar({
  filtros,
  onChange,
  orden,
  onOrden,
  categorias,
  anios,
  mostrados,
  total,
  puedeCambiarEstado,
  puedeVerPagos = false,
  porAtender = 0,
}: Props) {
  const secundarios = SECUNDARIOS.filter((clave) => filtros[clave]).length;
  // Los filtros secundarios arrancan abiertos si alguno ya está aplicado.
  const [masAbierto, setMasAbierto] = useState(() => secundarios > 0);
  // En móvil solo la búsqueda queda a la vista; el resto de filtros se pliega
  // para que la lista no empiece tres pantallas más abajo.
  const esMovil = useMediaQuery('(max-width: 48em)');
  const primariosActivos = [filtros.categoria, filtros.estado, filtros.expediente].filter(Boolean)
    .length;
  const pendientesDeVer = esMovil ? secundarios + primariosActivos : secundarios;
  const chips = chipsDeFiltros(filtros, categorias);

  const primarios = (
    <>
      <Select
        style={{ flex: '1 1 160px' }}
        label="Categoría"
        placeholder="Todas"
        clearable
        searchable
        nothingFoundMessage="Sin coincidencias"
        value={filtros.categoria}
        onChange={(categoria) => onChange({ categoria })}
        data={categorias.map((c) => ({ value: c.id, label: c.name }))}
      />
      {puedeCambiarEstado && (
        <Select
          style={{ flex: '1 1 150px' }}
          label="Estado"
          placeholder="Todos"
          clearable
          value={filtros.estado}
          onChange={(estado) => onChange({ estado: estado as FiltrosAlumnos['estado'] })}
          data={OPCIONES_ESTADO}
        />
      )}
      <Select
        style={{ flex: '1 1 150px' }}
        label="Expediente"
        placeholder="Todos"
        clearable
        value={filtros.expediente}
        onChange={(expediente) => onChange({ expediente })}
        data={OPCIONES_EXPEDIENTE}
      />
    </>
  );

  return (
    <Stack gap="sm" mb="md">
      <Paper withBorder radius="md" p="sm">
        <Stack gap="sm">
          <Group align="flex-end" wrap="wrap" gap="sm">
            <TextInput
              style={{ flex: '1 1 240px' }}
              label="Buscar"
              placeholder="Nombre, tutor, categoría o teléfono"
              leftSection={<IconSearch size={16} />}
              value={filtros.busqueda}
              onChange={(e) => onChange({ busqueda: e.currentTarget.value })}
              rightSection={
                filtros.busqueda ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Borrar búsqueda"
                    onClick={() => onChange({ busqueda: '' })}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : undefined
              }
            />
            {!esMovil && primarios}
            <Indicator
              label={pendientesDeVer}
              disabled={!pendientesDeVer || masAbierto}
              size={16}
              offset={4}
            >
              <Button
                variant="default"
                leftSection={<IconAdjustmentsHorizontal size={16} />}
                aria-expanded={masAbierto}
                aria-controls="filtros-secundarios"
                onClick={() => setMasAbierto((v) => !v)}
              >
                {esMovil ? 'Filtros' : 'Más filtros'}
              </Button>
            </Indicator>
          </Group>

          <Collapse in={masAbierto} id="filtros-secundarios">
            <Stack gap="sm">
              {esMovil && <Stack gap="sm">{primarios}</Stack>}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {puedeVerPagos && (
                  <Select
                    label="Pago del mes"
                    placeholder="Todos"
                    clearable
                    value={filtros.adeudo}
                    onChange={(adeudo) => onChange({ adeudo: adeudo as FiltrosAlumnos['adeudo'] })}
                    data={OPCIONES_ADEUDO}
                  />
                )}
                <Select
                  label="Uniforme"
                  placeholder="Todos"
                  clearable
                  value={filtros.uniforme}
                  onChange={(uniforme) =>
                    onChange({ uniforme: uniforme as FiltrosAlumnos['uniforme'] })
                  }
                  data={OPCIONES_UNIFORME}
                />
                <Select
                  label="Tutor"
                  placeholder="Todos"
                  clearable
                  value={filtros.tutor}
                  onChange={(tutor) => onChange({ tutor: tutor as FiltrosAlumnos['tutor'] })}
                  data={OPCIONES_TUTOR}
                />
                <Select
                  label="Contacto de emergencia"
                  placeholder="Todos"
                  clearable
                  value={filtros.emergencia}
                  onChange={(emergencia) =>
                    onChange({ emergencia: emergencia as FiltrosAlumnos['emergencia'] })
                  }
                  data={OPCIONES_EMERGENCIA}
                />
                <Select
                  label="Notas médicas"
                  placeholder="Todas"
                  clearable
                  value={filtros.medicas}
                  onChange={(medicas) => onChange({ medicas: medicas as FiltrosAlumnos['medicas'] })}
                  data={OPCIONES_MEDICAS}
                />
                <Select
                  label="Año de nacimiento"
                  placeholder="Todos"
                  clearable
                  searchable
                  value={filtros.anio}
                  onChange={(anio) => onChange({ anio })}
                  data={anios}
                />
                <Select
                  label="Fecha de alta"
                  placeholder="Cualquiera"
                  clearable
                  value={filtros.alta}
                  onChange={(alta) => onChange({ alta: alta as FiltrosAlumnos['alta'] })}
                  data={OPCIONES_ALTA}
                />
              </SimpleGrid>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {chips.length > 0 && (
        <Group gap={6} wrap="wrap" aria-label="Filtros aplicados">
          {chips.map((chip) => (
            <Pill
              key={chip.clave}
              withRemoveButton
              size="md"
              // Mantine marca el botón de quitar como aria-hidden; aquí es la
              // única forma de soltar el filtro, así que se expone.
              removeButtonProps={{
                'aria-label': `Quitar filtro ${chip.titulo}: ${chip.valor}`,
                'aria-hidden': false,
              }}
              onRemove={() =>
                onChange({ [chip.clave]: chip.clave === 'busqueda' ? '' : null } as Partial<FiltrosAlumnos>)
              }
            >
              <Text span size="xs" c="dimmed">
                {chip.titulo}:{' '}
              </Text>
              {chip.valor}
            </Pill>
          ))}
        </Group>
      )}

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs" role="status" aria-live="polite">
          <Badge variant="light" color="gray" size="lg" radius="sm">
            {mostrados === total
              ? `${total} ${total === 1 ? 'alumno' : 'alumnos'}`
              : `${mostrados} de ${total} alumnos`}
          </Badge>
          {porAtender > 0 && (
            <Button
              variant={filtros.atencion ? 'filled' : 'light'}
              color="orange"
              size="compact-sm"
              leftSection={<IconAlertTriangle size={14} />}
              aria-pressed={!!filtros.atencion}
              onClick={() => onChange({ atencion: filtros.atencion ? null : 'si' })}
            >
              Por atender ({porAtender})
            </Button>
          )}
          {hayFiltros(filtros) && (
            <Tooltip label="Quitar búsqueda y filtros">
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<IconX size={14} />}
                onClick={() => onChange(FILTROS_VACIOS)}
              >
                Limpiar{contarFiltros(filtros) ? ` (${contarFiltros(filtros)})` : ''}
              </Button>
            </Tooltip>
          )}
        </Group>
        <Select
          aria-label="Ordenar por"
          w={220}
          allowDeselect={false}
          value={orden}
          onChange={(valor) => valor && onOrden(valor)}
          data={OPCIONES_ORDEN}
        />
      </Group>
    </Stack>
  );
}
