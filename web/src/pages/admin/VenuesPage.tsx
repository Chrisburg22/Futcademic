import { useState } from 'react';
import {
  Card,
  Group,
  Button,
  Table,
  Modal,
  Stack,
  TextInput,
  Select,
  NumberInput,
  Switch,
  ActionIcon,
  Badge,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  useGetVenues,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
} from '../../hooks/useVenues';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const SURFACES = ['natural', 'artificial', 'mixto', 'concreto', 'otro'];

export function VenuesPage() {
  const { data: venues = [], isLoading } = useGetVenues();
  const create = useCreateVenue();
  const update = useUpdateVenue();
  const del = useDeleteVenue();
  const [createOpen, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      address: '',
      surface_type: '',
      capacity: 0,
      has_lighting: false,
      is_covered: false,
      is_external: false,
      notes: '',
    },
  });

  const editForm = useForm<any>({ initialValues: {} });

  const onCreate = async (v: typeof form.values) => {
    await create.mutateAsync({
      name: v.name,
      address: v.address || undefined,
      surface_type: v.surface_type || undefined,
      capacity: v.capacity || undefined,
      has_lighting: v.has_lighting,
      is_covered: v.is_covered,
      is_external: v.is_external,
      notes: v.notes || undefined,
    });
    notifications.show({ color: 'green', message: 'Cancha creada' });
    form.reset();
    close();
  };

  const startEdit = (v: any) => {
    setEditingId(v.id);
    editForm.setValues({
      name: v.name,
      address: v.address || '',
      surface_type: v.surface_type || '',
      capacity: v.capacity || 0,
      has_lighting: v.has_lighting ?? false,
      is_covered: v.is_covered ?? false,
      is_external: v.is_external ?? false,
      notes: v.notes || '',
    });
  };

  const onUpdate = async (v: any) => {
    if (!editingId) return;
    await update.mutateAsync({ id: editingId, ...v });
    notifications.show({ color: 'green', message: 'Cancha actualizada' });
    setEditingId(null);
  };

  const confirmDelete = (id: string, name: string) =>
    modals.openConfirmModal({
      title: 'Eliminar cancha',
      children: <Text size="sm">¿Eliminar "{name}"? Esta acción no se puede deshacer.</Text>,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await del.mutateAsync(id);
        notifications.show({ color: 'green', message: 'Cancha eliminada' });
      },
    });

  const renderForm = (f: any, loading: boolean, label: string) => (
    <Stack>
      <TextInput label="Nombre" required {...f.getInputProps('name')} />
      <TextInput label="Dirección" {...f.getInputProps('address')} />
      <Group grow>
        <Select
          label="Superficie"
          data={SURFACES}
          clearable
          {...f.getInputProps('surface_type')}
        />
        <NumberInput label="Capacidad" min={0} {...f.getInputProps('capacity')} />
      </Group>
      <Group>
        <Switch label="Iluminación" {...f.getInputProps('has_lighting', { type: 'checkbox' })} />
        <Switch label="Techada" {...f.getInputProps('is_covered', { type: 'checkbox' })} />
        <Switch label="Externa" {...f.getInputProps('is_external', { type: 'checkbox' })} />
      </Group>
      <TextInput label="Notas" {...f.getInputProps('notes')} />
      <Button type="submit" loading={loading}>
        {label}
      </Button>
    </Stack>
  );

  return (
    <>
      <PageHeader
        title="Canchas"
        description="Lugares de entrenamiento y partidos"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Nueva cancha
          </Button>
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : venues.length === 0 ? (
        <EmptyState description="Sin canchas registradas." />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={550}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Superficie</Table.Th>
                  <Table.Th>Capacidad</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {venues.map((v: any) => (
                  <Table.Tr key={v.id}>
                    <Table.Td>
                      <Text fw={500}>{v.name}</Text>
                      {v.address && (
                        <Text size="xs" c="dimmed">
                          {v.address}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" tt="capitalize">
                        {v.surface_type || '—'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{v.capacity ?? '—'}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => startEdit(v)}
                          aria-label="Editar"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => confirmDelete(v.id, v.name)}
                          aria-label="Eliminar"
                        >
                          <IconTrash size={16} />
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

      <Modal opened={createOpen} onClose={close} title="Nueva cancha" centered>
        <form onSubmit={form.onSubmit(onCreate)}>
          {renderForm(form, create.isPending, 'Crear')}
        </form>
      </Modal>

      <Modal
        opened={!!editingId}
        onClose={() => setEditingId(null)}
        title="Editar cancha"
        centered
      >
        <form onSubmit={editForm.onSubmit(onUpdate)}>
          {renderForm(editForm, update.isPending, 'Guardar')}
        </form>
      </Modal>
    </>
  );
}
