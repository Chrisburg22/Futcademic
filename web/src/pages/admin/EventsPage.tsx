import { useState } from 'react';
import {
  Card,
  Group,
  Button,
  Modal,
  Stack,
  Select,
  TextInput,
  NumberInput,
  SegmentedControl,
  Text,
  Badge,
  ActionIcon,
  Tabs,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash, IconBan } from '@tabler/icons-react';
import dayjs from 'dayjs';
import {
  useGetEvents,
  useGetTrainings,
  useCreateEvent,
  useDeleteEvent,
  useCancelInstance,
} from '../../hooks/useEvents';
import { useGetCategories } from '../../hooks/useCategories';
import { useGetVenues } from '../../hooks/useVenues';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export function EventsPage() {
  const { data: categories = [] } = useGetCategories();
  const { data: venues = [] } = useGetVenues();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [createOpen, { open, close }] = useDisclosure(false);
  const [tab, setTab] = useState<string | null>('day');

  const dateStr = date ? dayjs(date).format('YYYY-MM-DD') : undefined;
  const { data: trainings = [], isLoading: loadingTrainings } = useGetTrainings({
    category_id: categoryId || undefined,
    date: dateStr,
  });
  const { data: events = [], isLoading: loadingEvents } = useGetEvents({
    category_id: categoryId || undefined,
  });
  const create = useCreateEvent();
  const del = useDeleteEvent();
  const cancel = useCancelInstance();

  const form = useForm({
    initialValues: {
      category_id: '',
      date: new Date(),
      start_time: '',
      type: 'entrenamiento' as 'entrenamiento' | 'partido',
      description: '',
      venue_id: '',
      recurringWeeks: 0,
    },
  });

  const onCreate = async (v: typeof form.values) => {
    await create.mutateAsync({
      category_id: v.category_id,
      date: dayjs(v.date).format('YYYY-MM-DD'),
      start_time: v.start_time || undefined,
      type: v.type,
      description: v.description || undefined,
      venue_id: v.venue_id || undefined,
      recurringWeeks: v.recurringWeeks ? Number(v.recurringWeeks) : undefined,
    });
    notifications.show({ color: 'green', message: 'Evento creado' });
    form.reset();
    close();
  };

  const confirmDelete = (id: string) =>
    modals.openConfirmModal({
      title: 'Eliminar evento',
      children: <Text size="sm">¿Eliminar este evento y todas sus instancias?</Text>,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await del.mutateAsync(id);
        notifications.show({ color: 'green', message: 'Evento eliminado' });
      },
    });

  const confirmCancel = (training: any) =>
    modals.openConfirmModal({
      title: 'Cancelar sesión',
      children: <Text size="sm">¿Cancelar esta sesión?</Text>,
      labels: { confirm: 'Cancelar sesión', cancel: 'Cerrar' },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        await cancel.mutateAsync({
          training_id: training.id,
          event_id: training.event_id,
          date: training.date,
        });
        notifications.show({ color: 'green', message: 'Sesión cancelada' });
      },
    });

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Entrenamientos y partidos"
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Nuevo evento
          </Button>
        }
      />
      <Card withBorder padding="md" radius="md" mb="md">
        <Group grow>
          <Select
            label="Categoría"
            placeholder="Todas"
            clearable
            data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
          />
          <DateInput label="Fecha" value={date} onChange={setDate} />
        </Group>
      </Card>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="day">Día seleccionado</Tabs.Tab>
          <Tabs.Tab value="recurring">Eventos base</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="day" pt="md">
          {loadingTrainings ? (
            <LoadingState />
          ) : trainings.length === 0 ? (
            <EmptyState description="Sin sesiones para este día." />
          ) : (
            <Stack>
              {trainings.map((t: any) => (
                <Card key={t.id} withBorder padding="md" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <Text fw={500}>{t.category?.name || 'Sesión'}</Text>
                        <Badge variant="light" tt="capitalize">
                          {t.type}
                        </Badge>
                        {t.cancelled && <Badge color="red">Cancelada</Badge>}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {t.start_time || '—'}
                      </Text>
                    </div>
                    {!t.cancelled && (
                      <ActionIcon
                        variant="subtle"
                        color="orange"
                        aria-label="Cancelar"
                        onClick={() => confirmCancel(t)}
                      >
                        <IconBan size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="recurring" pt="md">
          {loadingEvents ? (
            <LoadingState />
          ) : events.length === 0 ? (
            <EmptyState description="Sin eventos base." />
          ) : (
            <Stack>
              {events.map((e: any) => (
                <Card key={e.id} withBorder padding="md" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <Text fw={500}>{e.category?.name || '—'}</Text>
                        <Badge tt="capitalize" variant="light">
                          {e.type}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        Inicio: {dayjs(e.date).format('DD MMM YYYY')} {e.start_time || ''}
                      </Text>
                    </div>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Eliminar"
                      onClick={() => confirmDelete(e.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={createOpen} onClose={close} title="Nuevo evento" centered>
        <form onSubmit={form.onSubmit(onCreate)}>
          <Stack>
            <Select
              label="Categoría"
              required
              data={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              {...form.getInputProps('category_id')}
            />
            <DateInput label="Fecha" required {...form.getInputProps('date')} />
            <TimeInput label="Hora de inicio" {...form.getInputProps('start_time')} />
            <SegmentedControl
              data={[
                { value: 'entrenamiento', label: 'Entrenamiento' },
                { value: 'partido', label: 'Partido' },
              ]}
              {...form.getInputProps('type')}
            />
            <TextInput label="Descripción" {...form.getInputProps('description')} />
            <Select
              label="Cancha (opcional)"
              clearable
              data={venues.map((v: any) => ({ value: v.id, label: v.name }))}
              {...form.getInputProps('venue_id')}
            />
            <NumberInput
              label="Repetir semanas (0 = sin repetir)"
              min={0}
              max={52}
              {...form.getInputProps('recurringWeeks')}
            />
            <Button type="submit" loading={create.isPending}>
              Crear
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
