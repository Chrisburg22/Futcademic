'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Group, Modal, Slider, Stack, Text } from '@mantine/core';
import { IconZoomIn } from '@tabler/icons-react';
import Cropper from 'react-easy-crop';
import { AreaRecorte, recortarImagen } from '../../lib/images';

interface ImageCropModalProps {
  /** Archivo elegido por el usuario; `null` cierra el modal. */
  file: File | null;
  /** Ancho/alto del recorte. 1 = cuadrado (avatares). */
  aspect?: number;
  /** Lado del JPEG resultante en px. */
  outputSize?: number;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}

export function ImageCropModal({
  file,
  aspect = 1,
  outputSize,
  title = 'Ajustar foto',
  loading = false,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<AreaRecorte | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `createObjectURL` hay que revocarlo o la foto se queda en memoria.
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: unknown, pixels: AreaRecorte) => {
    setArea(pixels);
  }, []);

  const confirmar = async () => {
    if (!src || !area) return;
    try {
      const ancho = outputSize;
      const alto = outputSize && aspect ? Math.round(outputSize / aspect) : undefined;
      const recortada = await recortarImagen(src, area, {
        ancho,
        alto,
        nombre: file?.name?.replace(/\.[^.]+$/, '') + '.jpg',
      });
      await onConfirm(recortada);
    } catch (err: any) {
      setError(err?.message || 'No se pudo procesar la imagen.');
    }
  };

  return (
    <Modal opened={!!file} onClose={onCancel} title={title} centered size="md">
      <Stack>
        <Box
          pos="relative"
          h={320}
          style={{ background: 'var(--mantine-color-dark-7)', borderRadius: 8, overflow: 'hidden' }}
        >
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={aspect === 1 ? 'round' : 'rect'}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>

        <Group gap="sm" wrap="nowrap">
          <IconZoomIn size={18} />
          <Slider
            flex={1}
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={setZoom}
            label={(v) => `${v.toFixed(1)}x`}
            aria-label="Zoom"
          />
        </Group>

        <Text size="xs" c="dimmed">
          Arrastra para encuadrar y usa el zoom. Se guarda como JPG.
        </Text>

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={confirmar} loading={loading} disabled={!area}>
            Guardar foto
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
