'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Divider,
  Group,
  List,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconAlertTriangle, IconDeviceFloppy, IconHeartbeat, IconPhoneCall, IconUser, IconUsers } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useUpdateStudent } from '../../../hooks/useStudents';
import { ActionBar } from '../../../components/common/ActionBar';
import { BirthDateInput } from '../../../components/common/BirthDateInput';
import { mensajeDeError } from '../../../lib/categories';
import { calcularEdad } from '../../../lib/students';
import type { Student } from '../../../types';

export type StudentFormValues = {
  full_name: string;
  birth_date: Date | null;
  category_id: string | null;
  parent_id: string | null;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
};

export const valoresInicialesAlumno = (alumno: Student): StudentFormValues => ({
  full_name: alumno.full_name || '',
  birth_date: alumno.birth_date ? dayjs(alumno.birth_date).toDate() : null,
  category_id: alumno.category_id || null,
  parent_id: alumno.parent_id || null,
  phone: alumno.phone || '',
  address: alumno.address || '',
  emergency_contact_name: alumno.emergency_contact_name || '',
  emergency_contact_phone: alumno.emergency_contact_phone || '',
  medical_notes: alumno.medical_notes || '',
});

const soloDigitos = (texto: string) => texto.replace(/\D/g, '');

const validarTelefono = (valor: string) => {
  if (!valor.trim()) return null;
  const digitos = soloDigitos(valor).length;
  return digitos >= 8 && digitos <= 15 ? null : 'Escribe un teléfono de 8 a 15 dígitos';
};

export const validacionAlumno = {
  full_name: (v: string) =>
    v.trim().length < 3 ? 'Escribe el nombre completo (mínimo 3 letras)' : null,
  birth_date: (v: Date | null) => {
    if (!v) return 'La fecha de nacimiento es obligatoria';
    if (dayjs(v).isAfter(dayjs(), 'day')) return 'La fecha no puede estar en el futuro';
    return null;
  },
  category_id: (v: string | null) => (v ? null : 'Elige la categoría del alumno'),
  phone: validarTelefono,
  emergency_contact_phone: (v: string, valores: StudentFormValues) =>
    validarTelefono(v) ||
    (valores.emergency_contact_name.trim() && !v.trim()
      ? 'Agrega el teléfono de este contacto'
      : null),
  emergency_contact_name: (v: string, valores: StudentFormValues) =>
    valores.emergency_contact_phone.trim() && !v.trim()
      ? 'Agrega el nombre de este contacto'
      : null,
};

/**
 * Convierte los valores del formulario en el cuerpo del PUT.
 *
 * `PUT /students/:id` lee el nombre de `fullName` (student.controller.ts), así
 * que mandar solo `full_name` dejaba el nombre sin guardar en silencio. Se
 * envían los dos nombres hasta que el backend acepte `full_name`.
 */
export const aPayloadAlumno = (v: StudentFormValues) => {
  const opcional = (texto: string) => texto.trim() || null;
  return {
    fullName: v.full_name.trim(),
    full_name: v.full_name.trim(),
    birth_date: v.birth_date ? dayjs(v.birth_date).format('YYYY-MM-DD') : undefined,
    category_id: v.category_id,
    parent_id: v.parent_id || null,
    phone: opcional(v.phone),
    address: opcional(v.address),
    emergency_contact_name: opcional(v.emergency_contact_name),
    emergency_contact_phone: opcional(v.emergency_contact_phone),
    medical_notes: opcional(v.medical_notes),
  };
};

type Props = {
  alumno: Student;
  categorias: { id: string; name: string; birth_year?: string | null }[];
  tutores: { id: string; full_name: string | null }[];
  /** Se llama tras guardar con éxito. */
  onSaved?: () => void;
  onCancel?: () => void;
  /** El formulario avisa si hay cambios sin guardar. */
  onDirtyChange?: (sucio: boolean) => void;
};

function Seccion({
  icono,
  titulo,
  ayuda,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="sm">
      <div>
        <Group gap={6}>
          {icono}
          <Text fw={600}>{titulo}</Text>
        </Group>
        {ayuda && (
          <Text size="xs" c="dimmed">
            {ayuda}
          </Text>
        )}
      </div>
      {children}
    </Stack>
  );
}

export function StudentEditForm({ alumno, categorias, tutores, onSaved, onCancel, onDirtyChange }: Props) {
  const update = useUpdateStudent();
  const form = useForm<StudentFormValues>({
    initialValues: valoresInicialesAlumno(alumno),
    validate: validacionAlumno,
    validateInputOnBlur: true,
  });

  const sucio = form.isDirty();
  useEffect(() => onDirtyChange?.(sucio), [sucio, onDirtyChange]);

  // Un cambio hecho en otra pestaña (estado, uniforme) no debe pisarse con
  // valores viejos: al llegar un alumno nuevo sin ediciones, se recarga.
  useEffect(() => {
    if (!form.isDirty()) {
      const valores = valoresInicialesAlumno(alumno);
      form.setValues(valores);
      form.resetDirty(valores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumno]);

  const edad = calcularEdad(form.values.birth_date ? dayjs(form.values.birth_date).format('YYYY-MM-DD') : null);
  const categoriaCambio = form.values.category_id !== (alumno.category_id || null);

  // Un formulario largo necesita decir de golpe qué falta: el resumen junta
  // los errores y manda el foco al primer campo que hay que corregir.
  const [errores, setErrores] = useState<{ campo: string; mensaje: string }[]>([]);

  const guardar = form.onSubmit(
    async (valores) => {
      setErrores([]);
      try {
        await update.mutateAsync({ id: alumno.id, ...aPayloadAlumno(valores) } as any);
        form.resetDirty(valores);
        notifications.show({ color: 'green', message: 'Cambios guardados' });
        onSaved?.();
      } catch (error) {
        notifications.show({
          color: 'red',
          title: 'No se pudo guardar',
          message: mensajeDeError(error, 'Revisa tu conexión e inténtalo de nuevo.'),
        });
      }
    },
    (erroresDelFormulario) => {
      const lista = Object.entries(erroresDelFormulario)
        .filter(([, mensaje]) => typeof mensaje === 'string')
        .map(([campo, mensaje]) => ({ campo, mensaje: mensaje as string }));
      setErrores(lista);
      if (lista[0]) form.getInputNode(lista[0].campo)?.focus();
    },
  );

  const opcionesCategoria = categorias.map((c) => ({
    value: c.id,
    label: c.birth_year ? `${c.name} · ${c.birth_year}` : c.name,
  }));

  return (
    <form onSubmit={guardar} noValidate>
      <Stack gap="lg">
        {errores.length > 0 && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
            title={`Faltan ${errores.length} ${errores.length === 1 ? 'dato' : 'datos'} por corregir`}
            role="alert"
          >
            <List size="sm" spacing={2}>
              {errores.map((e) => (
                <List.Item key={e.campo}>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    px={4}
                    onClick={() => form.getInputNode(e.campo)?.focus()}
                  >
                    {e.mensaje}
                  </Button>
                </List.Item>
              ))}
            </List>
          </Alert>
        )}
        <Seccion icono={<IconUser size={18} />} titulo="Datos del alumno">
          <TextInput
            label="Nombre completo"
            required
            autoCapitalize="words"
            autoComplete="off"
            {...form.getInputProps('full_name')}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <BirthDateInput
              required
              description={edad != null ? `${edad} años` : undefined}
              {...form.getInputProps('birth_date')}
            />
            <Select
              label="Categoría"
              required
              searchable
              data={opcionesCategoria}
              nothingFoundMessage="Sin coincidencias"
              {...form.getInputProps('category_id')}
            />
          </SimpleGrid>
          {categoriaCambio && (
            <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
              Al cambiar de categoría, el alumno pasa a su nueva lista de asistencia y a su
              mensualidad. Los pagos y asistencias anteriores se conservan.
            </Alert>
          )}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              description="10 dígitos, como 55 1234 5678"
              {...form.getInputProps('phone')}
            />
            <TextInput
              label="Dirección"
              autoComplete="street-address"
              {...form.getInputProps('address')}
            />
          </SimpleGrid>
        </Seccion>

        <Divider />

        <Seccion
          icono={<IconUsers size={18} />}
          titulo="Padre, madre o tutor"
          ayuda="El tutor ve la información del alumno y recibe los avisos."
        >
          <Select
            label="Tutor"
            placeholder="Sin tutor asignado"
            clearable
            searchable
            nothingFoundMessage="Sin coincidencias"
            data={tutores.map((t) => ({ value: t.id, label: t.full_name || 'Sin nombre' }))}
            {...form.getInputProps('parent_id')}
          />
        </Seccion>

        <Divider />

        <Seccion
          icono={<IconPhoneCall size={18} />}
          titulo="Contacto de emergencia"
          ayuda="A quién llamar si pasa algo durante el entrenamiento."
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Nombre"
              autoComplete="off"
              {...form.getInputProps('emergency_contact_name')}
            />
            <TextInput
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              {...form.getInputProps('emergency_contact_phone')}
            />
          </SimpleGrid>
        </Seccion>

        <Divider />

        <Seccion
          icono={<IconHeartbeat size={18} />}
          titulo="Salud"
          ayuda="Alergias, lesiones, medicamentos o cualquier cosa que el entrenador deba saber."
        >
          <Textarea
            label="Notas médicas"
            autosize
            minRows={3}
            maxRows={8}
            maxLength={1000}
            {...form.getInputProps('medical_notes')}
          />
        </Seccion>

      </Stack>

      {/*
        `ActionBar` en vez de un `Paper` a `sticky bottom: 0`: así se coloca por
        encima de la barra de navegación y del área de gestos (antes se
        solapaban), y el aviso de cambios sin guardar deja de ir a 12 px.
      */}
      <ActionBar
        variant="page"
        status={{
          text: sucio ? 'Tienes cambios sin guardar' : 'Sin cambios pendientes',
          tone: sucio ? 'warning' : 'neutral',
        }}
        secondary={
          onCancel
            ? { label: 'Cancelar', onClick: onCancel, disabled: update.isPending }
            : sucio
              ? { label: 'Descartar', onClick: () => form.reset(), disabled: update.isPending }
              : undefined
        }
        primary={{
          label: 'Guardar cambios',
          type: 'submit',
          leftIcon: <IconDeviceFloppy size={18} />,
          loading: update.isPending,
          disabled: !sucio,
        }}
      />
    </form>
  );
}
