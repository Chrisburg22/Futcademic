import { useState, useSyncExternalStore } from 'react';
import { ActionIcon, Button, List, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDeviceMobileDown, IconShare2, IconSquarePlus } from '@tabler/icons-react';
import {
  getInstallPrompt,
  isIos,
  isStandalone,
  promptInstall,
  subscribeToInstallPrompt,
} from '../../lib/pwaInstall';

const LABEL = 'Instalar app';

/**
 * Botón para instalar Futcademic como app.
 *
 * Disponible para cualquier rol y en cualquier página: no filtra por permisos
 * ni por tipo de usuario, solo por lo que soporta el navegador.
 *
 * - Chrome/Edge/Android: usa el evento nativo `beforeinstallprompt`.
 * - Safari en iOS: no existe ese evento, así que abre un modal con los pasos.
 * - App ya instalada: no se muestra nada.
 *
 * En pantallas estrechas se reduce a un icono, porque la cabecera va justa de
 * sitio en móvil y es justo donde más sentido tiene instalar.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const prompt = useSyncExternalStore(subscribeToInstallPrompt, getInstallPrompt, () => null);
  const [installed, setInstalled] = useState(isStandalone);
  const [iosHelpOpened, { open: openIosHelp, close: closeIosHelp }] = useDisclosure(false);

  if (installed) return null;

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

  const ios = !prompt && isIos();

  // Ni evento nativo ni iOS: el navegador no sabe instalar, no prometemos algo
  // que al pulsar no haría nada.
  if (!prompt && !ios) return null;

  const onClick = prompt ? handleInstall : openIosHelp;

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
      variant={prompt ? 'filled' : 'light'}
    >
      {LABEL}
    </Button>
  );

  return (
    <>
      {trigger}
      <Modal opened={iosHelpOpened} onClose={closeIosHelp} title="Instalar Futcademic" centered>
        <Stack gap="md">
          <Text size="sm">En iPhone y iPad la instalación se hace desde Safari, en tres pasos:</Text>
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
            Si estás en Chrome o Firefox dentro del iPhone, ábrela antes en Safari: iOS solo permite
            instalar desde ahí.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
