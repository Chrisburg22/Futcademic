import { useState } from 'react';
import {
  Card,
  Group,
  Button,
  Table,
  Modal,
  Stack,
  TextInput,
  ActionIcon,
  Avatar,
  Text,
  Badge,
  MultiSelect,
  Switch,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEye, IconShieldPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetTeachers,
  useGetTeacherDetails,
  useInviteTeacher,
  useInviteAdmin,
} from '../../hooks/useUsers';
import { useGetCategories } from '../../hooks/useCategories';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import type { TeacherPermissions } from '../../types';

const PERM_LABELS: Record<keyof TeacherPermissions, string> = {
  can_take_attendance: 'Tomar asistencia',
  can_manage_events: 'Gestionar eventos',
  can_view_finances: 'Ver finanzas',
  can_manage_students: 'Gestionar alumnos',
  can_manage_payments: 'Gestionar pagos',
  can_manage_categories: 'Gestionar categorías',
};

/** Mismos valores por defecto que `teacher_permissions` en la base de datos. */
const DEFAULT_PERMISSIONS: TeacherPermissions = {
  can_take_attendance: true,
  can_manage_events: true,
  can_view_finances: false,
  can_manage_students: true,
  can_manage_payments: false,
  can_manage_categories: false,
};

export function TeachersPage() {
  const navigate = useNavigate();
  const { data: teachers = [], isLoading } = useGetTeachers();
  const { data: categories = [] } = useGetCategories();
  const invite = useInviteTeacher();
  const inviteAdminMut = useInviteAdmin();
  const [inviteOpen, { open, close }] = useDisclosure(false);
  const [adminOpen, { open: openAdmin, close: closeAdmin }] = useDisclosure(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: details } = useGetTeacherDetails(detailId || undefined);

  const adminForm = useForm({
    initialValues: { email: '', fullName: '' },
    validate: {
      email: (v: string) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      fullName: (v: string) => (v.length >= 2 ? null : 'Requerido'),
    },
  });

  const onInviteAdmin = async (v: typeof adminForm.values) => {
    await inviteAdminMut.mutateAsync(v);
    notifications.show({ color: 'green', message: 'Admin invitado' });
    adminForm.reset();
    closeAdmin();
  };

  const form = useForm({
    initialValues: {
      email: '',
      fullName: '',
      phone: '',
      categoryIds: [] as string[],
      permissions: { ...DEFAULT_PERMISSIONS },
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      fullName: (v) => (v.length >= 2 ? null : 'Requerido'),
    },
  });

  const onInvite = async (v: typeof form.values) => {
    try {
      // Categorías y permisos viajan con la invitación: el profesor entra ya
      // configurado en vez de pasar por tres pantallas después.
      await invite.mutateAsync({
        email: v.email.trim(),
        fullName: v.fullName.trim(),
        phone: v.phone || undefined,
        categoryIds: v.categoryIds.length ? v.categoryIds : undefined,
        permissions: v.permissions,
      });
      notifications.show({
        color: 'green',
        message: v.categoryIds.length
          ? `Invitación enviada con ${v.categoryIds.length} ${
              v.categoryIds.length === 1 ? 'categoría asignada' : 'categorías asignadas'
            }.`
          : 'Invitación enviada. El profesor recibirá un correo.',
      });
      form.reset();
      close();
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'Error al enviar la invitación',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Profesores"
        actions={
          <Group>
            <Button leftSection={<IconPlus size={16} />} onClick={open}>
              Invitar profesor
            </Button>
            <Button
              variant="light"
              leftSection={<IconShieldPlus size={16} />}
              onClick={openAdmin}
            >
              Invitar admin
            </Button>
          </Group>
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : teachers.length === 0 ? (
        <EmptyState description="Aún no has invitado profesores." />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={500}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Profesor</Table.Th>
                  <Table.Th>Correo</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teachers.map((t: any) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {t.full_name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {t.full_name || '—'}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{t.email}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => navigate(`/admin/teachers/${t.id}`)}
                        aria-label="Ver detalle"
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}

      <Modal opened={inviteOpen} onClose={close} title="Invitar profesor" centered size="lg">
        <form onSubmit={form.onSubmit(onInvite)}>
          <Stack>
            <TextInput label="Nombre completo" required {...form.getInputProps('fullName')} />
            <Group grow>
              <TextInput
                label="Correo"
                type="email"
                required
                {...form.getInputProps('email')}
              />
              <TextInput label="Teléfono (opcional)" {...form.getInputProps('phone')} />
            </Group>

            <MultiSelect
              label="Categorías a su cargo"
              placeholder="Puedes asignarlas después"
              searchable
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...form.getInputProps('categoryIds')}
            />

            <Divider my="xs" label="Permisos" labelPosition="center" />
            <Text size="xs" c="dimmed" mt={-8}>
              Puedes cambiarlos cuando quieras desde la ficha del profesor.
            </Text>
            <Stack gap="xs">
              {(Object.keys(PERM_LABELS) as Array<keyof TeacherPermissions>).map((key) => (
                <Switch
                  key={key}
                  label={PERM_LABELS[key]}
                  {...form.getInputProps(`permissions.${key}`, { type: 'checkbox' })}
                />
              ))}
            </Stack>

            <Button type="submit" loading={invite.isPending}>
              Enviar invitación
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={adminOpen} onClose={closeAdmin} title="Invitar administrador" centered>
        <form onSubmit={adminForm.onSubmit(onInviteAdmin)}>
          <Stack>
            <TextInput
              label="Nombre completo"
              required
              {...adminForm.getInputProps('fullName')}
            />
            <TextInput
              label="Correo"
              type="email"
              required
              {...adminForm.getInputProps('email')}
            />
            <Button type="submit" loading={inviteAdminMut.isPending}>
              Enviar invitación
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
