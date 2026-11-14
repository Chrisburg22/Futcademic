'use client';

import { Box, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';

export type BirthDateInputProps = {
  label?: string;
  required?: boolean;
  description?: string;
  error?: React.ReactNode;
  value?: Date | null;
  onChange: (valor: Date | null) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  name?: string;
};

const ISO = 'YYYY-MM-DD';

/**
 * Fecha de nacimiento: rueda nativa en teléfono, calendario de Mantine en
 * escritorio.
 *
 * El calendario de Mantine obliga a navegar diez o quince años a flechazos para
 * la fecha de nacimiento de un niño; la rueda de iOS y Android resuelve eso de
 * un gesto. Se montan los dos controles y **el CSS elige**
 * (`hiddenFrom`/`visibleFrom`): decidirlo en JS con `useMediaQuery` pintaría la
 * rama equivocada en el primer render. Ambos leen y escriben el mismo `value`,
 * así que el oculto solo es marcado inerte.
 */
export function BirthDateInput({
  value,
  onChange,
  label = 'Fecha de nacimiento',
  description,
  error,
  required,
  onBlur,
  onFocus,
  name,
}: BirthDateInputProps) {
  const comunes = { label, description, error, required, onBlur, onFocus, name };

  return (
    <>
      <Box hiddenFrom="sm">
        <TextInput
          type="date"
          max={dayjs().format(ISO)}
          value={value ? dayjs(value).format(ISO) : ''}
          onChange={(e) => {
            const texto = e.currentTarget.value;
            const fecha = texto ? dayjs(texto, ISO, true) : null;
            onChange(fecha && fecha.isValid() ? fecha.toDate() : null);
          }}
          {...comunes}
        />
      </Box>
      <Box visibleFrom="sm">
        <DateInput
          valueFormat="DD/MM/YYYY"
          maxDate={new Date()}
          value={value ?? null}
          onChange={onChange}
          {...comunes}
        />
      </Box>
    </>
  );
}
