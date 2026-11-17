'use client';

import { useEffect, useState } from 'react';
import { Divider, Stack, Text } from '@mantine/core';
import { BottomSheet } from './BottomSheet';

export type FilterSheetProps<T extends Record<string, unknown>> = {
  opened: boolean;
  onClose: () => void;
  /** Lo aplicado ahora mismo. */
  value: T;
  /** Solo al confirmar. */
  onApply: (valor: T) => void;
  onClear: () => void;
  /**
   * Cuántos resultados daría el borrador. Va en el botón: «Ver 23 alumnos» se
   * entiende; «Aplicar» no dice nada.
   */
  resultCount?: number;
  /** Cómo se nombra lo que se cuenta: «alumno» → «Ver 23 alumnos». */
  countNoun?: { singular: string; plural: string };
  children: (borrador: T, set: (parche: Partial<T>) => void) => React.ReactNode;
  title?: string;
};

/**
 * Filtros en hoja inferior, con borrador.
 *
 * La barra de filtros antigua aplicaba cada cambio al instante: en teléfono eso
 * significaba que la lista de detrás se recargaba mientras el usuario seguía
 * tocando selectores. Aquí se edita una copia y no se aplica nada hasta
 * confirmar.
 */
export function FilterSheet<T extends Record<string, unknown>>({
  opened,
  onClose,
  value,
  onApply,
  onClear,
  resultCount,
  countNoun = { singular: 'resultado', plural: 'resultados' },
  children,
  title = 'Filtros',
}: FilterSheetProps<T>) {
  const [borrador, setBorrador] = useState<T>(value);

  // Al abrir, el borrador parte de lo que está aplicado; si se cierra sin
  // confirmar, lo tocado se descarta.
  useEffect(() => {
    if (opened) setBorrador(value);
  }, [opened, value]);

  const set = (parche: Partial<T>) => setBorrador((b) => ({ ...b, ...parche }));

  const etiqueta =
    resultCount == null
      ? 'Ver resultados'
      : `Ver ${resultCount} ${resultCount === 1 ? countNoun.singular : countNoun.plural}`;

  return (
    <BottomSheet
      opened={opened}
      onClose={onClose}
      title={title}
      size="tall"
      primaryAction={{
        label: etiqueta,
        onClick: () => {
          onApply(borrador);
          onClose();
        },
      }}
      secondaryAction={{
        label: 'Limpiar',
        onClick: () => {
          onClear();
          onClose();
        },
      }}
    >
      <Stack gap="lg">{children(borrador, set)}</Stack>
    </BottomSheet>
  );
}

/**
 * Grupo de filtros con título en el idioma de la academia, no de la base de
 * datos: «¿Qué le falta?» en vez de «expediente».
 */
export function FilterGroup({
  title,
  children,
  withDivider = true,
}: {
  title: string;
  children: React.ReactNode;
  withDivider?: boolean;
}) {
  return (
    <Stack gap="sm">
      {withDivider && <Divider />}
      <Text fw={700} size="sm">
        {title}
      </Text>
      <Stack gap="sm">{children}</Stack>
    </Stack>
  );
}
