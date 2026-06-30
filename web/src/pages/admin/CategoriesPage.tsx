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
  Text,
  MultiSelect,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import {
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../hooks/useCategories';
import { useGetTeachers } from '../../hooks/useUsers';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const YEARS = Array.from({ length: 18 }, (_, i) => (new Date().getFullYear() - i).toString());

export function CategoriesPage() {
  const { data: categories = [], isLoading } = useGetCategories();
  const { data: teachers = [] } = useGetTeachers();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [createOpen, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any | null>(null);

  const form = useForm({
    initialValues: { name: '', birth_year: [new Date().getFullYear().toString()], teacher_id: '' },
  });

  const editForm = useForm<any>({ initialValues: {} });

  const onCreate = async (v: typeof form.values) => {
    await create.mutateAsync({
      name: v.name,
      birth_year: v.birth_year.sort().join('-'),
      teacher_id: v.teacher_id || undefined,
    });
    notifications.show({ color: 'green', message: 'Categoría creada' });
    form.reset();
    close();
  };

  const startEdit = (c: any) => {
    setEditing(c);
    editForm.setValues({
      name: c.name,
      birth_year: c.birth_year?.toString().split(/[,-]/).map((y: string) => y.trim()) || [],
      teacher_id: c.teacher_id || '',
    });
  };

  const onUpdate = async (v: any) => {
    if (!editing) return;
    await update.mutateAsync({
      id: editing.id,
      name: v.name,
      birth_year: v.birth_year.sort().join('-'),
      teacher_id: v.teacher_id || null,
    });
    notifications.show({ color: 'green', message: 'Categoría actualizada' });
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Categorías"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Nueva categoría
          </Button>
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : categories.length === 0 ? (
        <EmptyState description="Aún no has creado categorías." />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={500}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Año</Table.Th>
                  <Table.Th>Profesor</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {categories.map((c: any) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text fw={500}>{c.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{c.birth_year}</Badge>
                    </Table.Td>
                    <Table.Td>{c.teacher?.full_name || '—'}</Table.Td>
                    <Table.Td>
                      <ActionIcon variant="subtle" onClick={() => startEdit(c)} aria-label="Editar">
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}

      <Modal opened={createOpen} onClose={close} title="Nueva categoría" centered>
        <form onSubmit={form.onSubmit(onCreate)}>
          <Stack>
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <MultiSelect
              label="Años de nacimiento"
              placeholder="Selecciona uno o más"
              data={YEARS}
              searchable
              {...form.getInputProps('birth_year')}
            />
            <Select
              label="Profesor (opcional)"
              clearable
              data={teachers.map((t: any) => ({ value: t.id, label: t.full_name }))}
              {...form.getInputProps('teacher_id')}
            />
            <Button type="submit" loading={create.isPending}>
              Crear
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={!!editing} onClose={() => setEditing(null)} title="Editar categoría" centered>
        <form onSubmit={editForm.onSubmit(onUpdate)}>
          <Stack>
            <TextInput label="Nombre" required {...editForm.getInputProps('name')} />
            <MultiSelect
              label="Años de nacimiento"
              placeholder="Selecciona uno o más"
              data={YEARS}
              searchable
              {...editForm.getInputProps('birth_year')}
            />
            <Select
              label="Profesor"
              clearable
              data={teachers.map((t: any) => ({ value: t.id, label: t.full_name }))}
              {...editForm.getInputProps('teacher_id')}
            />
            <Button type="submit" loading={update.isPending}>
              Guardar
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
