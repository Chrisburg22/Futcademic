'use client';

import { ActionIcon, TextInput, type TextInputProps } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

export type SearchInputProps = Omit<TextInputProps, 'value' | 'onChange' | 'rightSection'> & {
  value: string;
  onChange: (valor: string) => void;
  /** Etiqueta del botón de borrar, para lectores de pantalla. */
  clearLabel?: string;
};

/**
 * Buscador con los atributos que el teclado del teléfono necesita.
 *
 * `type="search"` + `enterKeyHint="search"` hacen que iOS y Android pinten la
 * tecla «buscar» en vez de un salto de línea, e `inputMode="search"` abre el
 * teclado correcto. Sin `autoCapitalize="none"` y `spellCheck={false}`, escribir
 * un nombre propio acaba con mayúsculas y subrayado rojo.
 *
 * El micrófono del propio teclado cubre el dictado: no hace falta cargar el
 * modelo local de voz (~100 MB) para buscar un alumno.
 */
export function SearchInput({
  value,
  onChange,
  clearLabel = 'Borrar búsqueda',
  ...props
}: SearchInputProps) {
  return (
    <TextInput
      type="search"
      inputMode="search"
      enterKeyHint="search"
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      leftSection={<IconSearch size={16} />}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      rightSection={
        value ? (
          <ActionIcon variant="subtle" color="gray" aria-label={clearLabel} onClick={() => onChange('')}>
            <IconX size={16} />
          </ActionIcon>
        ) : undefined
      }
      {...props}
    />
  );
}
