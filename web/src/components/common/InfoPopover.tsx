'use client';

import { useState } from 'react';
import { ActionIcon, Popover, Stack, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEsMovil } from '../../hooks/useEsMovil';
import { BottomSheet } from './BottomSheet';

export type InfoPopoverProps = {
  /** Encabezado y, a falta de otro, etiqueta accesible del disparador. */
  title: string;
  children: React.ReactNode;
  /** El disparador. Si falta, un icono «i» de 44 px. */
  target?: React.ReactNode;
  color?: string;
  /**
   * Contenido largo (una lista de documentos que faltan): en teléfono se abre
   * como hoja inferior, porque un popover de 300 px flotando en 375 es
   * ilegible.
   */
  sheetOnMobile?: boolean;
};

/**
 * Información que se abre **con un toque**.
 *
 * Sustituye a los `Tooltip` que eran el único sitio donde vivía un dato: qué
 * documentos faltan del expediente, qué pendientes tiene el alumno, si se
 * entregó el uniforme. En una pantalla táctil el tooltip de Mantine no se abre
 * al tocar, así que esa información simplemente no existía en el teléfono.
 */
export function InfoPopover({
  title,
  children,
  target,
  color,
  sheetOnMobile = false,
}: InfoPopoverProps) {
  const [abierto, setAbierto] = useState(false);
  const esMovil = useEsMovil();

  const disparador = target ?? (
    <ActionIcon variant="subtle" color={color ?? 'gray'} aria-label={title}>
      <IconInfoCircle size={18} />
    </ActionIcon>
  );

  const envoltorioDisparador = (
    <span
      role="button"
      tabIndex={0}
      aria-label={title}
      aria-expanded={abierto}
      aria-haspopup="dialog"
      onClick={() => setAbierto((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setAbierto((v) => !v);
        }
      }}
      // El disparador es el objetivo táctil, no el badge que lleva dentro.
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
        cursor: 'pointer',
      }}
    >
      {disparador}
    </span>
  );

  if (esMovil && sheetOnMobile) {
    return (
      <>
        {envoltorioDisparador}
        <BottomSheet opened={abierto} onClose={() => setAbierto(false)} title={title} size="auto">
          {children}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover
      opened={abierto}
      onChange={setAbierto}
      position="bottom"
      withArrow
      withinPortal
      trapFocus
      shadow="md"
      width={280}
    >
      <Popover.Target>{envoltorioDisparador}</Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {title}
          </Text>
          {children}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
