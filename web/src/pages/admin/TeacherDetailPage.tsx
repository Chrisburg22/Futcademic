import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  Button,
  Switch,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { useGetTeacherDetails } from '../../hooks/useUsers';
import {
  useGetTeacherPermissions,
  useUpdateTeacherPermissions,
} from '../../hooks/usePermissions';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import type { TeacherPermissions } from '../../types';
import { useState, useEffect } from 'react';

const PERM_LABELS: Record<keyof TeacherPermissions, string> = {
  can_take_attendance: 'Tomar asistencia',
  can_manage_events: 'Gestionar eventos',
  can_view_finances: 'Ver finanzas',
  can_manage_students: 'Gestionar alumnos',
  can_manage_payments: 'Gestionar pagos',
  can_manage_categories: 'Gestionar categorías',
};

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: teacher, isLoading } = useGetTeacherDetails(id);
  const { data: perms } = useGetTeacherPermissions(id);
  const updatePerms = useUpdateTeacherPermissions();
  const [local, setLocal] = useState<TeacherPermissions | null>(null);

  useEffect(() => {
    if (perms) setLocal(perms);
  }, [perms]);

  const toggle = (key: keyof TeacherPermissions) => {
    if (!local) return;
    setLocal({ ...local, [key]: !local[key] });
  };

  const save = async () => {
    if (!id || !local) return;
    await updatePerms.mutateAsync({ id, ...local });
    notifications.show({ color: 'green', message: 'Permisos actualizados' });
  };

  if (isLoading) return <LoadingState />;
  if (!teacher) return <Text>Profesor no encontrado</Text>;

  return (
    <>
      <PageHeader
        title={teacher.full_name || 'Profesor'}
        actions={
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/admin/teachers')}
          >
            Volver
          </Button>
        }
      />

      <Card withBorder padding="lg" radius="md" mb="md">
        <Group>
          <Avatar size="xl" radius="xl" src={teacher.avatar_url || undefined}>
            {teacher.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <Stack gap={4}>
            <Text fw={700} size="lg">
              {teacher.full_name}
            </Text>
            <Text size="sm" c="dimmed">
              {teacher.email}
            </Text>
            {teacher.phone && <Text size="sm">{teacher.phone}</Text>}
          </Stack>
        </Group>
      </Card>

      <Card withBorder padding="lg" radius="md" mb="md">
        <Text fw={600} mb="xs">
          Categorías asignadas
        </Text>
        <Group gap="xs">
          {(teacher.categories || []).map((c: any) => (
            <Badge key={c.id} variant="light">
              {c.name}
            </Badge>
          ))}
          {(teacher.categories || []).length === 0 && (
            <Text size="sm" c="dimmed">
              Sin asignaciones
            </Text>
          )}
        </Group>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Text fw={600} mb="sm">
          Permisos
        </Text>
        <Divider mb="sm" />
        {local ? (
          <Stack gap="sm">
            {(Object.keys(PERM_LABELS) as Array<keyof TeacherPermissions>).map((key) => (
              <Switch
                key={key}
                label={PERM_LABELS[key]}
                checked={local[key]}
                onChange={() => toggle(key)}
              />
            ))}
            <Button mt="sm" onClick={save} loading={updatePerms.isPending}>
              Guardar permisos
            </Button>
          </Stack>
        ) : (
          <LoadingState />
        )}
      </Card>
    </>
  );
}
