'use client';

import { Box } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCash,
  IconCoin,
  IconFileAlert,
  IconUserCheck,
  IconUsers,
  IconUserOff,
} from '@tabler/icons-react';
import { KpiCarousel } from '../../../components/common/KpiCarousel';
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

  /*
   * Carrusel con anclaje en vez de un `div` con `overflow-x: auto` y tarjetas
   * de 150 px: en 375 px se veían dos de siete, sin anclaje, sin puntos y sin
   * ninguna señal de que hubiera más. Desde `sm` vuelve a ser una rejilla.
   */
  return (
    <Box mb="md">
      <KpiCarousel
        aria-label="Resumen de alumnos. Cada tarjeta filtra la lista."
        // Son siete y hacen de filtros: con tarjetas al 78 % harían falta siete
        // deslizamientos. Al 46 % entran dos y se asoma la tercera.
        itemWidth="46%"
        loading={cargando}
        items={tarjetas.map((t) => ({
          key: t.clave,
          label: t.titulo,
          value: t.valor,
          footer: t.pie,
          icon: t.icono,
          color: t.color,
          active: t.activa,
          onSelect: () => onFiltro(t.filtro),
        }))}
      />
    </Box>
  );
}
