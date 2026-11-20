'use client';

import { useEffect, useRef } from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCloudUpload } from '@tabler/icons-react';
import { useMutationState } from '@tanstack/react-query';

/** Cuántas escrituras esperan a que vuelva la conexión. */
export function usePendingOfflineCount() {
  const paused = useMutationState({
    filters: { predicate: (mutation) => mutation.state.isPaused },
  });
  return paused.length;
}

/**
 * Aviso de escrituras en cola, en la cabecera.
 *
 * Es lo único que distingue "guardado" de "guardado en este teléfono": sin este
 * contador, quien pasa lista sin señal no tiene forma de saber que el dato
 * todavía no salió del dispositivo.
 */
export function OfflineQueueBadge() {
  const pending = usePendingOfflineCount();
  const previous = useRef(pending);

  useEffect(() => {
    // De tener pendientes a cero: la cola se vació de verdad (si hubiera
    // fallado, la mutación seguiría pausada o en error).
    if (previous.current > 0 && pending === 0) {
      notifications.show({
        color: 'teal',
        title: 'Cambios enviados',
        message:
          previous.current === 1
            ? 'Se envió el cambio que estaba guardado sin conexión.'
            : `Se enviaron ${previous.current} cambios guardados sin conexión.`,
      });
    }
    previous.current = pending;
  }, [pending]);

  if (pending === 0) return null;

  return (
    <Tooltip
      label="Guardado en este dispositivo. Se enviará solo al volver la conexión."
      multiline
      w={240}
    >
      <Badge color="orange" variant="light" leftSection={<IconCloudUpload size={14} />}>
        {pending === 1 ? '1 por enviar' : `${pending} por enviar`}
      </Badge>
    </Tooltip>
  );
}
