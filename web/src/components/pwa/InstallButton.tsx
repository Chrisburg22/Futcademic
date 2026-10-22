import { useState, useSyncExternalStore } from 'react';
import { ActionIcon, Button, List, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconDeviceMobileDown,
  IconDotsVertical,
  IconShare2,
  IconSquarePlus,
} from '@tabler/icons-react';
import {
  getInstallPrompt,
  isDesktopInstallable,
  isIos,
  isSafari,
  isStandalone,
  promptInstall,
  subscribeToInstallPrompt,
} from '../../lib/pwaInstall';

const LABEL = 'Instalar app';

/**
 * Cómo se puede instalar en este navegador:
 *
 * - `prompt`: hay evento nativo (Chrome/Edge/Android) y basta con pulsar.
 * - `ios`:    Safari de iPhone/iPad, hay que guiar por Compartir.
 * - `manual`: escritorio que instala pero no dispara el evento (Brave es el
 *             caso típico) — se explican los pasos del menú.
 * - `none`:   ya instalada o el navegador no sabe hacerlo.
 */
export type InstallMode = 'prompt' | 'ios' | 'manual' | 'none';

export function useInstallMode(): InstallMode {
  const prompt = useSyncExternalStore(subscribeToInstallPrompt, getInstallPrompt, () => null);
  const [installed] = useState(isStandalone);

  if (installed) return 'none';
  if (prompt) return 'prompt';
  if (isIos()) return 'ios';
  if (isDesktopInstallable()) return 'manual';
  return 'none';
}

/** Para envolturas (separadores, títulos) que no deben quedar huérfanas. */
export function useCanInstall() {
  return useInstallMode() !== 'none';
}

/**
 * Botón para instalar Futcademic como app.
 *
 * Disponible para cualquier rol y en cualquier página: no filtra por permisos
 * ni por tipo de usuario, solo por lo que soporta el navegador.
 *
 * En pantallas estrechas se reduce a un icono, porque la cabecera va justa de
 * sitio en móvil y es justo donde más sentido tiene instalar.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const mode = useInstallMode();
  const [installed, setInstalled] = useState(false);
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false);

  if (installed || mode === 'none') return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstalled(true);
      notifications.show({
        color: 'teal',
        title: 'Futcademic instalada',
        message: 'Búscala en tu pantalla de inicio.',
      });
    }
  };

  const onClick = mode === 'prompt' ? handleInstall : openHelp;

  const trigger = compact ? (
    <Tooltip label={LABEL}>
      <ActionIcon variant="subtle" size="lg" aria-label={LABEL} onClick={onClick}>
        <IconDeviceMobileDown size={20} />
      </ActionIcon>
    </Tooltip>
  ) : (
    <Button
      leftSection={<IconDeviceMobileDown size={18} />}
      onClick={onClick}
      variant={mode === 'prompt' ? 'filled' : 'light'}
    >
      {LABEL}
    </Button>
  );

  return (
    <>
      {trigger}
      <Modal opened={helpOpened} onClose={closeHelp} title="Instalar Futcademic" centered>
        {mode === 'ios' ? (
          <Stack gap="md">
            <Text size="sm">
              En iPhone y iPad la instalación se hace desde Safari, en tres pasos:
            </Text>
            <List spacing="sm" size="sm">
              <List.Item icon={<IconShare2 size={18} />}>
                Pulsa <b>Compartir</b> en la barra del navegador.
              </List.Item>
              <List.Item icon={<IconSquarePlus size={18} />}>
                Elige <b>Añadir a pantalla de inicio</b>.
              </List.Item>
              <List.Item icon={<IconDeviceMobileDown size={18} />}>
                Confirma con <b>Añadir</b>.
              </List.Item>
            </List>
            <Text size="xs" c="dimmed">
              Si estás en Chrome o Firefox dentro del iPhone, ábrela antes en Safari: iOS solo
              permite instalar desde ahí.
            </Text>
          </Stack>
        ) : isSafari() ? (
          <Stack gap="md">
            <Text size="sm">En Safari de Mac se instala desde la barra del navegador:</Text>
            <List spacing="sm" size="sm">
              <List.Item icon={<IconShare2 size={18} />}>
                Abre el menú <b>Compartir</b>.
              </List.Item>
              <List.Item icon={<IconSquarePlus size={18} />}>
                Elige <b>Añadir al Dock</b>.
              </List.Item>
            </List>
          </Stack>
        ) : (
          <Stack gap="md">
            <Text size="sm">
              Tu navegador instala la app desde su propio menú, sin pedir permiso aquí:
            </Text>
            <List spacing="sm" size="sm">
              <List.Item icon={<IconDotsVertical size={18} />}>
                Abre el <b>menú del navegador</b> (los tres puntos, arriba a la derecha).
              </List.Item>
              <List.Item icon={<IconDeviceMobileDown size={18} />}>
                Elige <b>Instalar Futcademic</b> o <b>Instalar app</b>.
              </List.Item>
            </List>
            <Text size="xs" c="dimmed">
              En Chrome y Edge también aparece un icono de instalación al final de la barra de
              direcciones.
            </Text>
          </Stack>
        )}
      </Modal>
    </>
  );
}
