'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconCircleCheck,
  IconDeviceFloppy,
  IconHelpCircle,
  IconPercentage,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { nivelAsistencia, type ResumenPaseLista } from '../../lib/attendance';

/** Las cuatro cifras del pase de lista en curso. */
export function RollCallResumen({ resumen }: { resumen: ResumenPaseLista }) {
  const nivel = nivelAsistencia(resumen.porcentaje);
  const tarjetas = [
    {
      clave: 'presentes',
      titulo: 'Presentes',
      valor: resumen.presentes,
      color: 'green',
      icono: <IconCheck size={18} />,
    },
    {
      clave: 'ausentes',
      titulo: 'Ausentes',
      valor: resumen.ausentes,
      color: 'red',
      icono: <IconX size={18} />,
    },
    {
      clave: 'sin_marcar',
      titulo: 'Sin marcar',
      valor: resumen.sinMarcar,
      color: resumen.sinMarcar ? 'orange' : 'gray',
      icono: <IconHelpCircle size={18} />,
    },
    {
      clave: 'porcentaje',
      titulo: 'Asistencia',
      valor: `${resumen.porcentaje}%`,
      color: nivel.color,
      icono: <IconPercentage size={18} />,
    },
  ];

  return (
    // Dos por fila en móvil: ninguna cifra se queda a medias fuera de pantalla.
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
      {tarjetas.map((t) => (
        <Paper key={t.clave} withBorder radius="md" p="sm" style={{ minHeight: 64 }}>
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={34} radius="md" variant="light" color={t.color}>
              {t.icono}
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={700} size="xl" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t.valor}
              </Text>
              <Text size="xs" c="dimmed" lh={1.3}>
                {t.titulo}
              </Text>
            </div>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

type BarraProps = {
  resumen: ResumenPaseLista;
  /** Hay marcas sin guardar. */
  sucio: boolean;
  /** Ya existe un pase de lista guardado para esta fecha y tipo. */
  guardado: boolean;
  guardadoEn?: string | null;
  guardando: boolean;
  onGuardar: () => void;
  onDescartar: () => void;
};

/**
 * Barra de guardado, pegada al pie: en una lista de 30 alumnos el botón no
 * puede quedar tres pantallas más abajo.
 */
export function RollCallBarraGuardado({
  resumen,
  sucio,
  guardado,
  guardadoEn,
  guardando,
  onGuardar,
  onDescartar,
}: BarraProps) {
  const nivel = nivelAsistencia(resumen.porcentaje);
  const ayuda =
    resumen.total === 0
      ? 'No hay alumnos en esta categoría'
      : sucio
        ? 'Guarda el pase de lista'
        : 'No hay cambios por guardar';
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{
        position: 'sticky',
        // Encima del dock de accesos rápidos y de la barra de gestos.
        bottom: 'calc(var(--quick-dock-height, 0px) + env(safe-area-inset-bottom, 0px))',
        zIndex: 5,
        // El botón del chat flota en la esquina: el de guardar no puede quedar
        // debajo.
        paddingRight: 'calc(var(--mantine-spacing-sm) + 60px)',
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap">
          <Progress.Root size="xl" w={140} aria-hidden visibleFrom="sm">
            <Progress.Section value={(resumen.presentes / Math.max(resumen.total, 1)) * 100} color="green" />
            <Progress.Section value={(resumen.ausentes / Math.max(resumen.total, 1)) * 100} color="red" />
          </Progress.Root>
          <Text size="sm" role="status" aria-live="polite">
            <Text span fw={700} c={nivel.color}>
              {resumen.presentes}
            </Text>{' '}
            de {resumen.total} presentes
            {resumen.sinMarcar > 0 && (
              <Text span c="orange">
                {' '}
                · {resumen.sinMarcar} sin marcar
              </Text>
            )}
          </Text>
          {guardado && !sucio && (
            <Badge
              variant="light"
              color="green"
              leftSection={<IconCircleCheck size={12} />}
            >
              Guardado{guardadoEn ? ` · ${dayjs(guardadoEn).format('DD/MM HH:mm')}` : ''}
            </Badge>
          )}
          {sucio && (
            <Badge variant="light" color="orange">
              Cambios sin guardar
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          {sucio && (
            <Button variant="default" onClick={onDescartar} disabled={guardando}>
              Descartar
            </Button>
          )}
          {/* Un Tooltip solo admite un hijo: cada botón lleva el suyo. */}
          {([
            { clave: 'ancho', visibleFrom: 'sm' as const, etiqueta: 'Guardar pase de lista' },
            { clave: 'corto', hiddenFrom: 'sm' as const, etiqueta: 'Guardar' },
          ]).map((b) => (
            <Tooltip key={b.clave} label={ayuda}>
              <Button
                visibleFrom={b.visibleFrom}
                hiddenFrom={b.hiddenFrom}
                aria-label="Guardar pase de lista"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={guardando}
                disabled={!sucio || resumen.total === 0}
                onClick={onGuardar}
              >
                {b.etiqueta}
              </Button>
            </Tooltip>
          ))}
        </Group>
      </Group>
    </Paper>
  );
}
