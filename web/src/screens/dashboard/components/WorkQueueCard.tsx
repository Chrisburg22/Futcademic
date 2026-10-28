'use client';

import { Button, Card, Group, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import Link from 'next/link';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCoin,
  IconFileAlert,
  IconPhonePlus,
  IconShirt,
  IconUserOff,
} from '@tabler/icons-react';
import { enlaceAlListado, type FiltrosAlumnos, type ResumenAlumnos } from '../../../lib/students';

type Tarea = {
  clave: string;
  cuantos: number;
  titulo: string;
  ayuda: string;
  color: string;
  icono: React.ReactNode;
  filtro: Partial<FiltrosAlumnos>;
  urgente: boolean;
};

/**
 * La bandeja de trabajo de Inicio: no "cuántos alumnos hay" sino "qué falta
 * por hacer", cada línea con el enlace al listado ya filtrado.
 */
export function WorkQueueCard({
  resumen,
  verCobranza,
}: {
  resumen: ResumenAlumnos;
  /** Sin la cobranza cargada no se puede hablar de adeudos. */
  verCobranza: boolean;
}) {
  const todas: Tarea[] = [
    {
      clave: 'tutor',
      cuantos: resumen.sinTutor,
      titulo: 'sin tutor asignado',
      ayuda: 'Nadie puede ver su información ni recibir avisos.',
      color: 'red',
      icono: <IconUserOff size={18} />,
      filtro: { tutor: 'sin' },
      urgente: true,
    },
    {
      clave: 'adeudo',
      cuantos: verCobranza ? resumen.conAdeudo : 0,
      titulo: 'con adeudo este mes',
      ayuda: resumen.adeudoTotal
        ? `$${resumen.adeudoTotal.toLocaleString('es-MX')} por cobrar.`
        : 'Mensualidad sin pagar.',
      color: 'orange',
      icono: <IconCoin size={18} />,
      filtro: { adeudo: 'con' },
      urgente: true,
    },
    {
      clave: 'expediente',
      cuantos: resumen.expedienteIncompleto,
      titulo: 'con expediente incompleto',
      ayuda: 'Faltan documentos o el consentimiento firmado.',
      color: 'yellow',
      icono: <IconFileAlert size={18} />,
      filtro: { expediente: 'incompleto' },
      urgente: true,
    },
    {
      clave: 'emergencia',
      cuantos: resumen.sinEmergencia,
      titulo: 'sin contacto de emergencia',
      ayuda: 'A quién llamar si pasa algo en el entrenamiento.',
      color: 'grape',
      icono: <IconPhonePlus size={18} />,
      filtro: { emergencia: 'sin' },
      urgente: false,
    },
    {
      clave: 'uniforme',
      cuantos: resumen.sinUniforme,
      titulo: 'sin uniforme entregado',
      ayuda: 'Pendiente de entrega.',
      color: 'blue',
      icono: <IconShirt size={18} />,
      filtro: { uniforme: 'pendiente' },
      urgente: false,
    },
  ];
  const tareas = todas.filter((t) => t.cuantos > 0);

  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="xs">
          <IconAlertTriangle size={18} />
          <Text fw={600}>Por atender</Text>
        </Group>
        {tareas.length > 0 && (
          <Button
            component={Link}
            href={enlaceAlListado({ atencion: 'si' })}
            variant="subtle"
            size="compact-sm"
          >
            Ver todo
          </Button>
        )}
      </Group>

      {tareas.length === 0 ? (
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={36} radius="md" variant="light" color="green">
            <IconCircleCheck size={20} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={500}>
              Nada pendiente
            </Text>
            <Text size="xs" c="dimmed">
              Expedientes, tutores y uniformes al día.
            </Text>
          </div>
        </Group>
      ) : (
        <Stack gap="xs">
          {tareas.map((t) => (
            <UnstyledButton
              key={t.clave}
              component={Link}
              href={enlaceAlListado(t.filtro)}
              aria-label={`${t.cuantos} ${t.cuantos === 1 ? 'alumno' : 'alumnos'} ${t.titulo}. Ver la lista`}
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
                padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
                minHeight: 56,
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon size={34} radius="md" variant="light" color={t.color}>
                  {t.icono}
                </ThemeIcon>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text size="sm" lh={1.3}>
                    <Text span fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {t.cuantos}
                    </Text>{' '}
                    {t.cuantos === 1 ? 'alumno' : 'alumnos'} {t.titulo}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.3} truncate>
                    {t.ayuda}
                  </Text>
                </div>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
    </Card>
  );
}
