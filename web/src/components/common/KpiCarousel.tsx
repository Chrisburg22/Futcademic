'use client';

import { useEffect, useRef, useState } from 'react';
import { Group, Paper, Skeleton, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import classes from './KpiCarousel.module.css';

export type KpiItem = {
  key: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  /** Pie de la tarjeta: «$3,200 por cobrar». */
  footer?: string;
  /** Si existe, la tarjeta filtra la lista al tocarla. */
  onSelect?: () => void;
  active?: boolean;
  /** Si existe, la tarjeta navega. */
  href?: string;
};

export type KpiCarouselProps = {
  items: KpiItem[];
  loading?: boolean;
  /** Ancho de tarjeta en teléfono. */
  itemWidth?: string;
  'aria-label': string;
};

/**
 * Indicadores que se deslizan con anclaje y dicen que hay más.
 *
 * La versión anterior era un `div` con `overflow-x: auto` y tarjetas de 150 px:
 * en 375 px se veían dos de siete, sin anclaje, sin indicador y sin ninguna
 * señal de que el resto existía.
 */
export function KpiCarousel({
  items,
  loading,
  itemWidth = '78%',
  'aria-label': ariaLabel,
}: KpiCarouselProps) {
  const pista = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(0);

  // Puntos de posición: señal puramente visual, de ahí el aria-hidden.
  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const alDesplazar = () => {
      const ancho = el.scrollWidth - el.clientWidth;
      if (ancho <= 0) return setVisible(0);
      setVisible(Math.round((el.scrollLeft / ancho) * (items.length - 1)));
    };
    el.addEventListener('scroll', alDesplazar, { passive: true });
    return () => el.removeEventListener('scroll', alDesplazar);
  }, [items.length]);

  return (
    <div role="group" aria-label={ariaLabel}>
      <div
        ref={pista}
        className={classes.track}
        style={{ ['--kpi-item-width' as string]: itemWidth }}
      >
        {items.map((item) => {
          const cuerpo = (
            <Group gap="sm" wrap="nowrap" h="100%">
              {item.icon && (
                <ThemeIcon size={40} radius="md" variant="light" color={item.color}>
                  {item.icon}
                </ThemeIcon>
              )}
              <Stack gap={2} style={{ minWidth: 0 }}>
                {loading ? (
                  <Skeleton height={26} width={48} />
                ) : (
                  <Text fw={700} fz={26} lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.value}
                  </Text>
                )}
                {/* `sm`, no `xs`: la etiqueta dice qué es el número. */}
                <Text size="sm" c="dimmed" lh={1.25}>
                  {item.label}
                </Text>
                {item.footer && (
                  <Text size="sm" c="dimmed" lh={1.25} truncate>
                    {item.footer}
                  </Text>
                )}
              </Stack>
            </Group>
          );

          const estilo = {
            borderColor: item.active
              ? `var(--mantine-color-${item.color ?? 'futcamedic'}-6)`
              : undefined,
            background: item.active
              ? `var(--mantine-color-${item.color ?? 'futcamedic'}-light)`
              : undefined,
            height: '100%',
          };

          const envoltorio = (contenido: React.ReactNode) => (
            <Paper withBorder radius="md" p="sm" style={estilo}>
              {contenido}
            </Paper>
          );

          return (
            <div key={item.key} className={classes.item}>
              {item.href ? (
                <UnstyledButton
                  component="a"
                  href={item.href}
                  aria-label={`${item.label}: ${item.value}`}
                  style={{ display: 'block', height: '100%' }}
                >
                  {envoltorio(cuerpo)}
                </UnstyledButton>
              ) : item.onSelect ? (
                <UnstyledButton
                  onClick={item.onSelect}
                  aria-pressed={item.active}
                  aria-label={`${item.label}: ${item.value}. Filtrar la lista`}
                  style={{ display: 'block', height: '100%', width: '100%', textAlign: 'left' }}
                >
                  {envoltorio(cuerpo)}
                </UnstyledButton>
              ) : (
                envoltorio(cuerpo)
              )}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className={classes.dots} aria-hidden="true">
          {items.map((item, i) => (
            <span
              key={item.key}
              className={`${classes.dot} ${i === visible ? classes.dotActive : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
