'use client';

import { Card, Group, Skeleton, Text, ThemeIcon } from '@mantine/core';
import Link from 'next/link';
import { IconArrowUpRight } from '@tabler/icons-react';

type Props = {
  label: string;
  value: string | number;
  /** Lo que el número significa: "de 32 en la academia", "4 con adeudo". */
  hint?: string;
  icon: React.ReactNode;
  color: string;
  /** Si se indica, la tarjeta entera lleva a la pantalla donde se resuelve. */
  href?: string;
  cargando?: boolean;
};

/**
 * Indicador de Inicio. Un número suelto no dice nada: siempre va con la
 * referencia que lo hace legible y, cuando se puede, con el enlace a la
 * pantalla donde se actúa.
 */
export function MetricCard({ label, value, hint, icon, color, href, cargando }: Props) {
  const contenido = (
    <>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} lh={1.3}>
          {label}
        </Text>
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
      {cargando ? (
        <Skeleton height={28} width={90} mt="sm" />
      ) : (
        <Text fw={700} fz={28} lh={1.2} mt="xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Text>
      )}
      <Group gap={4} wrap="nowrap" mt={2}>
        <Text size="xs" c="dimmed" lh={1.3}>
          {hint || ' '}
        </Text>
        {href && !cargando && <IconArrowUpRight size={12} opacity={0.5} />}
      </Group>
    </>
  );

  if (!href) {
    return (
      <Card withBorder padding="md" radius="md" h="100%">
        {contenido}
      </Card>
    );
  }

  return (
    <Card
      component={Link}
      href={href}
      withBorder
      padding="md"
      radius="md"
      h="100%"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {contenido}
    </Card>
  );
}
