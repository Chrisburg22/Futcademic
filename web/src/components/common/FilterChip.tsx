'use client';

import { ActionIcon, Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export type FilterChipProps = {
  label: string;
  /** Valor aplicado, se muestra tras la etiqueta. */
  value?: string;
  /** Quitar este filtro. Botón propio de 44 px. */
  onRemove?: () => void;
  /** Abrir el panel de filtros en la sección de este filtro. */
  onClick?: () => void;
  color?: string;
};

/**
 * Filtro aplicado, en tamaño tocable.
 *
 * Sustituye al `Pill withRemoveButton`, cuya X medía unos 16 px: para quitar un
 * filtro había que acertar en un cuadrado más pequeño que la yema del dedo.
 */
export function FilterChip({ label, value, onRemove, onClick, color }: FilterChipProps) {
  const texto = (
    <Text size="sm" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
      <Text span c="dimmed" size="sm">
        {label}
        {value ? ': ' : ''}
      </Text>
      {value && (
        <Text span fw={600} size="sm">
          {value}
        </Text>
      )}
    </Text>
  );

  return (
    <Paper
      withBorder
      radius="xl"
      pl="sm"
      pr={onRemove ? 4 : 'sm'}
      style={{
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        borderColor: color ? `var(--mantine-color-${color}-5)` : undefined,
      }}
    >
      <Group gap={4} wrap="nowrap">
        {onClick ? (
          <UnstyledButton
            onClick={onClick}
            aria-label={`Cambiar ${label}`}
            style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
          >
            {texto}
          </UnstyledButton>
        ) : (
          texto
        )}
        {onRemove && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onRemove}
            aria-label={`Quitar filtro ${label}`}
          >
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
}
