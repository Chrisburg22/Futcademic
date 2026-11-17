'use client';

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { TIPOS_SESION, type TipoSesion } from '../../lib/attendance';

export type SesionDelDia = {
  id: string;
  start_time?: string | null;
  type?: string | null;
  is_completed?: boolean | null;
  category?: { name?: string | null } | null;
  event?: { name?: string | null } | null;
  venue?: { name?: string | null } | null;
};

type Props = {
  categorias: { id: string; name: string }[];
  categoriaId: string | null;
  onCategoria: (id: string | null) => void;
  /** Siempre `YYYY-MM-DD`: es lo que viaja al backend y a la URL. */
  fecha: string;
  onFecha: (fecha: string) => void;
  tipo: TipoSesion;
  onTipo: (tipo: TipoSesion) => void;
  sesiones: SesionDelDia[];
  sesionId: string | null;
  onSesion: (id: string | null) => void;
  cargandoSesiones?: boolean;
};

const hora = (valor?: string | null) => (valor ? valor.slice(0, 5) : null);

export const etiquetaSesion = (sesion: SesionDelDia) =>
  [hora(sesion.start_time), sesion.event?.name || sesion.category?.name || 'Sesión']
    .filter(Boolean)
    .join(' · ');

/**
 * Contexto del pase de lista: a quién, qué día y en qué sesión.
 *
 * La sesión importa porque `POST /attendances` marca el `training` como
 * completado: elegirla es lo que conecta la lista con el calendario.
 */
export function AttendanceSessionBar({
  categorias,
  categoriaId,
  onCategoria,
  fecha,
  onFecha,
  tipo,
  onTipo,
  sesiones,
  sesionId,
  onSesion,
  cargandoSesiones = false,
}: Props) {
  const dia = dayjs(fecha);
  const esHoy = dia.isSame(dayjs(), 'day');
  const futura = dia.isAfter(dayjs(), 'day');
  const mover = (dias: number) => onFecha(dia.add(dias, 'day').format('YYYY-MM-DD'));

  const delTipo = sesiones.filter((s) => !s.type || s.type === tipo);
  const elegida = delTipo.find((s) => s.id === sesionId) || null;

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="sm">
        <Group align="flex-end" wrap="wrap" gap="sm">
          <Select
            style={{ flex: '1 1 220px' }}
            label="Categoría"
            placeholder="Elige la categoría"
            searchable
            nothingFoundMessage="Sin coincidencias"
            value={categoriaId}
            onChange={onCategoria}
            data={categorias.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Group gap={4} align="flex-end" wrap="nowrap">
            <Tooltip label="Día anterior">
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Día anterior"
                onClick={() => mover(-1)}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>
            </Tooltip>
            <DateInput
              w={190}
              label="Fecha"
              valueFormat="ddd DD MMM YYYY"
              value={dia.toDate()}
              maxDate={dayjs().add(1, 'year').toDate()}
              onChange={(valor) => {
                const siguiente = dayjs(valor as Date | string | null);
                if (siguiente.isValid()) onFecha(siguiente.format('YYYY-MM-DD'));
              }}
            />
            <Tooltip label="Día siguiente">
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Día siguiente"
                onClick={() => mover(1)}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              variant={esHoy ? 'filled' : 'default'}
              size="lg"
              aria-label="Ir a hoy"
              aria-pressed={esHoy}
              onClick={() => onFecha(dayjs().format('YYYY-MM-DD'))}
            >
              <IconCalendarEvent size={16} />
            </ActionIcon>
          </Group>

          <SegmentedControl
            aria-label="Tipo de sesión"
            value={tipo}
            onChange={(valor) => onTipo(valor as TipoSesion)}
            data={TIPOS_SESION.map((t) => ({ value: t.value, label: t.label }))}
          />

          {delTipo.length > 1 && (
            <Select
              style={{ flex: '1 1 200px' }}
              label="Sesión del día"
              value={sesionId}
              onChange={onSesion}
              allowDeselect={false}
              data={delTipo.map((s) => ({ value: s.id, label: etiquetaSesion(s) }))}
            />
          )}
        </Group>

        <Group gap="xs" wrap="wrap" role="status">
          {!esHoy && (
            <Badge variant="light" color={futura ? 'blue' : 'gray'}>
              {futura ? 'Fecha futura' : `Hace ${dayjs().diff(dia, 'day')} días`}
            </Badge>
          )}
          {categoriaId && cargandoSesiones && (
            <Text size="xs" c="dimmed">
              Buscando la sesión agendada…
            </Text>
          )}
          {categoriaId && !cargandoSesiones && delTipo.length === 0 && (
            <Text size="xs" c="dimmed">
              No hay {tipo === 'partido' ? 'partido' : 'entrenamiento'} agendado este día. Puedes
              pasar lista igual; no quedará ligada a una sesión del calendario.
            </Text>
          )}
          {elegida && (
            <>
              {hora(elegida.start_time) && (
                <Badge variant="light" color="gray" leftSection={<IconClock size={12} />}>
                  {hora(elegida.start_time)}
                </Badge>
              )}
              {elegida.venue?.name && (
                <Badge variant="light" color="gray" leftSection={<IconMapPin size={12} />}>
                  {elegida.venue.name}
                </Badge>
              )}
              {elegida.is_completed && (
                <Badge variant="light" color="green">
                  Sesión completada
                </Badge>
              )}
            </>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
