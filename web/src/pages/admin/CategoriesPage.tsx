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
  NumberInput,
  ColorInput,
  Divider,
  Alert,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconEye, IconCalendarPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetCategories,
  useCreateFullCategory,
  useUpdateCategory,
} from '../../hooks/useCategories';
import { useGetTeachers } from '../../hooks/useUsers';
import { useGetVenues } from '../../hooks/useVenues';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const YEARS = Array.from({ length: 18 }, (_, i) => (new Date().getFullYear() - i).toString());

/**
 * Vocabulario de días del motor de recurrencia: inglés capitalizado, como en
 * `recurrenceRule.days` de `docs/technical/REFERENCIA-API.md`. Si el backend de
 * `POST /categories/full` espera otro formato, cambiar solo los `value`.
 */
const DAYS = [
  { value: 'Monday', label: 'Lunes' },
  { value: 'Tuesday', label: 'Martes' },
  { value: 'Wednesday', label: 'Miércoles' },
  { value: 'Thursday', label: 'Jueves' },
  { value: 'Friday', label: 'Viernes' },
  { value: 'Saturday', label: 'Sábado' },
  { value: 'Sunday', label: 'Domingo' },
];

export function CategoriesPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useGetCategories();
  const { data: teachers = [] } = useGetTeachers();
  const { data: venues = [] } = useGetVenues();
  const create = useCreateFullCategory();
  const update = useUpdateCategory();
  const [createOpen, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      birth_year: (new Date().getFullYear() - 10).toString(),
      color: '',
      monthly_fee: 0,
      teacher_ids: [] as string[],
      days: [] as string[],
      start_time: '',
      venue_id: '',
      recurrence_weeks: 16,
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Requerido'),
      birth_year: (v) => (v ? null : 'Requerido'),
      // El horario es opcional, pero si se eligen días hay que decir a qué hora
      // y por cuántas semanas: sin eso el servidor no puede generar sesiones.
      start_time: (v, vals) =>
        vals.days.length > 0 && !v ? 'Indica la hora de inicio' : null,
      recurrence_weeks: (v, vals) =>
        vals.days.length > 0 && !v ? 'Indica cuántas semanas generar' : null,
    },
  });

  const editForm = useForm<any>({ initialValues: {} });

  const hasSchedule = form.values.days.length > 0;

  const onCreate = async (v: typeof form.values) => {
    const withSchedule = v.days.length > 0;
    try {
      await create.mutateAsync({
        name: v.name.trim(),
        birth_year: Number(v.birth_year),
        color: v.color || undefined,
        monthly_fee: v.monthly_fee || 0,
        teacher_ids: v.teacher_ids.length ? v.teacher_ids : undefined,
        days: withSchedule ? v.days : undefined,
        start_time: withSchedule ? v.start_time : undefined,
        venue_id: v.venue_id || null,
        recurrence_weeks: withSchedule ? Number(v.recurrence_weeks) : undefined,
      });
      notifications.show({
        color: 'green',
        message: withSchedule
          ? `Categoría creada con su horario y ${v.recurrence_weeks} semanas de sesiones`
          : 'Categoría creada',
      });
      form.reset();
      close();
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: e?.response?.data?.error || 'Error al crear la categoría',
      });
    }
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
        <EmptyState
          description="Aún no has creado categorías. Empieza por la primera: puedes dejar listo su horario y sus sesiones en un solo paso."
          action={
            <Button leftSection={<IconPlus size={16} />} onClick={open} mt="sm">
              Crear mi primera categoría
            </Button>
          }
        />
      ) : (
        <Card withBorder padding={0} radius="md">
          <Table.ScrollContainer minWidth={620}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Año</Table.Th>
                  <Table.Th>Mensualidad</Table.Th>
                  <Table.Th>Profesor</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {categories.map((c: any) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Group gap="xs">
                        {c.color && (
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: c.color,
                            }}
                          />
                        )}
                        <Text fw={500}>{c.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{c.birth_year}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {c.monthly_fee ? (
                        <Text size="sm">${c.monthly_fee}</Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>{c.teacher?.full_name || '—'}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => navigate(`/admin/categories/${c.id}`)}
                          aria-label="Ver detalle"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" onClick={() => startEdit(c)} aria-label="Editar">
                          <IconEdit size={16} />
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

      <Modal opened={createOpen} onClose={close} title="Nueva categoría" centered size="lg">
        <form onSubmit={form.onSubmit(onCreate)}>
          <Stack>
            <TextInput
              label="Nombre"
              placeholder="Sub-12"
              required
              {...form.getInputProps('name')}
            />
            <Group grow>
              <Select
                label="Año de nacimiento"
                required
                data={YEARS}
                searchable
                {...form.getInputProps('birth_year')}
              />
              <NumberInput
                label="Mensualidad"
                prefix="$"
                min={0}
                thousandSeparator=","
                {...form.getInputProps('monthly_fee')}
              />
            </Group>
            <Group grow>
              <ColorInput
                label="Color (opcional)"
                format="hex"
                swatches={['#006d35', '#1971c2', '#d9480f', '#862e9c', '#c92a2a', '#343a40']}
                {...form.getInputProps('color')}
              />
              <MultiSelect
                label="Profesores"
                placeholder="Uno o más"
                searchable
                data={teachers.map((t: any) => ({ value: t.id, label: t.full_name }))}
                {...form.getInputProps('teacher_ids')}
              />
            </Group>

            <Divider
              my="xs"
              label={
                <Group gap={6}>
                  <IconCalendarPlus size={14} />
                  <Text size="xs">Horario (opcional)</Text>
                </Group>
              }
              labelPosition="center"
            />

            <MultiSelect
              label="Días de entrenamiento"
              placeholder="Ej. martes y jueves"
              data={DAYS}
              {...form.getInputProps('days')}
            />
            {hasSchedule && (
              <>
                <Group grow>
                  <TimeInput
                    label="Hora de inicio"
                    required
                    {...form.getInputProps('start_time')}
                  />
                  <NumberInput
                    label="Semanas a generar"
                    min={1}
                    max={52}
                    required
                    {...form.getInputProps('recurrence_weeks')}
                  />
                </Group>
                <Select
                  label="Cancha"
                  placeholder="Sin cancha asignada"
                  clearable
                  data={venues.map((v: any) => ({ value: v.id, label: v.name }))}
                  {...form.getInputProps('venue_id')}
                />
                <Alert variant="light" icon={<IconCalendarPlus size={16} />}>
                  Se crearán las sesiones de {form.values.days.length}{' '}
                  {form.values.days.length === 1 ? 'día' : 'días'} por semana durante{' '}
                  {form.values.recurrence_weeks || 0} semanas. Podrás cancelar sesiones
                  sueltas desde la Agenda.
                </Alert>
              </>
            )}

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
