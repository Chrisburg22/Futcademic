'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ETIQUETA_ACCION,
  useEditarEscuela,
  useEscuela,
  useReactivarEscuela,
  useSuspenderEscuela,
} from '../../hooks/usePlatform';
import { COLOR_ESTADO, Inactividad } from './PlatformSchoolsPage';

const pesos = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const Dato = ({ etiqueta, valor }: { etiqueta: string; valor: string | number }) => (
  <div>
    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
      {etiqueta}
    </Text>
    <Text fz={22} fw={700} lh={1.3}>
      {valor}
    </Text>
  </div>
);

export function PlatformSchoolDetailPage({ schoolId }: { schoolId: string }) {
  const { data: escuela, isLoading } = useEscuela(schoolId);
  const editar = useEditarEscuela();
  const suspender = useSuspenderEscuela();
  const reactivar = useReactivarEscuela();

  const [modal, { open, close }] = useDisclosure(false);
  const [motivo, setMotivo] = useState('');
  const [datos, setDatos] = useState({
    name: '',
    razon_social: '',
    direccion: '',
    contacto_email: '',
    internal_notes: '',
  });

  useEffect(() => {
    if (!escuela) return;
    setDatos({
      name: escuela.name || '',
      razon_social: escuela.razon_social || '',
      direccion: escuela.direccion || '',
      contacto_email: escuela.contacto_email || '',
      internal_notes: escuela.internal_notes || '',
    });
  }, [escuela]);

  if (isLoading) return <Loader />;
  if (!escuela) {
    return <Alert color="red">No se encontró la academia.</Alert>;
  }

  const guardar = () => {
    if (!datos.name.trim()) {
      notifications.show({ color: 'red', message: 'La academia necesita un nombre.' });
      return;
    }
    editar.mutate(
      { id: schoolId, ...datos },
      {
        onSuccess: () => notifications.show({ color: 'green', message: 'Datos guardados.' }),
        onError: (err: any) =>
          notifications.show({
            color: 'red',
            message: err?.response?.data?.error || 'No se pudo guardar.',
          }),
      },
    );
  };

  const confirmarSuspension = () => {
    suspender.mutate(
      { id: schoolId, reason: motivo },
      {
        onSuccess: () => {
          notifications.show({ color: 'orange', message: 'Academia suspendida.' });
          setMotivo('');
          close();
        },
        onError: (err: any) =>
          notifications.show({
            color: 'red',
            message: err?.response?.data?.error || 'No se pudo suspender.',
          }),
      },
    );
  };

  const marcasPorAlumno = escuela.students
    ? (escuela.marcas_total / escuela.students).toFixed(1)
    : '0';

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Button
            component={Link}
            href="/platform/schools"
            variant="subtle"
            size="compact-sm"
            leftSection={<IconArrowLeft size={14} />}
            mb={6}
          >
            Academias
          </Button>
          <Group gap="sm">
            <Title order={2}>{escuela.name}</Title>
            <Badge variant="light" color={COLOR_ESTADO[escuela.status]}>
              {escuela.status}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Creada el {escuela.created_at ? dayjs(escuela.created_at).format('DD/MM/YYYY') : '—'} ·
            última actividad{' '}
            {escuela.last_activity_at
              ? dayjs(escuela.last_activity_at).format('DD/MM/YYYY')
              : 'nunca'}
          </Text>
        </div>

        {escuela.status === 'activa' ? (
          <Button
            color="red"
            variant="light"
            leftSection={<IconPlayerPause size={16} />}
            onClick={open}
          >
            Suspender
          </Button>
        ) : (
          <Button
            color="green"
            variant="light"
            leftSection={<IconPlayerPlay size={16} />}
            loading={reactivar.isPending}
            onClick={() =>
              reactivar.mutate(
                { id: schoolId },
                {
                  onSuccess: () =>
                    notifications.show({ color: 'green', message: 'Academia reactivada.' }),
                },
              )
            }
          >
            Reactivar
          </Button>
        )}
      </Group>

      {escuela.status === 'suspendida' && (
        <Alert color="red" title="Academia suspendida">
          {escuela.suspended_reason || 'Sin motivo registrado.'}
          {escuela.suspended_at && (
            <Text size="xs" c="dimmed" mt={4}>
              Desde el {dayjs(escuela.suspended_at).format('DD/MM/YYYY HH:mm')}. Su gente no puede
              entrar a la app.
            </Text>
          )}
        </Alert>
      )}

      <Tabs defaultValue="resumen">
        <Tabs.List>
          <Tabs.Tab value="resumen">Resumen</Tabs.Tab>
          <Tabs.Tab value="personas">Personas</Tabs.Tab>
          <Tabs.Tab value="actividad">Actividad</Tabs.Tab>
          <Tabs.Tab value="datos">Datos</Tabs.Tab>
          <Tabs.Tab value="bitacora">Bitácora</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Alumnos" valor={escuela.students} />
              <Text size="xs" c="dimmed">
                {escuela.students_activos} activos
              </Text>
            </Card>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Usuarios" valor={escuela.users} />
            </Card>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Categorías" valor={escuela.categories} />
            </Card>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Sedes" valor={escuela.venues} />
            </Card>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Marcas" valor={escuela.marcas_total} />
              <Text size="xs" c="dimmed">
                {marcasPorAlumno} por alumno
              </Text>
            </Card>
            <Card withBorder radius="md" padding="md">
              <Dato etiqueta="Cobrado" valor={pesos(escuela.monto_total)} />
              <Text size="xs" c="dimmed">
                {escuela.pagos_total} pagos registrados
              </Text>
            </Card>
          </SimpleGrid>

          <Card withBorder radius="md" padding="md" mt="md">
            <Text fw={600} mb={4}>
              ¿Está usando la app?
            </Text>
            <Text size="sm" c="dimmed">
              {escuela.marcas_total === 0
                ? 'No ha registrado ni una asistencia. Dio de alta la academia y se detuvo ahí.'
                : Number(marcasPorAlumno) < 2
                  ? 'Menos de dos marcas por alumno: el pase de lista no es parte de su rutina todavía.'
                  : 'Pasa lista con regularidad.'}
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="personas" pt="md">
          <Card withBorder radius="md" padding="md">
            <Table withRowBorders={false}>
              <Table.Tbody>
                {Object.entries(escuela.por_rol).map(([rol, total]) => (
                  <Table.Tr key={rol}>
                    <Table.Td>
                      <Text tt="capitalize">{rol.replace('_', ' ')}</Text>
                    </Table.Td>
                    <Table.Td ta="right" fw={600}>
                      {total}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Button
              component={Link}
              href={`/platform/users?school_id=${schoolId}`}
              variant="light"
              mt="md"
            >
              Ver personas de esta academia
            </Button>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="actividad" pt="md">
          <Card withBorder radius="md" padding="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Últimos 90 días</Text>
              <Inactividad escuela={escuela} />
            </Group>
            {escuela.actividad.length === 0 ? (
              <Text size="sm" c="dimmed">
                Sin movimientos en los últimos 90 días.
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={320}>
                <Table verticalSpacing={4}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Día</Table.Th>
                      <Table.Th ta="right">Marcas</Table.Th>
                      <Table.Th ta="right">Altas</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {[...escuela.actividad].reverse().map((d) => (
                      <Table.Tr key={d.fecha}>
                        <Table.Td>{dayjs(d.fecha).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td ta="right">{d.marcas || '—'}</Table.Td>
                        <Table.Td ta="right">{d.altas || '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="datos" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <TextInput
                    label="Nombre"
                    required
                    value={datos.name}
                    onChange={(e) => setDatos({ ...datos, name: e.currentTarget.value })}
                  />
                  <TextInput
                    label="Razón social"
                    value={datos.razon_social}
                    onChange={(e) => setDatos({ ...datos, razon_social: e.currentTarget.value })}
                  />
                  <TextInput
                    label="Dirección"
                    value={datos.direccion}
                    onChange={(e) => setDatos({ ...datos, direccion: e.currentTarget.value })}
                  />
                  <TextInput
                    label="Correo de contacto"
                    value={datos.contacto_email}
                    onChange={(e) => setDatos({ ...datos, contacto_email: e.currentTarget.value })}
                  />
                  <Textarea
                    label="Notas internas"
                    description="Solo tú las ves: ninguna ruta de la academia las devuelve."
                    autosize
                    minRows={3}
                    value={datos.internal_notes}
                    onChange={(e) => setDatos({ ...datos, internal_notes: e.currentTarget.value })}
                  />
                  <Group justify="flex-end">
                    <Button onClick={guardar} loading={editar.isPending}>
                      Guardar
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Alert variant="light" color="blue" title="Qué se puede editar aquí">
                Solo la identidad y el contacto de la academia. Los alumnos, pagos y asistencias se
                cambian dentro de la academia, no desde la consola: así el responsable de cada dato
                sigue siendo quien lo opera.
              </Alert>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="bitacora" pt="md">
          <Card withBorder radius="md" padding="md">
            {escuela.bitacora.length === 0 ? (
              <Text size="sm" c="dimmed">
                Nada registrado todavía.
              </Text>
            ) : (
              <Stack gap="xs">
                {escuela.bitacora.map((linea) => (
                  <Group key={linea.id} justify="space-between" wrap="nowrap">
                    <div>
                      <Text size="sm">{ETIQUETA_ACCION[linea.action] || linea.action}</Text>
                      {linea.payload?.reason && (
                        <Text size="xs" c="dimmed">
                          {String(linea.payload.reason)}
                        </Text>
                      )}
                    </div>
                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {dayjs(linea.created_at).format('DD/MM/YY HH:mm')}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={modal} onClose={close} title="Suspender la academia" centered>
        <Stack gap="sm">
          <Text size="sm">
            Nadie de <strong>{escuela.name}</strong> podrá usar la app hasta que la reactives: ni el
            admin, ni los profesores, ni los padres. Los datos se conservan.
          </Text>
          <Textarea
            label="Motivo"
            description="Queda en la bitácora y se puede consultar después."
            required
            autosize
            minRows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={suspender.isPending}
              disabled={motivo.trim().length < 5}
              onClick={confirmarSuspension}
            >
              Suspender
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
