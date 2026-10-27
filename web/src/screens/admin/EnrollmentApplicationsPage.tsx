'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Group,
  Select,
  Table,
  Tabs,
  Text,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconClipboardList,
  IconEye,
  IconLink,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useGetCategories } from '../../hooks/useCategories';
import {
  useGetEnrollmentApplications,
  useGetEnrollmentInvitations,
  useRevokeEnrollmentInvitation,
} from '../../hooks/useEnrollment';
import { EnrollmentStatusBadge, APPLICATION_STATUS_OPTIONS } from '../enrollment/labels';
import { InviteStudentModal } from './components/InviteStudentModal';

export function EnrollmentApplicationsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const [status, setStatus] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [inviteOpen, invite] = useDisclosure(false);

  const { data: categories = [] } = useGetCategories();
  const { data: applications = [], isLoading } = useGetEnrollmentApplications({
    status,
    category_id: categoryId,
  });
  const { data: invitations = [] } = useGetEnrollmentInvitations();
  const revoke = useRevokeEnrollmentInvitation();

  const handleRevoke = async (id: string) => {
    try {
      await revoke.mutateAsync(id);
      notifications.show({ color: 'green', message: 'Link revocado.' });
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.error || 'No se pudo revocar el link.',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Inscripciones"
        description="Links para que el tutor capture todo desde su celular y solicitudes pendientes de aprobación."
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={invite.open}>
            Invitar alumno
          </Button>
        }
      />

      <Tabs defaultValue="applications" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="applications" leftSection={<IconClipboardList size={16} />}>
            Solicitudes
            {applications.length > 0 && (
              <Badge ml={8} size="xs" variant="light">
                {applications.length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="links" leftSection={<IconLink size={16} />}>
            Links generados
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="applications">
          <Card withBorder padding="md" radius="md" mb="md">
            <Group>
              <Select
                label="Estado"
                placeholder="Todos"
                clearable
                data={APPLICATION_STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
                w={180}
              />
              <Select
                label="Categoría"
                placeholder="Todas"
                clearable
                searchable
                data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                value={categoryId}
                onChange={setCategoryId}
                w={200}
              />
            </Group>
          </Card>

          {isLoading ? (
            <LoadingState />
          ) : applications.length === 0 ? (
            <EmptyState
              title="Sin solicitudes"
              description="Cuando un tutor envíe el formulario desde un link, aparecerá aquí para revisión."
            />
          ) : (
            <Card withBorder padding={0} radius="md">
              <Table.ScrollContainer minWidth={760}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Alumno</Table.Th>
                      <Table.Th>Tutor</Table.Th>
                      <Table.Th>Categoría</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Enviada</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {applications.map((app: any) => (
                      <Table.Tr key={app.id}>
                        <Table.Td>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={600}>
                              {app.student_full_name || 'Sin nombre'}
                            </Text>
                            {app.category_mismatch && (
                              <Tooltip label="La fecha de nacimiento no coincide con la categoría">
                                <IconAlertTriangle size={15} color="var(--mantine-color-yellow-7)" />
                              </Tooltip>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed">
                            {app.student_birth_date
                              ? dayjs(app.student_birth_date).format('DD/MM/YYYY')
                              : 'Sin fecha'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{app.guardian_full_name || '—'}</Text>
                          <Text size="xs" c="dimmed">
                            {app.guardian_phone || app.guardian_email || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{app.category?.name || '—'}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <EnrollmentStatusBadge status={app.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {app.submitted_at
                              ? dayjs(app.submitted_at).format('DD/MM/YYYY HH:mm')
                              : 'No enviada'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            aria-label="Ver solicitud"
                            onClick={() => router.push(`/admin/enrollments/${app.id}`)}
                          >
                            <IconEye size={18} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="links">
          {invitations.length === 0 ? (
            <EmptyState
              title="Sin links"
              description="Genera un link para que un tutor inscriba a su hijo desde el celular."
            />
          ) : (
            <Card withBorder padding={0} radius="md">
              <Table.ScrollContainer minWidth={680}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Categoría</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Creado</Table.Th>
                      <Table.Th>Vence</Table.Th>
                      <Table.Th>Nota</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {invitations.map((inv: any) => (
                      <Table.Tr key={inv.id}>
                        <Table.Td>
                          <Badge variant="light">{inv.category?.name || '—'}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <EnrollmentStatusBadge status={inv.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {dayjs(inv.created_at).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {dayjs(inv.expires_at).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {inv.note || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {isAdmin && inv.status === 'activa' && (
                            <Tooltip label="Revocar link">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                aria-label="Revocar link"
                                loading={revoke.isPending}
                                onClick={() => handleRevoke(inv.id)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Card>
          )}

          <Text size="xs" c="dimmed" mt="sm">
            Por seguridad el link no se puede recuperar después de cerrar el modal.
            Si se pierde, genera uno nuevo y revoca el anterior.
          </Text>
        </Tabs.Panel>
      </Tabs>

      <InviteStudentModal
        opened={inviteOpen}
        onClose={invite.close}
        categories={categories}
        defaultCategoryId={categoryId}
      />
    </>
  );
}
