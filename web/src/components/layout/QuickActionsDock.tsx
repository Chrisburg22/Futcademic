import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Paper, Stack, Text, UnstyledButton } from '@mantine/core';

export type QuickAction = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

/**
 * Accesos rápidos como barra flotante al pie, solo en móvil.
 *
 * En una pantalla de teléfono los accesos quedaban al final del scroll, fuera
 * de vista y lejos del pulgar. Aquí viven fijos y al alcance.
 *
 * El alto de la barra se publica en `--quick-dock-height` para que quien tenga
 * que apartarse (el contenido y el botón del chat) lo haga sin números
 * duplicados por el código.
 */
export function QuickActionsDock({ actions }: { actions: QuickAction[] }) {
  const { pathname } = useLocation();
  const visible = actions.length > 0;

  // Marca el body mientras el dock existe: el contenido reserva hueco abajo y
  // el botón del chat sube, sin que ninguno de los dos repita la altura.
  useEffect(() => {
    if (!visible) return;
    document.body.setAttribute('data-quick-dock', '');
    return () => document.body.removeAttribute('data-quick-dock');
  }, [visible]);

  if (!visible) return null;

  return (
    <Box
      hiddenFrom="sm"
      component="nav"
      aria-label="Accesos rápidos"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Por encima del contenido, por debajo de modales y notificaciones.
        zIndex: 250,
        padding: 'var(--mantine-spacing-xs)',
        // La barra de gestos de iOS se come el borde inferior si no se aparta.
        paddingBottom: 'calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none',
      }}
    >
      <Paper
        withBorder
        radius="lg"
        shadow="md"
        p={4}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${actions.length}, 1fr)`,
          gap: 4,
          pointerEvents: 'auto',
        }}
      >
        {actions.map((a) => {
          const active = pathname === a.to || pathname.startsWith(`${a.to}/`);
          return (
            <UnstyledButton
              key={a.to}
              component={Link}
              to={a.to}
              aria-label={a.label}
              aria-current={active ? 'page' : undefined}
              style={{
                // 44pt mínimo de zona táctil.
                minHeight: 52,
                borderRadius: 'var(--mantine-radius-md)',
                padding: '6px 2px',
                color: active
                  ? 'var(--mantine-color-futcamedic-7)'
                  : 'var(--mantine-color-dimmed)',
                backgroundColor: active
                  ? 'var(--mantine-color-futcamedic-light)'
                  : 'transparent',
              }}
            >
              <Stack gap={2} align="center" justify="center">
                {a.icon}
                <Text size="10px" fw={active ? 700 : 500} lh={1.1} ta="center">
                  {a.label}
                </Text>
              </Stack>
            </UnstyledButton>
          );
        })}
      </Paper>
    </Box>
  );
}
