'use client';

import {
  Alert,
  Anchor,
  Badge,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconMoodEmpty, IconPlayerPause } from '@tabler/icons-react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useOverview, type EscuelaFila } from '../../hooks/usePlatform';

const Metrica = ({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
}) => (
  <Paper withBorder p="md" radius="md">
    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
      {etiqueta}
    </Text>
    <Text fz={28} fw={700} lh={1.2}>
      {valor}
    </Text>
    {detalle && (
      <Text size="xs" c="dimmed">
        {detalle}
      </Text>
    )}
  </Paper>
);

const pesos = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function ListaAtencion({
  titulo,
  explicacion,
  escuelas,
  icono,
  color,
}: {
  titulo: string;
  explicacion: string;
  escuelas: EscuelaFila[];
  icono: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="xs" mb={4}>
        {icono}
        <Text fw={600}>{titulo}</Text>
        <Badge variant="light" color={color}>
          {escuelas.length}
        </Badge>
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {explicacion}
      </Text>
      {escuelas.length === 0 ? (
        <Text size="sm" c="dimmed">
          Ninguna.
        </Text>
      ) : (
        <Stack gap={6}>
          {escuelas.slice(0, 6).map((e) => (
            <Group key={e.id} justify="space-between" wrap="nowrap">
              <Anchor component={Link} href={`/platform/schools/${e.id}`} size="sm" truncate>
                {e.name}
              </Anchor>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {e.dias_sin_actividad === null
                  ? 'sin actividad'
                  : `${e.dias_sin_actividad} d`}
              </Text>
            </Group>
          ))}
          {escuelas.length > 6 && (
            <Text size="xs" c="dimmed">
              y {escuelas.length - 6} más
            </Text>
          )}
        </Stack>
      )}
    </Card>
  );
}

export function PlatformOverviewPage() {
  const { data, isLoading, error } = useOverview();

  if (isLoading) return <Loader />;
  if (error || !data) {
    return (
      <Alert color="red" title="No se pudo cargar el resumen">
        Vuelve a intentarlo. Si sigue fallando, revisa que la migración de la consola esté aplicada.
      </Alert>
    );
  }

  const { schools, usage, activity, atencion } = data;
  const roles = Object.entries(usage.por_rol)
    .filter(([rol]) => rol !== 'plataforma')
    .sort((a, b) => b[1] - a[1]);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Resumen</Title>
        <Text size="sm" c="dimmed">
          Datos al {dayjs(data.generado_en).format('DD/MM/YYYY HH:mm')}.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
        <Metrica
          etiqueta="Academias activas"
          valor={schools.activas}
          detalle={`${schools.total} en total`}
        />
        <Metrica
          etiqueta="Nuevas (30 d)"
          valor={schools.nuevas_30d}
          detalle={schools.suspendidas ? `${schools.suspendidas} suspendidas` : 'ninguna suspendida'}
        />
        <Metrica
          etiqueta="Alumnos"
          valor={usage.alumnos}
          detalle={`${usage.alumnos_activos} activos`}
        />
        <Metrica etiqueta="Usuarios" valor={usage.usuarios} detalle={`${usage.categorias} categorías`} />
        <Metrica
          etiqueta="Marcas (7 d)"
          valor={activity.asistencias_7d}
          detalle="asistencias registradas"
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="md">
              <Text fw={600} mb={4}>
                Necesita atención
              </Text>
              <Text size="xs" c="dimmed" mb="sm">
                La actividad de una academia es lo más reciente entre su última marca de asistencia,
                su último pago registrado y su última alta de alumno.
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <ListaAtencion
                  titulo="Sin actividad"
                  explicacion="Con alumnos, pero 14 días o más sin registrar nada."
                  escuelas={atencion.sin_actividad_14d}
                  icono={<IconAlertTriangle size={18} color="var(--mantine-color-orange-6)" />}
                  color="orange"
                />
                <ListaAtencion
                  titulo="Sin alumnos"
                  explicacion="Se registraron y nunca dieron de alta a nadie."
                  escuelas={atencion.sin_alumnos}
                  icono={<IconMoodEmpty size={18} color="var(--mantine-color-gray-6)" />}
                  color="gray"
                />
                <ListaAtencion
                  titulo="Suspendidas"
                  explicacion="Su gente no puede entrar a la app."
                  escuelas={atencion.suspendidas}
                  icono={<IconPlayerPause size={18} color="var(--mantine-color-red-6)" />}
                  color="red"
                />
              </SimpleGrid>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Card withBorder radius="md" padding="md">
              <Text fw={600} mb="xs">
                Cobranza del mes
              </Text>
              <Text fz={24} fw={700}>
                {pesos(activity.monto_registrado_mes)}
              </Text>
              <Text size="xs" c="dimmed">
                {activity.pagos_registrados_mes} mensualidades que las academias registraron este
                mes. Es su cobranza, no ingreso de la plataforma.
              </Text>
            </Card>

            <Card withBorder radius="md" padding="md">
              <Text fw={600} mb="xs">
                Usuarios por rol
              </Text>
              <Table withRowBorders={false} verticalSpacing={4}>
                <Table.Tbody>
                  {roles.map(([rol, total]) => (
                    <Table.Tr key={rol}>
                      <Table.Td>
                        <Text size="sm" tt="capitalize">
                          {rol.replace('_', ' ')}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" fw={600}>
                          {total}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
