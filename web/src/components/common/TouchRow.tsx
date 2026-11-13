'use client';

import Link from 'next/link';
import { Box, Checkbox, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

export type TouchRowProps = {
  /** Avatar, inicial o icono. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Etiquetas de estado bajo el texto (categoría, expediente, adeudo). */
  tags?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** Acción secundaria a la derecha, con su propia zona de 44 px. */
  trailing?: React.ReactNode;
  selectable?: { checked: boolean; onChange: (checked: boolean) => void; label: string };
  tone?: 'default' | 'selected' | 'warning' | 'danger';
  /** Etiqueta accesible de la acción principal; cae a `Abrir {title}`. */
  openLabel?: string;
  /** Oculta el chevron cuando la fila no navega a ningún sitio. */
  withChevron?: boolean;
};

const BORDE = {
  default: 'var(--mantine-color-default-border)',
  selected: 'var(--mantine-color-futcamedic-6)',
  warning: 'var(--mantine-color-orange-5)',
  danger: 'var(--mantine-color-red-5)',
} as const;

/**
 * Fila táctil grande: toda la superficie es el objetivo.
 *
 * En la tarjeta de alumno antigua solo era tocable el bloque del nombre, y el
 * resto de la tarjeta —la mayor parte de su área— no hacía nada. Aquí el botón
 * ocupa la fila entera y los controles secundarios (casilla, menú) viven en su
 * propia zona, con `stopPropagation` para que no disparen la acción principal.
 */
export function TouchRow({
  leading,
  title,
  subtitle,
  tags,
  href,
  onClick,
  trailing,
  selectable,
  tone = 'default',
  openLabel,
  withChevron = true,
}: TouchRowProps) {
  const navega = Boolean(href || onClick);

  const texto = (
    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
      <Text fw={600} lh={1.25} style={{ overflowWrap: 'anywhere' }}>
        {title}
      </Text>
      {subtitle && (
        <Text size="sm" c="dimmed" lh={1.3}>
          {subtitle}
        </Text>
      )}
    </Stack>
  );

  const principal = (
    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
      {leading}
      {texto}
      {navega && withChevron && !trailing && (
        <IconChevronRight size={18} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />
      )}
    </Group>
  );

  const comunes = {
    'aria-label': openLabel || `Abrir ${title}`,
    style: { flex: 1, minWidth: 0, minHeight: 56, textAlign: 'left' as const },
  };

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{
        borderColor: BORDE[tone],
        background: tone === 'selected' ? 'var(--mantine-color-futcamedic-light)' : undefined,
      }}
    >
      <Group gap="xs" wrap="nowrap" align="flex-start">
        {selectable && (
          // La casilla mide 20 px; la zona sensible, 44 (`touch-row` del tema).
          <Box onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <Checkbox
              checked={selectable.checked}
              onChange={(e) => selectable.onChange(e.currentTarget.checked)}
              aria-label={selectable.label}
            />
          </Box>
        )}

        {href ? (
          <UnstyledButton component={Link} href={href} onClick={onClick} {...comunes}>
            {principal}
          </UnstyledButton>
        ) : onClick ? (
          <UnstyledButton onClick={onClick} {...comunes}>
            {principal}
          </UnstyledButton>
        ) : (
          <Box style={{ flex: 1, minWidth: 0, minHeight: 56, display: 'flex', alignItems: 'center' }}>
            {principal}
          </Box>
        )}

        {trailing && (
          <Box onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            {trailing}
          </Box>
        )}
      </Group>

      {tags && (
        <Group gap="xs" wrap="wrap" mt="xs">
          {tags}
        </Group>
      )}
    </Paper>
  );
}
