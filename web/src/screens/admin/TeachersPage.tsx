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
  Alert,
  CopyButton,
  Tooltip,
  Code,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconEye,
  IconShieldPlus,
  IconMailForward,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import {
  useGetTeachers,
  useInviteTeacher,
  useInviteAdmin,
  useResendInvite,
  type InviteResult,
} from '../../hooks/useUsers';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { iniciales } from '../../lib/students';

/** Enlace que hay que compartir a mano cuando el correo no salió. */
type FallbackLink = { email: string; link: string };

export function TeachersPage() {
  const navigate = useRouter();
  const { data: teachers = [], isLoading } = useGetTeachers();
  const invite = useInviteTeacher();
  const inviteAdminMut = useInviteAdmin();
  const resend = useResendInvite();
  const [inviteOpen, { open, close }] = useDisclosure(false);
  const [adminOpen, { open: openAdmin, close: closeAdmin }] = useDisclosure(false);
  const [fallback, setFallback] = useState<FallbackLink | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  /**
   * El backend contesta `emailSent: false` cuando SendGrid no mandó el correo.
   * Antes siempre se anunciaba "invitación enviada" y la invitación se perdía
   * en silencio: ahora se avisa y se ofrece el enlace de activación.
   */
  const reportInvite = (result: InviteResult, email: string, okMessage: string) => {
    // `emailSent` solo bloquea el mensaje de éxito si el backend dice que no
    // salió: una respuesta sin el campo (backend viejo) se da por enviada.
    if (result.emailSent !== false) {
      notifications.show({ color: 'green', message: okMessage });
      return;
    }
    notifications.show({
      color: 'yellow',
      autoClose: 8000,
      message: 'La cuenta se creó, pero el correo no salió. Comparte el enlace de activación.',
    });
    if (result.activationLink) setFallback({ email, link: result.activationLink });
  };

  const adminForm = useForm({
    initialValues: { email: '', fullName: '' },
    validate: {
      email: (v: string) => (/^\S+@\S+$/.test(v) ? null : 'Correo inválido'),
      fullName: (v: string) => (v.length >= 2 ? null : 'Requerido'),
    },
  });

  const onInviteAdmin = async (v: typeof adminForm.values) => {
    const result = await inviteAdminMut.mutateAsync(v);
    reportInvite(result, v.email, 'Admin invitado. Recibirá un correo con el enlace.');
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
    const result = await invite.mutateAsync(v);
    reportInvite(result, v.email, 'Invitación enviada. El profesor recibirá un correo.');
    form.reset();
    close();
  };

  const onResend = async (teacher: any) => {
    setResendingId(teacher.id);
    try {
      const result = await resend.mutateAsync({ userId: teacher.id });
      reportInvite(result, teacher.email || '', 'Invitación reenviada por correo.');
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'No se pudo reenviar la invitación.',
      });
    } finally {
      setResendingId(null);
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
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Profesor</Table.Th>
                  <Table.Th>Correo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teachers.map((t: any) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar
                          size="sm"
                          radius="xl"
                          color="initials"
                          name={t.full_name || undefined}
                          src={t.avatar_url || undefined}
                        >
                          {iniciales(t.full_name)}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {t.full_name || '—'}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{t.email || '—'}</Table.Td>
                    <Table.Td>
                      {t.invitation_accepted ? (
                        <Badge size="sm" variant="light" color="green">
                          Activo
                        </Badge>
                      ) : (
                        <Badge size="sm" variant="light" color="yellow">
                          Invitación pendiente
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        {!t.invitation_accepted && (
                          <Tooltip label="Volver a invitar">
                            <ActionIcon
                              variant="subtle"
                              loading={resendingId === t.id}
                              onClick={() => onResend(t)}
                              aria-label="Volver a invitar"
                            >
                              <IconMailForward size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <ActionIcon
                          variant="subtle"
                          onClick={() => navigate.push(`/admin/teachers/${t.id}`)}
                          aria-label="Ver detalle"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Group>
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

      <Modal
        opened={!!fallback}
        onClose={() => setFallback(null)}
        title="Comparte el enlace de activación"
        centered
      >
        <Stack>
          <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
            El correo a {fallback?.email} no se pudo enviar. Pásale este enlace por otro medio;
            con él crea su contraseña y entra.
          </Alert>
          <Code block style={{ wordBreak: 'break-all' }}>
            {fallback?.link}
          </Code>
          <Group justify="flex-end">
            <CopyButton value={fallback?.link || ''}>
              {({ copied, copy }) => (
                <Button variant={copied ? 'light' : 'filled'} onClick={copy}>
                  {copied ? 'Copiado' : 'Copiar enlace'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
