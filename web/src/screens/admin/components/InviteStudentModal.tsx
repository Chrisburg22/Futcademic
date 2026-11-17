'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CopyButton,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconLink,
  IconSend,
} from '@tabler/icons-react';
import { BottomSheet } from '../../../components/common/BottomSheet';
import dayjs from 'dayjs';
import { useCreateEnrollmentInvitation } from '../../../hooks/useEnrollment';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  opened: boolean;
  onClose: () => void;
  categories: any[];
  defaultCategoryId?: string | null;
};

/**
 * Genera un link de inscripción de un solo uso para que el tutor capture todo
 * desde su teléfono. El link solo conoce la categoría; el alumno no existe
 * hasta que el admin aprueba la solicitud.
 */
export function InviteStudentModal({
  opened,
  onClose,
  categories,
  defaultCategoryId,
}: Props) {
  const create = useCreateEnrollmentInvitation();
  const { profile } = useAuth();
  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId || null);
  const [days, setDays] = useState<number | string>(7);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<any>(null);

  const reset = () => {
    setResult(null);
    setNote('');
    setDays(7);
    setCategoryId(defaultCategoryId || null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!categoryId) {
      notifications.show({ color: 'red', message: 'Selecciona una categoría.' });
      return;
    }
    try {
      const data = await create.mutateAsync({
        category_id: categoryId,
        expires_in_days: Number(days) || 7,
        note: note.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo crear el link.',
      });
    }
  };

  const shareText = result
    ? `Hola, te comparto el link para inscribir a tu hijo(a) en ${
        profile?.school?.name || 'la academia'
      } (categoría ${result.category?.name || ''}): ${result.url}`
    : '';

  return (
    <BottomSheet
      opened={opened}
      onClose={handleClose}
      title={result ? 'Link de inscripción' : 'Invitar alumno'}
      size="auto"
    >
      {result ? (
        <Stack gap="md">
          <Alert
            color="green"
            variant="light"
            icon={
              <ThemeIcon color="green" variant="light" radius="xl">
                <IconCheck size={16} />
              </ThemeIcon>
            }
            title="Link creado"
          >
            Compártelo con el tutor. Solo funciona una vez y vence el{' '}
            {dayjs(result.expires_at).format('DD/MM/YYYY [a las] HH:mm')}.
          </Alert>

          <Card withBorder radius="md" padding="sm">
            <Text size="xs" c="dimmed" mb={4}>
              Link para {result.category?.name}
            </Text>
            <Text size="sm" style={{ wordBreak: 'break-all' }}>
              {result.url}
            </Text>
          </Card>

          <Group grow>
            <CopyButton value={result.url}>
              {({ copied, copy }) => (
                <Button
                  variant={copied ? 'light' : 'default'}
                  color={copied ? 'green' : undefined}
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  onClick={copy}
                >
                  {copied ? 'Copiado' : 'Copiar link'}
                </Button>
              )}
            </CopyButton>
            <Button
              component="a"
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              leftSection={<IconBrandWhatsapp size={16} />}
              variant="light"
              color="green"
            >
              WhatsApp
            </Button>
          </Group>

          <Alert variant="light" color="yellow">
            Por seguridad no guardamos el link en claro: si lo pierdes, genera uno
            nuevo y revoca el anterior.
          </Alert>

          <Group justify="space-between">
            <Button variant="subtle" onClick={reset} leftSection={<IconLink size={16} />}>
              Crear otro
            </Button>
            <Button onClick={handleClose}>Listo</Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            El tutor llenará los datos del alumno, su propia información, el
            consentimiento y la identificación desde su celular. Al enviar, la
            solicitud queda pendiente de tu aprobación.
          </Text>

          <Select
            label="Categoría"
            placeholder="Selecciona la categoría"
            required
            data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
            searchable
          />
          <NumberInput
            label="Vigencia (días)"
            min={1}
            max={30}
            value={days}
            onChange={setDays}
          />
          <TextInput
            label="Nota interna"
            placeholder="Ej. papá de Diego, inscripción de prueba"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              loading={create.isPending}
              leftSection={<IconSend size={16} />}
            >
              Generar link
            </Button>
          </Group>
        </Stack>
      )}
    </BottomSheet>
  );
}
