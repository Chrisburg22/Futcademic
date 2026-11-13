'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { bottomNavItems, esActivo, shortLabelFor } from './navItems';

/**
 * Barra de navegación inferior, solo en teléfono.
 *
 * Antes la navegación diaria vivía detrás del Burger y los accesos rápidos
 * estaban solo en el Inicio del admin: el alumno y el padre no tenían ninguna
 * navegación a la vista. Ahora la barra se monta una vez en `AppShell` y los
 * destinos salen de `navItems.ts`, la misma fuente que el cajón lateral.
 *
 * Va de borde a borde a propósito: un panel flotante con márgenes regala ~16 px
 * por lado y aleja los objetivos del borde físico de la pantalla, que es el
 * sitio más fácil de acertar con el pulgar.
 *
 * La altura se publica en `--quick-dock-height` para que el contenido reserve
 * hueco y el botón del chat se aparte, sin que nadie repita el número. Si
 * cambia `ALTURA`, hay que cambiar también esa variable en `globals.css`.
 */
const ALTURA = 60;

export function MobileNav({ onMore }: { onMore: () => void }) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const items = bottomNavItems(profile?.role);
  const visible = items.length > 0;

  // Marca el body mientras la barra existe: el contenido reserva hueco abajo y
  // el botón del chat sube. El CSS pone la variable a 0 desde 48em, así que da
  // igual que el atributo esté puesto también en escritorio.
  useEffect(() => {
    if (!visible) return;
    document.body.setAttribute('data-quick-dock', '');
    return () => document.body.removeAttribute('data-quick-dock');
  }, [visible]);

  if (!visible) return null;

  const celdas = items.length + 1; // + «Más»

  const celda = (contenido: React.ReactNode, activa: boolean) => (
    <Stack
      gap={2}
      align="center"
      justify="center"
      h="100%"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        color: activa ? 'var(--mantine-color-futcamedic-7)' : 'var(--mantine-color-dimmed)',
        backgroundColor: activa ? 'var(--mantine-color-futcamedic-light)' : 'transparent',
      }}
    >
      {contenido}
    </Stack>
  );

  return (
    <Paper
      hiddenFrom="sm"
      component="nav"
      aria-label="Navegación principal"
      withBorder={false}
      radius={0}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        /*
         * Por encima del contenido y por **debajo** de los overlays de Mantine,
         * que van en 200: con 250 la barra se dibujaba encima de las hojas
         * inferiores y tapaba su botón principal.
         */
        zIndex: 150,
        display: 'grid',
        gridTemplateColumns: `repeat(${celdas}, 1fr)`,
        height: `calc(${ALTURA}px + env(safe-area-inset-bottom, 0px))`,
        // La barra de gestos de iOS se come el borde inferior si no se aparta.
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      {items.map((item) => {
        const activa = esActivo(item, pathname);
        const etiqueta = shortLabelFor(item, profile?.role);
        const Icono = item.icon;
        return (
          <UnstyledButton
            key={item.to}
            component={Link}
            href={item.to}
            aria-label={etiqueta}
            aria-current={activa ? 'page' : undefined}
            style={{ height: '100%' }}
          >
            {celda(
              <>
                <Icono size={24} stroke={activa ? 2 : 1.6} />
                <Text size="xs" fw={activa ? 700 : 500} lh={1.1} ta="center">
                  {etiqueta}
                </Text>
              </>,
              activa,
            )}
          </UnstyledButton>
        );
      })}

      <UnstyledButton
        onClick={onMore}
        aria-label="Más secciones"
        style={{ height: '100%' }}
      >
        {celda(
          <>
            <IconMenu2 size={24} stroke={1.6} />
            <Text size="xs" fw={500} lh={1.1} ta="center">
              Más
            </Text>
          </>,
          false,
        )}
      </UnstyledButton>
    </Paper>
  );
}
