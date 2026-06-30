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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconUnlink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGetMyChildren } from '../hooks/useStudents';
import { useLinkChild, useUnlinkChild } from '../hooks/useParents';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

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
