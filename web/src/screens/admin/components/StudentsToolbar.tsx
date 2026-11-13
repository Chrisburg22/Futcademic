'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Collapse,
  Group,
  Indicator,
  Box,
  Paper,
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
  IconCash,
  IconFileAlert,
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
import { SearchInput } from '../../../components/common/SearchInput';
import { FilterChip } from '../../../components/common/FilterChip';
import { StudentsFilterSheet } from './StudentsFilterSheet';

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
  /** Cuántos alumnos daría un borrador de filtros, para el botón del sheet. */
  contarConFiltros?: (filtros: FiltrosAlumnos) => number;
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
  contarConFiltros,
}: Props) {
  const secundarios = SECUNDARIOS.filter((clave) => filtros[clave]).length;
  // Los filtros secundarios arrancan abiertos si alguno ya está aplicado.
  const [masAbierto, setMasAbierto] = useState(() => secundarios > 0);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const activos = contarFiltros(filtros);
  // En móvil solo la búsqueda queda a la vista; el resto de filtros se pliega
  // para que la lista no empiece tres pantallas más abajo.
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

  const atajos = (
    /*
     * Los tres filtros que se usan a diario, a un toque. Antes «Por atender»
     * estaba escondido al final de la barra y los otros dos, dentro de un
     * desplegable.
     */
    <Group gap="xs" wrap="wrap" role="group" aria-label="Atajos de filtro">
      {porAtender > 0 && (
        <Button
          variant={filtros.atencion ? 'filled' : 'light'}
          color="orange"
          leftSection={<IconAlertTriangle size={16} />}
          aria-pressed={!!filtros.atencion}
          onClick={() => onChange({ atencion: filtros.atencion ? null : 'si' })}
        >
          Por atender ({porAtender})
        </Button>
      )}
      {puedeVerPagos && (
        <Button
          variant={filtros.adeudo === 'con' ? 'filled' : 'light'}
          color="red"
          leftSection={<IconCash size={16} />}
          aria-pressed={filtros.adeudo === 'con'}
          onClick={() => onChange({ adeudo: filtros.adeudo === 'con' ? null : 'con' })}
        >
          Debe
        </Button>
      )}
      <Button
        variant={filtros.expediente === 'incompleto' ? 'filled' : 'light'}
        color="yellow"
        leftSection={<IconFileAlert size={16} />}
        aria-pressed={filtros.expediente === 'incompleto'}
        onClick={() =>
          onChange({ expediente: filtros.expediente === 'incompleto' ? null : 'incompleto' })
        }
      >
        Expediente incompleto
      </Button>
    </Group>
  );

  return (
    <Stack gap="sm" mb="md">
      {/*
        En teléfono queda a la vista el buscador y un botón, nada más: los diez
        desplegables apilados medían unos 560 px de alto por encima de la lista.
      */}
      <Paper withBorder radius="md" p="sm">
        <Stack gap="sm">
          <SearchInput
            label="Buscar"
            placeholder="Nombre, tutor, categoría o teléfono"
            value={filtros.busqueda}
            onChange={(busqueda) => onChange({ busqueda })}
          />

          <Group gap="xs" wrap="nowrap" hiddenFrom="sm">
            <Indicator label={activos} disabled={!activos} size={18} offset={4}>
              <Button
                variant="default"
                leftSection={<IconAdjustmentsHorizontal size={18} />}
                onClick={() => setHojaAbierta(true)}
              >
                Filtros
              </Button>
            </Indicator>
            {hayFiltros(filtros) && (
              <Button
                variant="subtle"
                leftSection={<IconX size={18} />}
                onClick={() => onChange(FILTROS_VACIOS)}
              >
                Limpiar
              </Button>
            )}
          </Group>
          <Box hiddenFrom="sm">{atajos}</Box>

          <Group align="flex-end" wrap="wrap" gap="sm" visibleFrom="sm">
            {primarios}
            <Indicator label={secundarios} disabled={!secundarios || masAbierto} size={16} offset={4}>
              <Button
                variant="default"
                leftSection={<IconAdjustmentsHorizontal size={16} />}
                aria-expanded={masAbierto}
                aria-controls="filtros-secundarios"
                onClick={() => setMasAbierto((v) => !v)}
              >
                Más filtros
              </Button>
            </Indicator>
          </Group>

          <Collapse in={masAbierto} id="filtros-secundarios" visibleFrom="sm">
            <Stack gap="sm">
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
            <FilterChip
              key={chip.clave}
              label={chip.titulo}
              value={chip.valor}
              onRemove={() =>
                onChange({ [chip.clave]: chip.clave === 'busqueda' ? '' : null } as Partial<FiltrosAlumnos>)
              }
            />
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
          <Box visibleFrom="sm">
            <Group gap="xs">
              {porAtender > 0 && (
                <Button
                  variant={filtros.atencion ? 'filled' : 'light'}
                  color="orange"
                  size="sm"
                  leftSection={<IconAlertTriangle size={16} />}
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
                    size="sm"
                    leftSection={<IconX size={16} />}
                    onClick={() => onChange(FILTROS_VACIOS)}
                  >
                    Limpiar{activos ? ` (${activos})` : ''}
                  </Button>
                </Tooltip>
              )}
            </Group>
          </Box>
        </Group>
        {/* El orden vivía en un Select de 220 px fijos que forzaba envolturas
            en el teléfono; ahí ahora vive dentro del sheet de filtros. */}
        <Select
          visibleFrom="sm"
          aria-label="Ordenar por"
          w={220}
          allowDeselect={false}
          value={orden}
          onChange={(valor) => valor && onOrden(valor)}
          data={OPCIONES_ORDEN}
        />
      </Group>

      <StudentsFilterSheet
        opened={hojaAbierta}
        onClose={() => setHojaAbierta(false)}
        filtros={filtros}
        onApply={(nuevos) => onChange(nuevos)}
        onClear={() => onChange(FILTROS_VACIOS)}
        orden={orden}
        onOrden={onOrden}
        categorias={categorias}
        anios={anios}
        puedeCambiarEstado={puedeCambiarEstado}
        puedeVerPagos={puedeVerPagos}
        contar={contarConFiltros ?? (() => mostrados)}
      />
    </Stack>
  );
}
