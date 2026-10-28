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
  Select,
  SimpleGrid,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';
import {
  FILTROS_VACIOS,
  OPCIONES_EXPEDIENTE,
  OPCIONES_ESTADO,
  OPCIONES_ORDEN,
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
};

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
}: Props) {
  // Los filtros secundarios arrancan abiertos si alguno ya está aplicado.
  const [masAbierto, setMasAbierto] = useState(
    () => !!(filtros.uniforme || filtros.anio || filtros.tutor),
  );
  // En móvil solo la búsqueda queda a la vista; el resto de filtros se pliega
  // para que la lista no empiece tres pantallas más abajo.
  const esMovil = useMediaQuery('(max-width: 48em)');
  const secundarios = [filtros.uniforme, filtros.anio, filtros.tutor].filter(Boolean).length;
  const primariosActivos = [filtros.categoria, filtros.estado, filtros.expediente].filter(Boolean).length;
  const pendientesDeVer = esMovil ? secundarios + primariosActivos : secundarios;

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
        <Indicator label={pendientesDeVer} disabled={!pendientesDeVer || masAbierto} size={16} offset={4}>
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
        {esMovil && <Stack gap="sm" mb="sm">{primarios}</Stack>}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Uniforme"
            placeholder="Todos"
            clearable
            value={filtros.uniforme}
            onChange={(uniforme) => onChange({ uniforme: uniforme as FiltrosAlumnos['uniforme'] })}
            data={[
              { value: 'entregado', label: 'Entregado' },
              { value: 'pendiente', label: 'Por entregar' },
            ]}
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
            label="Tutor"
            placeholder="Todos"
            clearable
            value={filtros.tutor}
            onChange={(tutor) => onChange({ tutor: tutor as FiltrosAlumnos['tutor'] })}
            data={[
              { value: 'con', label: 'Con tutor' },
              { value: 'sin', label: 'Sin tutor asignado' },
            ]}
          />
        </SimpleGrid>
      </Collapse>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs" role="status" aria-live="polite">
          <Badge variant="light" color="gray" size="lg" radius="sm">
            {mostrados === total
              ? `${total} ${total === 1 ? 'alumno' : 'alumnos'}`
              : `${mostrados} de ${total} alumnos`}
          </Badge>
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
