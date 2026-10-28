'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Checkbox, CopyButton, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertCircle, IconBrandWhatsapp, IconCheck, IconCopy } from '@tabler/icons-react';
import {
  MOTIVOS_RECORDATORIO,
  construirRecordatorio,
  enlaceWhatsapp,
  motivosDisponibles,
  nombreTutor,
} from '../../../lib/students';
import type { Student } from '../../../types';

type Props = {
  opened: boolean;
  onClose: () => void;
  alumno: Student;
  academia?: string | null;
  deuda?: number;
};

/**
 * Prepara el mensaje para el tutor y abre WhatsApp con él. No envía nada desde
 * el servidor: el admin revisa el texto y lo manda desde su propio WhatsApp.
 */
export function TutorReminderModal({ opened, onClose, alumno, academia, deuda = 0 }: Props) {
  const disponibles = useMemo(() => motivosDisponibles(alumno, { deuda }), [alumno, deuda]);
  const [motivos, setMotivos] = useState(disponibles);
  const generado = useMemo(
    () =>
      construirRecordatorio({
        tutor: nombreTutor(alumno),
        alumno: alumno.full_name,
        academia,
        motivos,
        faltantes: alumno.expediente_missing,
        deuda,
      }),
    [alumno, academia, motivos, deuda],
  );
  const [mensaje, setMensaje] = useState(generado);
  // Si el admin ya editó el texto a mano, cambiar un motivo no lo pisa.
  const [editado, setEditado] = useState(false);

  useEffect(() => {
    if (opened) {
      setMotivos(disponibles);
      setEditado(false);
    }
  }, [opened, disponibles]);
  useEffect(() => {
    if (!editado) setMensaje(generado);
  }, [generado, editado]);

  const telefono = alumno.parent?.phone;
  const enlace = enlaceWhatsapp(telefono, mensaje);

  return (
    <Modal opened={opened} onClose={onClose} title="Recordar al tutor" centered size="lg">
      <Stack>
        {!telefono && (
          <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
            El tutor no tiene teléfono registrado. Copia el mensaje y mándalo por otro medio.
          </Alert>
        )}
        {telefono && !enlace && (
          <Alert color="orange" variant="light" icon={<IconAlertCircle size={16} />}>
            El teléfono del tutor ({telefono}) parece incompleto. Copia el mensaje o corrige el
            teléfono.
          </Alert>
        )}
        <Checkbox.Group
          label="Qué recordar"
          value={motivos}
          onChange={(v) => setMotivos(v as typeof motivos)}
        >
          <Stack gap={6} mt={6}>
            {disponibles.map((m) => (
              <Checkbox key={m} value={m} label={MOTIVOS_RECORDATORIO[m]} />
            ))}
          </Stack>
        </Checkbox.Group>
        <Textarea
          label="Mensaje"
          description="Puedes editarlo antes de enviarlo."
          autosize
          minRows={6}
          maxRows={14}
          value={mensaje}
          onChange={(e) => {
            setMensaje(e.currentTarget.value);
            setEditado(true);
          }}
        />
        <Text size="xs" c="dimmed">
          Se abre WhatsApp con el texto listo; nada se envía hasta que pulses enviar allá.
        </Text>
        <Group justify="flex-end">
          <CopyButton value={mensaje}>
            {({ copied, copy }) => (
              <Button
                variant="default"
                leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                onClick={copy}
                disabled={!mensaje.trim()}
              >
                {copied ? 'Copiado' : 'Copiar mensaje'}
              </Button>
            )}
          </CopyButton>
          <Button
            component="a"
            href={enlace || undefined}
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconBrandWhatsapp size={16} />}
            disabled={!enlace || !mensaje.trim()}
            data-disabled={!enlace || !mensaje.trim() || undefined}
            onClick={onClose}
          >
            Abrir WhatsApp
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
