'use client';

import { useEffect } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import classes from './ActionBar.module.css';

export type ActionBarAction = {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  form?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  color?: string;
};

export type ActionBarProps = {
  /** La acción de la pantalla. Una sola, a propósito. */
  primary: ActionBarAction;
  secondary?: Omit<ActionBarAction, 'loading' | 'leftIcon'>;
  /** Estado por encima de los botones: «Tienes cambios sin guardar». */
  status?: { text: string; tone?: 'neutral' | 'warning' | 'danger' };
  /**
   * 'page'  — fija al viewport en teléfono, pegada al flujo desde `sm`.
   * 'sheet' — al pie del BottomSheet que la contiene.
   * 'inline'— pegada dentro del flujo en cualquier anchura.
   */
  variant?: 'page' | 'sheet' | 'inline';
  /** Oculta la barra desde `sm`, cuando la pantalla ya tiene su propio botón. */
  mobileOnly?: boolean;
};

const COLOR_ESTADO = {
  neutral: undefined,
  warning: 'orange.8',
  danger: 'red.7',
} as const;

/**
 * Una sola acción principal, al alcance del pulgar.
 *
 * En `variant="page"` se apoya en `--quick-dock-height` para colocarse encima de
 * la barra de navegación sin repetir su altura, y suma `env(safe-area-inset-bottom)`
 * para no quedar debajo de la barra de gestos. Es justo lo que le faltaba a la
 * barra de guardado del formulario de alumnos, que estaba a `sticky bottom: 0`
 * y se solapaba con el dock.
 */
export function ActionBar({
  primary,
  secondary,
  status,
  variant = 'page',
  mobileOnly,
}: ActionBarProps) {
  const fija = variant === 'page';

  // Mientras la barra flota, el contenido reserva hueco abajo; si no, el último
  // campo del formulario queda tapado. Desde `sm` la barra es `sticky` y ocupa
  // su sitio en el flujo, así que `globals.css` pone la variable a 0.
  useEffect(() => {
    if (!fija) return;
    document.body.setAttribute('data-action-bar', '');
    return () => document.body.removeAttribute('data-action-bar');
  }, [fija]);

  return (
    <Paper
      radius={0}
      p="md"
      className={`${classes[variant]}${mobileOnly ? ` ${classes.mobileOnly}` : ''}`}
      role="group"
      aria-label="Acciones"
    >
      <Stack gap="xs">
        {status && (
          <Group gap={6} wrap="nowrap">
            {status.tone && status.tone !== 'neutral' && (
              <IconAlertTriangle size={16} color="var(--mantine-color-orange-8)" />
            )}
            <Text size="sm" fw={600} c={COLOR_ESTADO[status.tone ?? 'neutral']}>
              {status.text}
            </Text>
          </Group>
        )}
        <Group gap="sm" wrap="nowrap" justify="flex-end">
          {secondary && (
            <Button
              variant="default"
              type={secondary.type ?? 'button'}
              form={secondary.form}
              onClick={secondary.onClick}
              disabled={secondary.disabled}
            >
              {secondary.label}
            </Button>
          )}
          <Button
            // La acción principal se queda con el ancho que sobra: es la única.
            style={{ flex: '1 1 auto' }}
            size="lg"
            type={primary.type ?? 'button'}
            form={primary.form}
            color={primary.color}
            loading={primary.loading}
            disabled={primary.disabled}
            leftSection={primary.leftIcon}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
