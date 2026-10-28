'use client';

import { Skeleton, Text, ThemeIcon, UnstyledButton, Group } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCash,
  IconCoin,
  IconFileAlert,
  IconUserCheck,
  IconUsers,
  IconUserOff,
} from '@tabler/icons-react';
import type { FiltrosAlumnos, ResumenAlumnos } from '../../../lib/students';

type Tarjeta = {
  clave: string;
  titulo: string;
  valor: number;
  color: string;
  icono: React.ReactNode;
  /** Filtro que aplica al pulsarla; `null` = quitar filtros. */
  filtro: Partial<FiltrosAlumnos> | null;
  activa: boolean;
  /** Dato de apoyo bajo el título (por ejemplo, el monto por cobrar). */
  pie?: string;
  ocultar?: boolean;
};

type Props = {
  resumen: ResumenAlumnos;
  filtros: FiltrosAlumnos;
  cargando: boolean;
  onFiltro: (cambios: Partial<FiltrosAlumnos> | null) => void;
  /** Los profesores no ven ni cambian el estado de cobro. */
  verEstados: boolean;
  /** El adeudo del mes solo se conoce si ya llegó `/payments/pending`. */
  verAdeudo?: boolean;
};

export function StudentsSummary({
  resumen,
  filtros,
  cargando,
  onFiltro,
  verEstados,
  verAdeudo = false,
}: Props) {
  const soloEstado = (estado: FiltrosAlumnos['estado']) =>
    filtros.estado === estado && !filtros.expediente && !filtros.tutor && !filtros.categoria;

  const todas: Tarjeta[] = [
    {
      clave: 'todos',
      titulo: 'Alumnos',
      valor: resumen.total,
      color: 'blue',
      icono: <IconUsers size={20} />,
      filtro: null,
      activa:
        !filtros.estado &&
        !filtros.expediente &&
        !filtros.tutor &&
        !filtros.uniforme &&
        !filtros.adeudo,
    },
    {
      clave: 'activos',
      titulo: 'Activos',
      valor: resumen.activos,
      color: 'green',
      icono: <IconUserCheck size={20} />,
      filtro: { estado: 'activo' },
      activa: soloEstado('activo'),
      ocultar: !verEstados,
    },
    {
      clave: 'pago',
      titulo: 'Pendientes de pago',
      valor: resumen.pendientePago,
      color: 'orange',
      icono: <IconCash size={20} />,
      filtro: { estado: 'pendiente_pago' },
      activa: soloEstado('pendiente_pago'),
      ocultar: !verEstados,
    },
    {
      clave: 'adeudo',
      titulo: 'Con adeudo',
      valor: resumen.conAdeudo,
      color: 'red',
      icono: <IconCoin size={20} />,
      filtro: { adeudo: 'con' },
      activa: filtros.adeudo === 'con',
      pie: resumen.adeudoTotal > 0 ? `$${resumen.adeudoTotal.toLocaleString('es-MX')} por cobrar` : undefined,
      ocultar: !verAdeudo,
    },
    {
      clave: 'expediente',
      titulo: 'Expediente incompleto',
      valor: resumen.expedienteIncompleto,
      color: 'yellow',
      icono: <IconFileAlert size={20} />,
      filtro: { expediente: 'incompleto' },
      activa: filtros.expediente === 'incompleto',
    },
    {
      clave: 'tutor',
      titulo: 'Sin tutor',
      valor: resumen.sinTutor,
      color: 'red',
      icono: <IconAlertTriangle size={20} />,
      filtro: { tutor: 'sin' },
      activa: filtros.tutor === 'sin',
    },
    {
      clave: 'inactivos',
      titulo: 'Inactivos',
      valor: resumen.inactivos,
      color: 'gray',
      icono: <IconUserOff size={20} />,
      filtro: { estado: 'inactivo' },
      activa: soloEstado('inactivo'),
      ocultar: !verEstados,
    },
  ];
  const tarjetas = todas.filter((t) => !t.ocultar);

  return (
    <div
      // En pantallas chicas las tarjetas se deslizan en una sola fila.
      style={{
        display: 'flex',
        gap: 'var(--mantine-spacing-sm)',
        overflowX: 'auto',
        marginBottom: 'var(--mantine-spacing-md)',
        paddingBottom: 4,
      }}
    >
      {tarjetas.map((t) => (
        <UnstyledButton
          key={t.clave}
          onClick={() => onFiltro(t.filtro)}
          aria-pressed={t.activa}
          aria-label={`${t.titulo}: ${t.valor}. ${t.filtro ? 'Filtrar la lista' : 'Quitar filtros'}`}
          style={{
            border: `1px solid var(--mantine-color-${t.activa ? t.color : 'default-border'}${t.activa ? '-6' : ''})`,
            borderRadius: 'var(--mantine-radius-md)',
            padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
            background: t.activa
              ? `var(--mantine-color-${t.color}-light)`
              : 'var(--mantine-color-body)',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
            minHeight: 64,
            flex: '1 0 150px',
            textAlign: 'left',
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={36} radius="md" variant="light" color={t.color}>
              {t.icono}
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              {cargando ? (
                <Skeleton height={22} width={36} mb={4} />
              ) : (
                <Text fw={700} size="xl" lh={1.1} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {t.valor}
                </Text>
              )}
              <Text size="xs" c="dimmed" lh={1.3}>
                {t.titulo}
              </Text>
              {t.pie && (
                <Text size="xs" c="dimmed" lh={1.3} truncate>
                  {t.pie}
                </Text>
              )}
            </div>
          </Group>
        </UnstyledButton>
      ))}
    </div>
  );
}
