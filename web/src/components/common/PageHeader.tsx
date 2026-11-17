'use client';

import Link from 'next/link';
import { ActionIcon, Box, Group, Stack, Title, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

export type PageHeaderProps = {
  title: string;
  description?: string;
  /** Acciones de escritorio. En móvil se ocultan si hay `mobileAction`. */
  actions?: React.ReactNode;
  /** Flecha de volver, solo en móvil: ruta o callback. */
  back?: string | (() => void);
  /**
   * La única acción visible en la cabecera móvil. El resto de `actions` se
   * queda para escritorio (lo habitual es bajarlas a `ActionBar` o a un sheet).
   */
  mobileAction?: React.ReactNode;
  /** Oculta la descripción en móvil, donde ocupa tres líneas de cromo. */
  compactOnMobile?: boolean;
};

/**
 * Cabecera de pantalla.
 *
 * Antes era un `Group justify="space-between" wrap="wrap"`, que en 375 px
 * envolvía el título y los botones en tres líneas antes de cualquier contenido.
 * Ahora el tamaño y el ancho cambian por CSS (`fz` y `mb` responsivos), y lo que
 * aparece solo en una anchura es un elemento distinto, no una copia: el título y
 * la descripción se renderizan **una sola vez**, para que la pantalla no tenga
 * dos encabezados en el DOM.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  mobileAction,
  compactOnMobile,
}: PageHeaderProps) {
  const volver =
    typeof back === 'string' ? (
      <ActionIcon
        component={Link}
        href={back}
        variant="subtle"
        color="gray"
        aria-label="Volver"
        hiddenFrom="sm"
        style={{ flexShrink: 0 }}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>
    ) : back ? (
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label="Volver"
        hiddenFrom="sm"
        onClick={back}
        style={{ flexShrink: 0 }}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>
    ) : null;

  return (
    <Group
      justify="space-between"
      align="flex-start"
      mb={{ base: 'md', sm: 'lg' }}
      wrap="wrap"
      gap="sm"
    >
      <Group gap="xs" wrap="nowrap" align="center" style={{ minWidth: 0, flex: '1 1 auto' }}>
        {volver}
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Title order={2} fz={{ base: 'h3', sm: 'h2' }} lh={1.2}>
            {title}
          </Title>
          {description && (
            <Box visibleFrom={compactOnMobile ? 'sm' : undefined}>
              <Text c="dimmed" size="sm">
                {description}
              </Text>
            </Box>
          )}
        </Stack>
      </Group>

      {mobileAction && <Box hiddenFrom="sm">{mobileAction}</Box>}
      {actions && (
        // Con `mobileAction` las acciones de escritorio desaparecen del teléfono;
        // sin él se mantienen, para no dejar una pantalla sin salida.
        <Box visibleFrom={mobileAction ? 'sm' : undefined}>
          <Group gap="sm" wrap="wrap">
            {actions}
          </Group>
        </Box>
      )}
    </Group>
  );
}
