'use client';

import { Box, Drawer, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import { useEsMovil } from '../../hooks/useEsMovil';
import { ActionBar, type ActionBarAction } from './ActionBar';

export type BottomSheetSize = 'auto' | 'half' | 'tall' | 'full';

export type BottomSheetProps = {
  opened: boolean;
  onClose: () => void;
  /** Obligatorio: sin título el usuario no sabe dónde ha aterrizado. */
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: BottomSheetSize;
  primaryAction?: ActionBarAction;
  secondaryAction?: Omit<ActionBarAction, 'loading' | 'leftIcon'>;
  /** En escritorio: modal centrado (por omisión) o cajón lateral. */
  desktopVariant?: 'modal' | 'drawer-right';
  /** Etiqueta del botón de cerrar, cuando «Cerrar» a secas es ambiguo. */
  closeLabel?: string;
};

/**
 * Hoja inferior, sobre el `Drawer` de Mantine.
 *
 * Se descartó `vaul`: son ~12-15 kB más `@radix-ui/react-dialog`, o sea un
 * segundo sistema de diálogos completo conviviendo con el `ModalsProvider` que
 * ya está montado — dos gestores de foco solapados en la misma pantalla. Lo que
 * `vaul` aporta de verdad es el arrastre con puntos de anclaje, y el público de
 * alumno y padre no descubre gestos de arrastre: necesita un botón de cerrar
 * grande. El «asa» de aquí cierra al tocarla, que cubre la señal sin el gesto.
 *
 * El cuerpo scrollea dentro de un `ScrollArea` y el pie queda **fuera** de él:
 * es lo que evita que el botón de guardar se vaya más allá del borde del sheet.
 */
const ALTO: Record<BottomSheetSize, React.CSSProperties> = {
  auto: { height: 'auto', maxHeight: '90dvh' },
  half: { height: '60dvh' },
  tall: { height: '90dvh' },
  full: { height: '100dvh' },
};

export function BottomSheet({
  opened,
  onClose,
  title,
  description,
  children,
  size = 'tall',
  primaryAction,
  secondaryAction,
  desktopVariant = 'modal',
  closeLabel = 'Cerrar',
}: BottomSheetProps) {
  const esMovil = useEsMovil();

  const cuerpo = (
    <>
      <ScrollArea.Autosize style={{ flex: 1, minHeight: 0 }}>
        <Box px="md" pb="md">
          {description && (
            <Text size="sm" c="dimmed" mb="md">
              {description}
            </Text>
          )}
          {children}
        </Box>
      </ScrollArea.Autosize>
      {primaryAction && (
        <ActionBar variant="sheet" primary={primaryAction} secondary={secondaryAction} />
      )}
    </>
  );

  // Escritorio: el sheet no aporta nada, ahí hay sitio de sobra.
  if (!esMovil) {
    if (desktopVariant === 'drawer-right') {
      return (
        <Drawer
          opened={opened}
          onClose={onClose}
          position="right"
          size="lg"
          title={title}
          closeButtonProps={{ 'aria-label': closeLabel }}
          styles={{
            content: { display: 'flex', flexDirection: 'column' },
            body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
          }}
        >
          {cuerpo}
        </Drawer>
      );
    }
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        centered
        size="lg"
        title={title}
        closeButtonProps={{ 'aria-label': closeLabel }}
        styles={{
          content: { display: 'flex', flexDirection: 'column', maxHeight: '85dvh' },
          body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
        }}
      >
        {cuerpo}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      title={title}
      closeButtonProps={{ size: 'lg', 'aria-label': closeLabel }}
      // Sin esto el sheet cerrado sigue en el DOM y lo infla sin motivo.
      keepMounted={false}
      styles={{
        content: {
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: 'var(--mantine-radius-lg)',
          borderTopRightRadius: 'var(--mantine-radius-lg)',
          // El pie del sheet no debe quedar bajo la barra de gestos.
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          ...ALTO[size],
        },
        header: { flexShrink: 0, paddingBottom: 0 },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
      }}
    >
      {/* Sin asa: el `Drawer` de Mantine pinta su cabecera primero, así que una
          barrita debajo del título se lee como un separador, no como «esto se
          cierra». El botón de cerrar va a `size="lg"` y hace ese trabajo. */}
      <Stack gap={0} style={{ flex: 1, minHeight: 0 }}>
        {cuerpo}
      </Stack>
    </Drawer>
  );
}
