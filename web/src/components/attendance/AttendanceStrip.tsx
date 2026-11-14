'use client';

import { useEffect, useRef } from 'react';
import { Box, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';

export type RegistroAsistencia = {
  id?: string;
  date: string;
  type?: string;
  present: boolean;
};

export type AttendanceStripProps = {
  registros: RegistroAsistencia[];
  /** Cuántas sesiones mostrar, de la más reciente hacia atrás. */
  limite?: number;
};

/**
 * Las últimas sesiones como círculos grandes, en vez de una tabla.
 *
 * Un alumno o un padre no quiere leer cincuenta filas de «Fecha / Tipo /
 * Asistió»: quiere ver de un golpe si está yendo. Cada círculo mide 44 px, así
 * que además es tocable, y lleva icono y texto, no solo color: verde y rojo
 * solos no se distinguen con daltonismo.
 */
export function AttendanceStrip({ registros, limite = 10 }: AttendanceStripProps) {
  const ultimas = [...registros]
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, limite)
    .reverse();

  const pista = useRef<HTMLDivElement>(null);

  /*
   * Las sesiones van en orden cronológico, así que las más recientes quedan a la
   * derecha y fuera de pantalla. Se arranca con el scroll al final: lo primero
   * que se ve es lo último que pasó, y hacia atrás se desplaza.
   */
  useEffect(() => {
    const el = pista.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [ultimas.length]);

  if (ultimas.length === 0) return null;

  return (
    <Box
      ref={pista}
      style={{ display: 'flex', gap: 'var(--mantine-spacing-xs)', overflowX: 'auto', paddingBottom: 4 }}
    >
      {ultimas.map((r, i) => {
        const fecha = dayjs(r.date);
        const etiqueta = `${fecha.format('dddd D [de] MMMM')}: ${
          r.present ? 'asistió' : 'faltó'
        }${r.type ? ` (${r.type})` : ''}`;
        return (
          <Tooltip key={r.id ?? `${r.date}-${i}`} label={etiqueta} withArrow>
            <Stack gap={4} align="center" style={{ flexShrink: 0 }}>
              <Stack
                gap={0}
                align="center"
                justify="center"
                w={44}
                h={44}
                aria-label={etiqueta}
                style={{
                  borderRadius: '50%',
                  color: r.present
                    ? 'var(--mantine-color-teal-9)'
                    : 'var(--mantine-color-red-9)',
                  background: r.present
                    ? 'var(--mantine-color-teal-1)'
                    : 'var(--mantine-color-red-1)',
                  border: `2px solid ${
                    r.present ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'
                  }`,
                }}
              >
                {r.present ? <IconCheck size={20} /> : <IconX size={20} />}
              </Stack>
              <Text size="sm" c="dimmed" lh={1.1} ta="center">
                {fecha.format('D MMM')}
              </Text>
            </Stack>
          </Tooltip>
        );
      })}
    </Box>
  );
}
