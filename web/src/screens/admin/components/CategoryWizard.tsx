import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Stepper,
  Text,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCalendarPlus, IconInfoCircle } from '@tabler/icons-react';
import { useCreateCategory, useCreateFullCategory } from '../../../hooks/useCategories';
import { useGetVenues } from '../../../hooks/useVenues';
import { formatearGeneracion, formatearMensualidad, mensajeDeError } from '../../../lib/categories';
import {
  CamposEquipo,
  CamposIdentidad,
  aPayloadCategoria,
  valoresInicialesCategoria,
  validacionEquipo,
  validacionIdentidad,
  type CategoryFormValues,
} from './CategoryFormFields';

/** Lunes primero, aunque el valor sea el índice de `Date#getDay()`. */
const DIAS = [
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
  { value: '0', label: 'Dom' },
];

type Props = {
  opened: boolean;
  onClose: () => void;
  teachers: { id: string; full_name?: string | null }[];
};

export function CategoryWizard({ opened, onClose, teachers }: Props) {
  const [paso, setPaso] = useState(0);
  const crear = useCreateCategory();
  const crearCompleta = useCreateFullCategory();
  const { data: venues = [] } = useGetVenues();

  const form = useForm<CategoryFormValues>({
    initialValues: valoresInicialesCategoria(),
    validate: { ...validacionIdentidad, ...validacionEquipo },
  });

  const horario = useForm({
    initialValues: {
      days: [] as string[],
      start_time: '',
      venue_id: '',
      recurrence_weeks: 12,
    },
    validate: {
      start_time: (valor, valores) =>
        valores.days.length > 0 && !valor ? 'Indica la hora de entrenamiento' : null,
      recurrence_weeks: (valor) =>
        Number(valor) >= 1 && Number(valor) <= 52 ? null : 'Entre 1 y 52 semanas',
    },
  });

  const cerrar = () => {
    setPaso(0);
    form.reset();
    horario.reset();
    onClose();
  };

  const avanzarDesdeIdentidad = () => {
    const { hasErrors } = form.validate();
    if (!hasErrors) setPaso(1);
  };

  const dias = horario.values.days.map(Number).sort((a, b) => a - b);
  const conHorario = dias.length > 0;
  const sesionesPrevistas = dias.length * Number(horario.values.recurrence_weeks || 0);
  const guardando = crear.isPending || crearCompleta.isPending;

  const confirmar = async () => {
    const payload = aPayloadCategoria(form.values);
    try {
      const respuesta = conHorario
        ? await crearCompleta.mutateAsync({
            ...payload,
            days: dias,
            start_time: horario.values.start_time,
            venue_id: horario.values.venue_id || null,
            recurrence_weeks: Number(horario.values.recurrence_weeks),
          })
        : await crear.mutateAsync(payload);

      notifications.show({
        color: 'green',
        message: conHorario
          ? `Categoría creada con ${sesionesPrevistas} entrenamientos`
          : 'Categoría creada',
      });

      // `createFullCategory` crea la categoría aunque falle algo del horario.
      for (const aviso of respuesta?.warnings || []) {
        notifications.show({ color: 'yellow', message: aviso });
      }

      cerrar();
    } catch (e: any) {
      notifications.show({
        color: 'red',
        message: mensajeDeError(e, 'Error al crear la categoría'),
      });
    }
  };

  return (
    <Modal opened={opened} onClose={cerrar} title="Nueva categoría" size="lg" centered>
      <Stepper active={paso} onStepClick={setPaso} size="sm" mb="md">
        <Stepper.Step label="Identidad" description="Nombre y años" />
        <Stepper.Step label="Equipo" description="Entrenadores y cuota" />
        <Stepper.Step label="Horario" description="Opcional" />
      </Stepper>

      {paso === 0 && (
        <Stack>
          <CamposIdentidad form={form} />
          <Group justify="flex-end">
            <Button variant="default" onClick={cerrar}>
              Cancelar
            </Button>
            <Button onClick={avanzarDesdeIdentidad}>Continuar</Button>
          </Group>
        </Stack>
      )}

      {paso === 1 && (
        <Stack>
          <CamposEquipo form={form} teachers={teachers} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPaso(0)}>
              Atrás
            </Button>
            <Button onClick={() => setPaso(2)}>Continuar</Button>
          </Group>
        </Stack>
      )}

      {paso === 2 && (
        <Stack>
          <Alert icon={<IconInfoCircle size={16} />} variant="light">
            Si marcas días y hora se generan los entrenamientos de las próximas semanas. Puedes
            dejarlo en blanco y añadir el horario después desde Agenda.
          </Alert>

          <Checkbox.Group
            label="Días de entrenamiento"
            {...horario.getInputProps('days')}
          >
            <Group gap="sm" mt="xs">
              {DIAS.map((dia) => (
                <Checkbox key={dia.value} value={dia.value} label={dia.label} />
              ))}
            </Group>
          </Checkbox.Group>

          <Group grow align="flex-start">
            <TimeInput
              label="Hora de inicio"
              required={conHorario}
              {...horario.getInputProps('start_time')}
            />
            <Select
              label="Cancha (opcional)"
              data={venues.map((v: any) => ({ value: v.id, label: v.name }))}
              searchable
              clearable
              {...horario.getInputProps('venue_id')}
            />
          </Group>

          <NumberInput
            label="Semanas a generar"
            min={1}
            max={52}
            disabled={!conHorario}
            {...horario.getInputProps('recurrence_weeks')}
          />

          <Card withBorder radius="md" padding="md">
            <Text fw={600} mb="xs">
              Resumen
            </Text>
            <Group gap="xs" mb={4}>
              <Badge
                variant="light"
                leftSection={
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: form.values.color,
                    }}
                  />
                }
              >
                {form.values.name || 'Sin nombre'}
              </Badge>
              <Badge variant="light">
                {formatearGeneracion({ birth_year: form.values.birth_year })}
              </Badge>
              <Badge variant="light" color="teal">
                {formatearMensualidad(Number(form.values.monthly_fee || 0))}
              </Badge>
              <Badge variant="light" color="grape">
                {form.values.teacher_ids.length} entrenador
                {form.values.teacher_ids.length === 1 ? '' : 'es'}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {conHorario
                ? `Se generarán ${sesionesPrevistas} entrenamientos a las ${horario.values.start_time || '--:--'}.`
                : 'Sin horario: no se generan entrenamientos.'}
            </Text>
          </Card>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPaso(1)}>
              Atrás
            </Button>
            <Button
              leftSection={<IconCalendarPlus size={16} />}
              loading={guardando}
              onClick={() => {
                if (!horario.validate().hasErrors) confirmar();
              }}
            >
              Crear categoría
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
