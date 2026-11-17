'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  FileButton,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCamera, IconTrash } from '@tabler/icons-react';
import { iniciales } from '../../lib/students';
import { MAX_BYTES_ORIGEN, TAMANO_SALIDA, TIPOS_IMAGEN_ACEPTADOS } from '../../lib/images';
import { ImageCropModal } from './ImageCropModal';

interface PhotoUploaderProps {
  /** URL actual, si ya hay foto. */
  src?: string | null;
  /** Nombre para las iniciales y el color del avatar. */
  name?: string | null;
  /** `avatar` = círculo con iniciales; `image` = rectángulo (logos). */
  variant?: 'avatar' | 'image';
  size?: number;
  aspect?: number;
  outputSize?: number;
  label?: string;
  hint?: string;
  canEdit?: boolean;
  loading?: boolean;
  onUpload: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}

/**
 * Único punto de subida de fotos de la app: elegir archivo → recortar → subir.
 * Se usa para alumnos, profesores, el propio perfil, el logo de la academia y
 * el escudo de las categorías.
 */
export function PhotoUploader({
  src,
  name,
  variant = 'avatar',
  size = 96,
  aspect = 1,
  outputSize = TAMANO_SALIDA,
  label = 'Subir foto',
  hint = 'JPG, PNG o WEBP — máx 5 MB',
  canEdit = true,
  loading = false,
  onUpload,
  onRemove,
}: PhotoUploaderProps) {
  const [elegida, setElegida] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [quitando, setQuitando] = useState(false);

  const elegir = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_BYTES_ORIGEN) {
      notifications.show({ color: 'red', message: 'La imagen es demasiado grande (máx 15 MB).' });
      return;
    }
    setElegida(file);
  };

  const confirmar = async (file: File) => {
    setSubiendo(true);
    try {
      await onUpload(file);
      setElegida(null);
    } finally {
      setSubiendo(false);
    }
  };

  const quitar = async () => {
    if (!onRemove) return;
    setQuitando(true);
    try {
      await onRemove();
    } finally {
      setQuitando(false);
    }
  };

  const ocupado = loading || subiendo || quitando;

  const vista =
    variant === 'avatar' ? (
      <Avatar
        src={src || undefined}
        name={name || undefined}
        color="initials"
        size={size}
        radius="xl"
      >
        {iniciales(name)}
      </Avatar>
    ) : src ? (
      <Image src={src} h={size} w="auto" fit="contain" alt={name || 'Imagen'} />
    ) : (
      <Box
        h={size}
        w={size * (aspect || 1)}
        style={{
          border: '1px dashed var(--mantine-color-gray-4)',
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Text size="xs" c="dimmed">
          Sin imagen
        </Text>
      </Box>
    );

  return (
    <>
      <Group gap="sm" align="center">
        <Box pos="relative" w="fit-content">
          {vista}
          {canEdit && (
            <FileButton onChange={elegir} accept={TIPOS_IMAGEN_ACEPTADOS}>
              {(props) => (
                <Tooltip label={label}>
                  <ActionIcon
                    {...props}
                    variant="filled"
                    radius="xl"
                    size={36}
                    aria-label={label}
                    loading={ocupado}
                    pos="absolute"
                    bottom={-4}
                    right={-4}
                  >
                    <IconCamera size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </FileButton>
          )}
        </Box>

        {canEdit && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
            {src && onRemove && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                loading={quitando}
                onClick={quitar}
                w="fit-content"
              >
                Quitar foto
              </Button>
            )}
          </Stack>
        )}
      </Group>

      <ImageCropModal
        file={elegida}
        aspect={aspect}
        outputSize={outputSize}
        loading={subiendo}
        onCancel={() => setElegida(null)}
        onConfirm={confirmar}
      />
    </>
  );
}
