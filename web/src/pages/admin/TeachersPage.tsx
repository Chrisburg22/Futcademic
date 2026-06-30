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
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export function TeachersPage() {
  const navigate = useNavigate();
  const { data: teachers = [], isLoading } = useGetTeachers();
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
    initialValues: { email: '', fullName: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      fullName: (v) => (v.length >= 2 ? null : 'Requerido'),
    },
  });

  const onInvite = async (v: typeof form.values) => {
    await invite.mutateAsync(v);
    notifications.show({
      color: 'green',
      message: 'Invitación enviada. El profesor recibirá un correo.',
    });
    form.reset();
    close();
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

      <Modal opened={inviteOpen} onClose={close} title="Invitar profesor" centered>
        <form onSubmit={form.onSubmit(onInvite)}>
          <Stack>
            <TextInput label="Nombre completo" required {...form.getInputProps('fullName')} />
            <TextInput
              label="Correo"
              type="email"
              required
              {...form.getInputProps('email')}
            />
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
