'use client';

import { Select } from '@mantine/core';
import { FilterGroup, FilterSheet } from '../../../components/common/FilterSheet';
import {
  OPCIONES_ADEUDO,
  OPCIONES_ALTA,
  OPCIONES_EMERGENCIA,
  OPCIONES_ESTADO,
  OPCIONES_EXPEDIENTE,
  OPCIONES_MEDICAS,
  OPCIONES_ORDEN,
  OPCIONES_TUTOR,
  OPCIONES_UNIFORME,
  type FiltrosAlumnos,
} from '../../../lib/students';

export type StudentsFilterSheetProps = {
  opened: boolean;
  onClose: () => void;
  filtros: FiltrosAlumnos;
  onApply: (filtros: FiltrosAlumnos) => void;
  onClear: () => void;
  orden: string;
  onOrden: (valor: string) => void;
  categorias: { id: string; name: string }[];
  anios: string[];
  puedeCambiarEstado: boolean;
  puedeVerPagos: boolean;
  /** Cuántos alumnos daría este borrador, para el botón de confirmar. */
  contar: (filtros: FiltrosAlumnos) => number;
};

/**
 * Los once filtros del listado, en una hoja inferior.
 *
 * En teléfono la barra antigua apilaba diez desplegables —unos 560 px de alto—
 * encima de la lista. Aquí la barra deja a la vista solo el buscador y un botón,
 * y los filtros se agrupan por la pregunta que responde cada uno, en el idioma
 * de la academia y no en el de la base de datos: «¿Qué le falta?» en vez de
 * «expediente».
 *
 * Nada se aplica hasta confirmar (ver `FilterSheet`): tocar un selector ya no
 * recarga la lista que hay detrás del sheet.
 */
export function StudentsFilterSheet({
  opened,
  onClose,
  filtros,
  onApply,
  onClear,
  orden,
  onOrden,
  categorias,
  anios,
  puedeCambiarEstado,
  puedeVerPagos,
  contar,
}: StudentsFilterSheetProps) {
  return (
    <FilterSheet<FiltrosAlumnos>
      opened={opened}
      onClose={onClose}
      value={filtros}
      onApply={onApply}
      onClear={onClear}
      resultCount={contar(filtros)}
      countNoun={{ singular: 'alumno', plural: 'alumnos' }}
    >
      {(borrador, set) => (
        <>
          <FilterGroup title="¿Quién?" withDivider={false}>
            <Select
              label="Categoría"
              placeholder="Todas"
              clearable
              searchable
              nothingFoundMessage="Sin coincidencias"
              value={borrador.categoria}
              onChange={(categoria) => set({ categoria })}
              data={categorias.map((c) => ({ value: c.id, label: c.name }))}
            />
            {puedeCambiarEstado && (
              <Select
                label="Estado"
                placeholder="Todos"
                clearable
                value={borrador.estado}
                onChange={(estado) => set({ estado: estado as FiltrosAlumnos['estado'] })}
                data={OPCIONES_ESTADO}
              />
            )}
            <Select
              label="Año de nacimiento"
              placeholder="Todos"
              clearable
              searchable
              value={borrador.anio}
              onChange={(anio) => set({ anio })}
              data={anios}
            />
          </FilterGroup>

          <FilterGroup title="¿Qué le falta?">
            <Select
              label="Expediente"
              placeholder="Todos"
              clearable
              value={borrador.expediente}
              onChange={(expediente) => set({ expediente })}
              data={OPCIONES_EXPEDIENTE}
            />
            <Select
              label="Uniforme"
              placeholder="Todos"
              clearable
              value={borrador.uniforme}
              onChange={(uniforme) => set({ uniforme: uniforme as FiltrosAlumnos['uniforme'] })}
              data={OPCIONES_UNIFORME}
            />
            <Select
              label="Tutor"
              placeholder="Todos"
              clearable
              value={borrador.tutor}
              onChange={(tutor) => set({ tutor: tutor as FiltrosAlumnos['tutor'] })}
              data={OPCIONES_TUTOR}
            />
            <Select
              label="Contacto de emergencia"
              placeholder="Todos"
              clearable
              value={borrador.emergencia}
              onChange={(emergencia) =>
                set({ emergencia: emergencia as FiltrosAlumnos['emergencia'] })
              }
              data={OPCIONES_EMERGENCIA}
            />
            <Select
              label="Notas médicas"
              placeholder="Todas"
              clearable
              value={borrador.medicas}
              onChange={(medicas) => set({ medicas: medicas as FiltrosAlumnos['medicas'] })}
              data={OPCIONES_MEDICAS}
            />
          </FilterGroup>

          {puedeVerPagos && (
            <FilterGroup title="¿Debe?">
              <Select
                label="Pago del mes"
                placeholder="Todos"
                clearable
                value={borrador.adeudo}
                onChange={(adeudo) => set({ adeudo: adeudo as FiltrosAlumnos['adeudo'] })}
                data={OPCIONES_ADEUDO}
              />
            </FilterGroup>
          )}

          <FilterGroup title="¿Desde cuándo?">
            <Select
              label="Fecha de alta"
              placeholder="Cualquiera"
              clearable
              value={borrador.alta}
              onChange={(alta) => set({ alta: alta as FiltrosAlumnos['alta'] })}
              data={OPCIONES_ALTA}
            />
          </FilterGroup>

          {/*
            El orden no es un filtro, pero vivía en un Select de 220 px de ancho
            fijo que forzaba envolturas en la barra. Aquí tiene sitio. Se aplica
            al instante a propósito: no cambia qué alumnos salen, solo en qué
            orden, así que no hay nada que confirmar.
          */}
          <FilterGroup title="¿En qué orden?">
            <Select
              label="Ordenar por"
              value={orden}
              onChange={(valor) => valor && onOrden(valor)}
              data={OPCIONES_ORDEN}
              allowDeselect={false}
            />
          </FilterGroup>
        </>
      )}
    </FilterSheet>
  );
}
