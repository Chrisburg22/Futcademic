import { useState } from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  Badge,
  Button,
  Modal,
  TextInput,
  ActionIcon,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconChevronDown, IconChevronUp, IconPlus, IconUnlink } from '@tabler/icons-react';
import { useGetMyChildren, useGetStudentTeam } from '../hooks/useStudents';
import { useLinkChild, useUnlinkChild } from '../hooks/useParents';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { CategorySummary } from '../components/categories/CategorySummary';

/**
 * Ficha de la categoría del hijo. Reutiliza `GET /students/:id/team`, el mismo
 * endpoint que alimenta "Mi equipo" del alumno; el padre solo lo ve en lectura.
 */
function CategoriaDelHijo({ studentId }: { studentId: string }) {
  const [abierto, { toggle }] = useDisclosure(false);
  const { data: team, isLoading } = useGetStudentTeam(abierto ? studentId : undefined);

  return (
    <Stack gap="xs" mt="md">
      <Button
        variant="subtle"
        size="compact-sm"
        style={{ alignSelf: 'flex-start' }}
        rightSection={abierto ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        onClick={toggle}
      >
        {abierto ? 'Ocultar categoría' : 'Ver categoría y horario'}
      </Button>
      <Collapse in={abierto}>
        {isLoading ? (
          <Text size="sm" c="dimmed">
            Cargando categoría...
          </Text>
        ) : !team ? (
          <Text size="sm" c="dimmed">
            Todavía no está asignado a una categoría.
          </Text>
        ) : (
          <CategorySummary
            nombre={team.teamName || 'Categoría'}
            color={team.color}
            anios={team.birthYear ? String(team.birthYear) : undefined}
            jugadores={team.totalTeammates}
            entrenadores={(team.teachers || []).map((t: any) => ({
              id: t.id,
              nombre: t.name,
              avatar: t.avatar,
            }))}
            horario={(team.schedules || []).map((s: any) => ({
              id: s.id,
              nombre: s.name,
              hora: s.time,
              cancha: s.venue,
            }))}
          />
        )}
      </Collapse>
    </Stack>
  );
}

export function ChildrenPage() {
  const { data: children = [], isLoading } = useGetMyChildren();
  const link = useLinkChild();
  const unlink = useUnlinkChild();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: { student_code: '', full_name: '' },
  });

  const onLink = async (v: typeof form.values) => {
    await link.mutateAsync({
      student_code: v.student_code || undefined,
      full_name: v.full_name || undefined,
    });
    notifications.show({ color: 'green', message: 'Hijo vinculado' });
    form.reset();
    close();
  };

  const confirmUnlink = (child: any) =>
    modals.openConfirmModal({
      title: 'Desvincular hijo',
      children: (
        <Text size="sm">
          ¿Desvincular a {child.full_name} de tu cuenta?
        </Text>
      ),
      labels: { confirm: 'Desvincular', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await unlink.mutateAsync(child.id);
        notifications.show({ color: 'green', message: 'Hijo desvinculado' });
      },
    });

  return (
    <>
      <PageHeader
        title="Mis hijos"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Vincular hijo
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : children.length === 0 ? (
        <EmptyState description="Aún no has vinculado hijos a tu cuenta." />
      ) : (
        <Stack>
          {children.map((c: any) => (
            <Card key={c.id} withBorder padding="lg" radius="md">
              <Group justify="space-between">
                <Group>
                  <Avatar src={c.avatar_url || undefined} size="lg" radius="xl">
                    {c.full_name?.[0]?.toUpperCase()}
                  </Avatar>
                  <div>
                    <Text fw={600}>{c.full_name}</Text>
                    <Text size="xs" c="dimmed">
                      {c.category?.name || 'Sin categoría'}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <Badge
                    variant="light"
                    color={c.status === 'activo' ? 'green' : 'orange'}
                    tt="capitalize"
                  >
                    {c.status || 'activo'}
                  </Badge>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => confirmUnlink(c)}
                    aria-label="Desvincular"
                  >
                    <IconUnlink size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              <CategoriaDelHijo studentId={c.id} />
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Vincular hijo" centered>
        <form onSubmit={form.onSubmit(onLink)}>
          <Stack>
            <TextInput
              label="Código del alumno"
              description="Proporcionado por la academia"
              {...form.getInputProps('student_code')}
            />
            <TextInput
              label="O nombre completo"
              {...form.getInputProps('full_name')}
            />
            <Button type="submit" loading={link.isPending}>
              Vincular
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
