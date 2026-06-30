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
  Badge,
  ActionIcon,
  Avatar,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconShirt, IconTrash, IconEye } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  useGetStudents,
  useCreateStudent,
  useUpdateStudent,
  useUpdateUniform,
  useUpdateStudentStatus,
  useDeleteStudent,
} from '../../hooks/useStudents';
import { useGetCategories } from '../../hooks/useCategories';
import { useGetUsers } from '../../hooks/useUsers';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export function StudentsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { data: categories = [] } = useGetCategories();
  const { data: users = [] } = useGetUsers();
  const parents = users.filter((u: any) => u.role === 'padre');
  const { data: students = [], isLoading } = useGetStudents(categoryFilter || undefined);
  const navigate = useNavigate();
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const uniformMut = useUpdateUniform();
  const statusMut = useUpdateStudentStatus();
  const deleteMut = useDeleteStudent();

  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = students.find((s: any) => s.id === editingId);

  const createForm = useForm({
    initialValues: {
      full_name: '',
      birth_date: new Date(),
      email: '',
      category_id: '',
      parent_id: '',
    },
  });

  const editForm = useForm<any>({ initialValues: {} });

  const onCreate = async (v: typeof createForm.values) => {
    await create.mutateAsync({
      full_name: v.full_name,
      birth_date: dayjs(v.birth_date).format('YYYY-MM-DD'),
      email: v.email,
      category_id: v.category_id,
      parent_id: v.parent_id || null,
    });
    notifications.show({ color: 'green', message: 'Alumno creado' });
    createForm.reset();
    closeCreate();
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    editForm.setValues({
      full_name: s.full_name,
      birth_date: s.birth_date ? new Date(s.birth_date) : new Date(),
      category_id: s.category_id,
      parent_id: s.parent_id || '',
      phone: s.phone || '',
      address: s.address || '',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      medical_notes: s.medical_notes || '',
    });
  };

  const onUpdate = async (v: any) => {
    if (!editingId) return;
    await update.mutateAsync({
      id: editingId,
      ...v,
      birth_date: v.birth_date ? dayjs(v.birth_date).format('YYYY-MM-DD') : undefined,
      parent_id: v.parent_id || null,
    });
    notifications.show({ color: 'green', message: 'Alumno actualizado' });
    setEditingId(null);
  };

  return (
    <>
      <PageHeader
        title="Alumnos"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Nuevo alumno
          </Button>
        }
      />
      <Card withBorder padding="md" radius="md" mb="md">
        <Select
          label="Filtrar por categoría"
          placeholder="Todas"
          clearable
          value={categoryFilter}
          onChange={setCategoryFilter}
          data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
        />
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : students.length === 0 ? (
        <EmptyState description="Sin alumnos registrados." />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Alumno</Table.Th>
                  <Table.Th>Categoría</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Uniforme</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {students.map((s: any) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {s.full_name?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>
                            {s.full_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {s.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{s.category?.name || '—'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Select
                        size="xs"
                        w={140}
                        value={s.status || 'activo'}
                        data={[
                          { value: 'activo', label: 'Activo' },
                          { value: 'becado', label: 'Becado' },
                          { value: 'pendiente_pago', label: 'Pend. pago' },
                          { value: 'inactivo', label: 'Inactivo' },
                        ]}
                        onChange={(val) =>
                          val &&
                          statusMut.mutate(
                            { id: s.id, status: val as any },
                            {
                              onSuccess: () =>
                                notifications.show({
                                  color: 'green',
                                  message: 'Status actualizado',
                                }),
                            },
                          )
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant={s.uniform_delivered ? 'filled' : 'light'}
                        color={s.uniform_delivered ? 'green' : 'gray'}
                        onClick={() =>
                          uniformMut.mutate({
                            id: s.id,
                            uniform_delivered: !s.uniform_delivered,
                          })
                        }
                        aria-label="Alternar uniforme"
                      >
                        <IconShirt size={16} />
                      </ActionIcon>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => navigate(`/admin/students/${s.id}`)}
                          aria-label="Ver detalle"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => startEdit(s)}
                          aria-label="Editar"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Eliminar"
                          onClick={() =>
                            modals.openConfirmModal({
                              title: 'Eliminar alumno',
                              children: (
                                <Text size="sm">
                                  ¿Eliminar a {s.full_name}? El registro se
                                  archiva pero no se puede revertir fácilmente.
                                </Text>
                              ),
                              labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
                              confirmProps: { color: 'red' },
                              onConfirm: async () => {
                                await deleteMut.mutateAsync(s.id);
                                notifications.show({
                                  color: 'green',
                                  message: 'Alumno eliminado',
                                });
                              },
                            })
                          }
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

      <Modal opened={createOpen} onClose={closeCreate} title="Nuevo alumno" centered>
        <form onSubmit={createForm.onSubmit(onCreate)}>
          <Stack>
            <TextInput label="Nombre completo" required {...createForm.getInputProps('full_name')} />
            <DateInput label="Fecha de nacimiento" required {...createForm.getInputProps('birth_date')} />
            <TextInput label="Correo" type="email" required {...createForm.getInputProps('email')} />
            <Select
              label="Categoría"
              required
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...createForm.getInputProps('category_id')}
            />
            <Select
              label="Padre/Tutor (opcional)"
              clearable
              data={parents.map((p: any) => ({ value: p.id, label: p.full_name }))}
              {...createForm.getInputProps('parent_id')}
            />
            <Button type="submit" loading={create.isPending}>
              Crear
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!editingId}
        onClose={() => setEditingId(null)}
        title={`Editar ${editing?.full_name || ''}`}
        centered
        size="lg"
      >
        <form onSubmit={editForm.onSubmit(onUpdate)}>
          <Stack>
            <TextInput label="Nombre completo" {...editForm.getInputProps('full_name')} />
            <DateInput label="Fecha de nacimiento" {...editForm.getInputProps('birth_date')} />
            <Select
              label="Categoría"
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...editForm.getInputProps('category_id')}
            />
            <Select
              label="Padre/Tutor"
              clearable
              data={parents.map((p: any) => ({ value: p.id, label: p.full_name }))}
              {...editForm.getInputProps('parent_id')}
            />
            <Group grow>
              <TextInput label="Teléfono" {...editForm.getInputProps('phone')} />
              <TextInput label="Dirección" {...editForm.getInputProps('address')} />
            </Group>
            <Group grow>
              <TextInput
                label="Contacto emergencia"
                {...editForm.getInputProps('emergency_contact_name')}
              />
              <TextInput
                label="Tel. emergencia"
                {...editForm.getInputProps('emergency_contact_phone')}
              />
            </Group>
            <TextInput label="Notas médicas" {...editForm.getInputProps('medical_notes')} />
            <Button type="submit" loading={update.isPending}>
              Guardar cambios
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
