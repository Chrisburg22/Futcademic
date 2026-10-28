import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Grid,
  Group,
  Menu,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCalendar,
  IconMapPin,
  IconCalendarCheck,
  IconChevronDown,
  IconCash,
  IconEdit,
  IconFileText,
  IconFlame,
  IconHeartbeat,
  IconPhone,
  IconShirt,
  IconTrash,
  IconTrophy,
  IconUser,
  IconUsers,
  IconCircleCheck,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  useDeleteStudent,
  useGetStudentDetails,
  useGetStudentStats,
  useGetStudentTeam,
  useUpdateStudentStatus,
  useUpdateUniform,
} from '../../hooks/useStudents';
import { useGetAccountStatement } from '../../hooks/usePayments';
import { useGetCategories, useGetMyCategories } from '../../hooks/useCategories';
import { useGetUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useRegisterChatScreen } from '../../contexts/ChatScreenContext';
import { mensajeDeError } from '../../lib/categories';
import {
  ESTADOS_ALUMNO,
  OPCIONES_ESTADO,
  calcularEdad,
  iniciales,
  motivosDisponibles,
  nombreTutor,
  normalizarEstado,
  pendientesDelAlumno,
  type Pendiente,
} from '../../lib/students';
import type { StudentStatus } from '../../types';
import { StudentExpediente } from './components/StudentExpediente';
import { StudentEditForm } from './components/StudentEditForm';
import { StudentPaymentsPanel } from './components/StudentPaymentsPanel';
import { StudentAttendancePanel } from './components/StudentAttendancePanel';
import { TutorReminderModal } from './components/TutorReminderModal';

type Pestana = 'resumen' | 'datos' | 'expediente' | 'pagos' | 'asistencia';
const PESTANAS: Pestana[] = ['resumen', 'datos', 'expediente', 'pagos', 'asistencia'];

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder padding="md" radius="md" h="100%">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text fw={700} size="lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

function Fila({
  icono,
  titulo,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Group gap="sm" align="flex-start" wrap="nowrap">
      <ThemeIcon variant="light" color="gray" size={30} radius="md">
        {icono}
      </ThemeIcon>
      <div style={{ minWidth: 0 }}>
        <Text size="xs" c="dimmed">
          {titulo}
        </Text>
        <div>{children}</div>
      </div>
    </Group>
  );
}

const Vacio = () => (
  <Text size="sm" c="dimmed">
    Sin registrar
  </Text>
);

const Telefono = ({ valor }: { valor?: string | null }) =>
  valor ? (
    <Anchor href={`tel:${valor.replace(/[^\d+]/g, '')}`} size="sm">
      {valor}
    </Anchor>
  ) : (
    <Vacio />
  );

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useRouter();
  const { profile } = useAuth();
  const isTeacher = profile?.role === 'profesor';
  const esAdmin = !isTeacher;

  const { data: student, isLoading, isError } = useGetStudentDetails(id);
  const { data: stats } = useGetStudentStats(id);
  // El backend limita equipo y estado de cuenta al admin.
  const { data: team } = useGetStudentTeam(esAdmin ? id : undefined);
  const { data: cuenta } = useGetAccountStatement(esAdmin ? id : undefined);
  const { data: misCategorias = [] } = useGetMyCategories(isTeacher);
  const { data: todasCategorias = [] } = useGetCategories(!isTeacher);
  const categorias = isTeacher ? misCategorias : todasCategorias;
  const { data: users = [] } = useGetUsers();
  const tutores = users.filter((u: any) => u.role === 'padre');

  const statusMut = useUpdateStudentStatus();
  const uniformMut = useUpdateUniform();
  const deleteMut = useDeleteStudent();

  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [sucio, setSucio] = useState(false);
  const [recordarAbierto, recordar] = useDisclosure(false);

  // La pestaña vive en el hash para poder compartir o recargar la ficha.
  useEffect(() => {
    const desdeHash = window.location.hash.replace('#', '') as Pestana;
    if (PESTANAS.includes(desdeHash)) setPestana(desdeHash);
  }, []);

  const irAPestana = (valor: string | null) => {
    if (!valor) return;
    setPestana(valor as Pestana);
    window.history.replaceState(null, '', `#${valor}`);
  };

  // Avisa antes de perder ediciones al recargar o cerrar la pestaña.
  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sucio]);

  // El asistente sabe de qué alumno habla aunque solo digas "este alumno".
  useRegisterChatScreen(
    student
      ? { screen: 'Ficha del alumno', entity: { type: 'alumno', id, name: student.full_name ?? undefined } }
      : null
  );

  if (isLoading) return <LoadingState />;
  if (isError || !student) {
    return (
      <Card withBorder radius="md">
        <EmptyState
          title="No encontramos a este alumno"
          description="Pudo haber sido eliminado o no tienes acceso a su ficha."
          action={<Button onClick={() => navigate.push('/admin/students')}>Volver a alumnos</Button>}
        />
      </Card>
    );
  }

  const estado = normalizarEstado(student.status);
  const metaEstado = ESTADOS_ALUMNO[estado];
  const edad = calcularEdad(student.birth_date);
  const tutor = nombreTutor(student);
  const deuda = cuenta ? Number(cuenta.pendingAmount) : 0;
  const pendientes = pendientesDelAlumno(student, { deuda });
  const puedeRecordar = esAdmin && motivosDisponibles(student, { deuda }).length > 0;

  const volver = () => {
    if (!sucio) return navigate.push('/admin/students');
    modals.openConfirmModal({
      title: 'Salir sin guardar',
      children: <Text size="sm">Tienes cambios sin guardar en los datos del alumno.</Text>,
      labels: { confirm: 'Salir sin guardar', cancel: 'Seguir editando' },
      confirmProps: { color: 'red' },
      onConfirm: () => navigate.push('/admin/students'),
    });
  };

  const cambiarEstado = (nuevo: StudentStatus) =>
    statusMut.mutate(
      { id, status: nuevo },
      {
        onSuccess: () =>
          notifications.show({ color: 'green', message: `Estado: ${ESTADOS_ALUMNO[nuevo].label}` }),
        onError: (error) =>
          notifications.show({
            color: 'red',
            title: 'No se pudo cambiar el estado',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          }),
      },
    );

  const alternarUniforme = () =>
    uniformMut.mutate(
      { id, uniform_delivered: !student.uniform_delivered },
      {
        onError: (error) =>
          notifications.show({
            color: 'red',
            title: 'No se pudo actualizar el uniforme',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          }),
      },
    );

  const eliminar = () =>
    modals.openConfirmModal({
      title: `Eliminar a ${student.full_name}`,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Se quita de la academia y se guarda una copia en el historial de eliminados.
            <strong> No hay forma de restaurarlo desde la app.</strong>
          </Text>
          <Text size="sm" c="dimmed">
            Si solo dejó de entrenar, márcalo como inactivo para conservar su historial.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Eliminar definitivamente', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteMut.mutateAsync(id);
          notifications.show({ color: 'green', message: `${student.full_name} fue eliminado` });
          setSucio(false);
          navigate.push('/admin/students');
        } catch (error) {
          notifications.show({
            color: 'red',
            title: 'No se pudo eliminar',
            message: mensajeDeError(error, 'Inténtalo de nuevo.'),
          });
        }
      },
    });

  return (
    <Stack gap="md">
      <Breadcrumbs>
        <Anchor component="button" type="button" size="sm" onClick={volver}>
          Alumnos
        </Anchor>
        <Text size="sm" c="dimmed">
          {student.full_name}
        </Text>
      </Breadcrumbs>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <Avatar
              size={72}
              radius="xl"
              color="initials"
              name={student.full_name}
              src={student.avatar_url || undefined}
            >
              {iniciales(student.full_name)}
            </Avatar>
            <Stack gap={6}>
              <Title order={2} lh={1.2}>
                {student.full_name}
              </Title>
              <Text size="sm" c="dimmed">
                {[
                  edad != null ? `${edad} años` : null,
                  student.birth_date ? dayjs(student.birth_date).format('DD/MM/YYYY') : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Sin fecha de nacimiento'}
              </Text>
              <Group gap="xs">
                <Badge variant="light">{student.category?.name || 'Sin categoría'}</Badge>
                {esAdmin ? (
                  <Menu position="bottom-start" withinPortal shadow="md" width={210}>
                    <Menu.Target>
                      <UnstyledButton aria-label={`Estado: ${metaEstado.label}. Cambiar estado`}>
                        <Badge
                          color={metaEstado.color}
                          variant="light"
                          style={{ cursor: 'pointer' }}
                          rightSection={<IconChevronDown size={12} />}
                        >
                          {metaEstado.label}
                        </Badge>
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Cambiar estado</Menu.Label>
                      {OPCIONES_ESTADO.map((o) => (
                        <Menu.Item
                          key={o.value}
                          disabled={o.value === estado}
                          onClick={() => cambiarEstado(o.value)}
                        >
                          <Text size="sm">{o.label}</Text>
                          <Text size="xs" c="dimmed">
                            {ESTADOS_ALUMNO[o.value].ayuda}
                          </Text>
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                ) : (
                  <Badge color={metaEstado.color} variant="light">
                    {metaEstado.label}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>

          <Group gap="xs">
            <Tooltip
              label={student.uniform_delivered ? 'Uniforme entregado (clic para deshacer)' : 'Marcar uniforme entregado'}
            >
              <ActionIcon
                size="lg"
                variant={student.uniform_delivered ? 'filled' : 'light'}
                color={student.uniform_delivered ? 'green' : 'gray'}
                aria-pressed={!!student.uniform_delivered}
                aria-label={`Uniforme ${student.uniform_delivered ? 'entregado' : 'pendiente'}`}
                onClick={alternarUniforme}
                loading={uniformMut.isPending}
              >
                <IconShirt size={18} />
              </ActionIcon>
            </Tooltip>
            <Button variant="default" leftSection={<IconEdit size={16} />} onClick={() => irAPestana('datos')}>
              Editar datos
            </Button>
            {esAdmin && (
              <Tooltip label="Eliminar alumno">
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  color="red"
                  aria-label="Eliminar alumno"
                  onClick={eliminar}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card>

      <Pendientes
        pendientes={pendientes}
        onIr={irAPestana}
        onRecordar={puedeRecordar ? recordar.open : undefined}
      />
      <TutorReminderModal
        opened={recordarAbierto}
        onClose={recordar.close}
        alumno={student}
        academia={profile?.school?.name}
        deuda={deuda}
      />

      <Tabs value={pestana} onChange={irAPestana} keepMounted>
        <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          <Tabs.Tab value="resumen" leftSection={<IconUser size={16} />}>
            Resumen
          </Tabs.Tab>
          <Tabs.Tab
            value="datos"
            leftSection={<IconEdit size={16} />}
            rightSection={
              sucio ? (
                <Text component="span" c="orange" size="xs" aria-label="Cambios sin guardar">
                  ●
                </Text>
              ) : undefined
            }
          >
            Datos
          </Tabs.Tab>
          <Tabs.Tab value="expediente" leftSection={<IconFileText size={16} />}>
            Expediente
          </Tabs.Tab>
          {esAdmin && (
            <Tabs.Tab value="pagos" leftSection={<IconCash size={16} />}>
              Pagos
            </Tabs.Tab>
          )}
          <Tabs.Tab value="asistencia" leftSection={<IconCalendarCheck size={16} />}>
            Asistencia
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <Stack gap="md">
            {stats && (
              <Grid>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stat label="Racha actual" value={stats.currentStreak} icon={<IconFlame size={18} />} color="orange" />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stat label="Racha máxima" value={stats.maxStreak} icon={<IconFlame size={18} />} color="red" />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stat
                    label="Este mes"
                    value={`${stats.attendedThisMonth}/${stats.trainingsThisMonth}`}
                    icon={<IconCalendar size={18} />}
                    color="blue"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                  <Stat
                    label="Logros"
                    value={`${stats.achievementsUnlocked}/${stats.totalAchievements}`}
                    icon={<IconTrophy size={18} />}
                    color="yellow"
                  />
                </Grid.Col>
              </Grid>
            )}

            <Grid>
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Card withBorder padding="lg" radius="md" h="100%">
                  <Group justify="space-between" mb="md">
                    <Text fw={600}>Contacto y salud</Text>
                    <Button variant="subtle" size="compact-sm" onClick={() => irAPestana('datos')}>
                      Editar
                    </Button>
                  </Group>
                  <Stack gap="md">
                    <Fila icono={<IconUsers size={16} />} titulo="Tutor">
                      {tutor ? (
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {tutor}
                          </Text>
                          <Telefono valor={student.parent?.phone} />
                        </Group>
                      ) : (
                        <Text size="sm" c="red">
                          Sin tutor asignado
                        </Text>
                      )}
                    </Fila>
                    <Fila icono={<IconPhone size={16} />} titulo="Teléfono del alumno">
                      <Telefono valor={student.phone} />
                    </Fila>
                    <Fila icono={<IconAlertTriangle size={16} />} titulo="Contacto de emergencia">
                      {student.emergency_contact_name || student.emergency_contact_phone ? (
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {student.emergency_contact_name || 'Sin nombre'}
                          </Text>
                          <Telefono valor={student.emergency_contact_phone} />
                        </Group>
                      ) : (
                        <Vacio />
                      )}
                    </Fila>
                    <Fila icono={<IconHeartbeat size={16} />} titulo="Notas médicas">
                      {student.medical_notes ? (
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                          {student.medical_notes}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Sin alergias ni condiciones registradas
                        </Text>
                      )}
                    </Fila>
                    <Fila icono={<IconMapPin size={16} />} titulo="Dirección">
                      {student.address ? <Text size="sm">{student.address}</Text> : <Vacio />}
                    </Fila>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 5 }}>
                <Card withBorder padding="lg" radius="md" h="100%">
                  <Group gap="xs" mb="md">
                    <IconUsers size={18} />
                    <Text fw={600}>{team?.teamName || student.category?.name || 'Equipo'}</Text>
                  </Group>
                  {team ? (
                    <Stack gap="sm">
                      <div>
                        <Text size="xs" c="dimmed" mb={4}>
                          Profesores
                        </Text>
                        <Group gap="xs">
                          {/* `getStudentTeam` devuelve `name`, no `full_name`. */}
                          {(team.teachers || []).map((t: any) => (
                            <Badge key={t.id} variant="light" color="violet">
                              {t.name || t.full_name}
                            </Badge>
                          ))}
                          {(team.teachers || []).length === 0 && (
                            <Text size="sm" c="dimmed">
                              Sin profesores asignados
                            </Text>
                          )}
                        </Group>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed" mb={4}>
                          Compañeros ({(team.teammates || []).length})
                        </Text>
                        <Group gap="xs">
                          {(team.teammates || []).map((t: any) => (
                            <Badge key={t.id} variant="light">
                              {t.full_name}
                            </Badge>
                          ))}
                          {(team.teammates || []).length === 0 && (
                            <Text size="sm" c="dimmed">
                              Aún no hay otros alumnos en la categoría
                            </Text>
                          )}
                        </Group>
                      </div>
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Sin información del equipo.
                    </Text>
                  )}
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="datos" pt="md">
          <Card withBorder padding="lg" radius="md" maw={820}>
            <StudentEditForm
              alumno={student}
              categorias={categorias}
              tutores={tutores}
              onDirtyChange={setSucio}
              onSaved={() => irAPestana('resumen')}
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="expediente" pt="md">
          <StudentExpediente studentId={id} student={student} />
        </Tabs.Panel>

        {esAdmin && (
          <Tabs.Panel value="pagos" pt="md">
            <StudentPaymentsPanel studentId={id} estado={student.status} />
          </Tabs.Panel>
        )}

        <Tabs.Panel value="asistencia" pt="md">
          <StudentAttendancePanel studentId={id} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function Pendientes({
  pendientes,
  onIr,
  onRecordar,
}: {
  pendientes: Pendiente[];
  onIr: (pestana: string) => void;
  onRecordar?: () => void;
}) {
  if (pendientes.length === 0) {
    return (
      <Alert variant="light" color="green" icon={<IconCircleCheck size={18} />} py="xs">
        Todo en orden: expediente, contactos y pagos al corriente.
      </Alert>
    );
  }
  const graves = pendientes.some((p) => p.severidad === 'alta');
  return (
    <Alert
      variant="light"
      color={graves ? 'orange' : 'yellow'}
      icon={<IconAlertTriangle size={18} />}
      title={`Por atender (${pendientes.length})`}
    >
      <Stack gap={4}>
        {pendientes.map((p) => (
          <Group key={p.clave} gap="xs" wrap="nowrap" align="baseline">
            <Text size="sm">{p.mensaje}</Text>
            {p.destino && (
              <Anchor component="button" type="button" size="sm" onClick={() => onIr(p.destino!)}>
                Resolver
              </Anchor>
            )}
          </Group>
        ))}
        {onRecordar && (
          <div>
            <Button
              mt="xs"
              size="compact-sm"
              variant="light"
              color="orange"
              leftSection={<IconBrandWhatsapp size={14} />}
              onClick={onRecordar}
            >
              Recordar al tutor
            </Button>
          </div>
        )}
      </Stack>
    </Alert>
  );
}
