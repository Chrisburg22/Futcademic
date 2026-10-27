import {
  Autocomplete,
  ColorInput,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { ANIOS_SUGERIDOS, COLORES_CATEGORIA, ESTADOS_CATEGORIA } from '../../../lib/categories';
import type { CategoryStatus } from '../../../types';

export interface CategoryFormValues {
  name: string;
  description: string;
  color: string;
  birth_year: string;
  teacher_ids: string[];
  monthly_fee: number | string;
  max_students: number | string;
  status: CategoryStatus;
}

export const valoresInicialesCategoria = (): CategoryFormValues => ({
  name: '',
  description: '',
  color: COLORES_CATEGORIA[0],
  birth_year: String(new Date().getFullYear() - 10),
  teacher_ids: [],
  monthly_fee: 0,
  max_students: '',
  status: 'activa',
});

/**
 * Validación compartida por el modal de edición y el paso 1 del asistente.
 * Antes el formulario no declaraba ninguna y los errores solo se veían como un
 * 400 silencioso con el modal abierto.
 */
export const validacionIdentidad = {
  name: (valor: string) => {
    const limpio = (valor || '').trim();
    if (limpio.length < 2) return 'El nombre necesita al menos 2 caracteres';
    if (limpio.length > 60) return 'Máximo 60 caracteres';
    return null;
  },
  birth_year: (valor: string) => {
    const limpio = (valor || '').trim();
    if (!limpio) return 'Indica la generación';
    if (limpio.length > 40) return 'Máximo 40 caracteres';
    return null;
  },
  color: (valor: string) =>
    !valor || /^#[0-9a-fA-F]{6}$/.test(valor) ? null : 'Usa un color en formato #RRGGBB',
  description: (valor: string) =>
    (valor || '').length > 500 ? 'Máximo 500 caracteres' : null,
};

export const validacionEquipo = {
  monthly_fee: (valor: number | string) =>
    valor === '' || Number(valor) >= 0 ? null : 'La mensualidad no puede ser negativa',
  max_students: (valor: number | string) =>
    valor === '' || Number(valor) >= 1 ? null : 'El aforo debe ser al menos 1',
};

/** Convierte los valores del formulario al cuerpo que espera la API. */
export const aPayloadCategoria = (valores: CategoryFormValues) => ({
  name: valores.name.trim(),
  description: valores.description.trim() || null,
  color: valores.color || null,
  birth_year: valores.birth_year.trim(),
  teacher_ids: valores.teacher_ids,
  monthly_fee: valores.monthly_fee === '' ? 0 : Number(valores.monthly_fee),
  max_students: valores.max_students === '' ? null : Number(valores.max_students),
  status: valores.status,
});

type Props = {
  form: UseFormReturnType<any>;
  teachers?: { id: string; full_name?: string | null }[];
  mostrarEstado?: boolean;
};

export function CamposIdentidad({ form }: Pick<Props, 'form'>) {
  return (
    <Stack>
      <TextInput
        label="Nombre"
        placeholder="Sub-10"
        required
        data-autofocus
        {...form.getInputProps('name')}
      />
      {/* Texto libre a propósito: la academia agrupa generaciones ("2014-2015")
          y usa grupos sin año ("Porteros"). Los años solo son sugerencias. */}
      <Autocomplete
        label="Generación"
        description="Un año, un rango o un grupo. Ej.: 2015, 2014-2015, Porteros"
        placeholder="2015"
        data={ANIOS_SUGERIDOS}
        required
        {...form.getInputProps('birth_year')}
      />
      <ColorInput
        label="Color"
        description="Identifica la categoría en listados y calendarios"
        format="hex"
        swatches={COLORES_CATEGORIA}
        swatchesPerRow={6}
        {...form.getInputProps('color')}
      />
      <Textarea
        label="Descripción (opcional)"
        placeholder="Entrenan en la cancha techada; nivel iniciación"
        autosize
        minRows={2}
        maxRows={4}
        {...form.getInputProps('description')}
      />
    </Stack>
  );
}

export function CamposEquipo({ form, teachers = [], mostrarEstado }: Props) {
  return (
    <Stack>
      <MultiSelect
        label="Entrenadores"
        placeholder={teachers.length ? 'Selecciona uno o más' : 'Sin profesores registrados'}
        data={teachers.map((t) => ({ value: t.id, label: t.full_name || 'Sin nombre' }))}
        searchable
        clearable
        disabled={teachers.length === 0}
        {...form.getInputProps('teacher_ids')}
      />
      <Group grow align="flex-start">
        <NumberInput
          label="Mensualidad"
          description="Se usa para calcular la deuda de cada alumno"
          min={0}
          prefix="$"
          thousandSeparator=","
          {...form.getInputProps('monthly_fee')}
        />
        <NumberInput
          label="Aforo (opcional)"
          description="Máximo de jugadores"
          min={1}
          {...form.getInputProps('max_students')}
        />
      </Group>
      {mostrarEstado && (
        <Select
          label="Estado"
          data={Object.entries(ESTADOS_CATEGORIA).map(([value, meta]) => ({
            value,
            label: meta.label,
          }))}
          description={ESTADOS_CATEGORIA[form.values.status as CategoryStatus]?.ayuda}
          allowDeselect={false}
          {...form.getInputProps('status')}
        />
      )}
    </Stack>
  );
}

/** Formulario completo en un solo bloque, para el modal de edición. */
export function CategoryFormFields({ form, teachers, mostrarEstado }: Props) {
  return (
    <Stack>
      <CamposIdentidad form={form} />
      <CamposEquipo form={form} teachers={teachers} mostrarEstado={mostrarEstado} />
    </Stack>
  );
}
