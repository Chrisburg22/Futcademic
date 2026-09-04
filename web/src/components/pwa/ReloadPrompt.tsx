import { useEffect } from 'react';
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_ID = 'pwa-update';

/**
 * Registra el service worker y avisa cuando hay una versión nueva.
 * Usamos registerType 'prompt': nunca recargamos solos, para no tirar un
 * formulario a medio rellenar.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    notifications.show({
      color: 'teal',
      title: 'Listo para usar sin conexión',
      message: 'Futcademic ya funciona aunque te quedes sin internet.',
      autoClose: 4000,
    });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    notifications.show({
      id: UPDATE_ID,
      color: 'futcamedic',
      title: 'Nueva versión disponible',
      message: (
        <Button
          size="compact-sm"
          mt="xs"
          onClick={() => {
            notifications.hide(UPDATE_ID);
            updateServiceWorker(true);
          }}
        >
          Actualizar
        </Button>
      ),
      autoClose: false,
      withCloseButton: true,
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
