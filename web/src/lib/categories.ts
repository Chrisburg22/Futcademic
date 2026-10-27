import type { Category, CategoryStatus } from '../types';

/** Colores sugeridos para la categoría: la paleta del tema más contrastes. */
export const COLORES_CATEGORIA = [
  '#198d4b',
  '#42a067',
  '#0b7285',
  '#1971c2',
  '#5f3dc4',
  '#9c36b5',
  '#c2255c',
  '#e03131',
  '#e8590c',
  '#f08c00',
  '#5c940d',
  '#495057',
];

export const ESTADOS_CATEGORIA: Record<
  CategoryStatus,
  { label: string; color: string; ayuda: string }
> = {
  activa: {
    label: 'Activa',
    color: 'green',
    ayuda: 'Aparece en los selectores de alumnos, agenda y asistencias.',
  },
  inactiva: {
    label: 'Inactiva',
    color: 'gray',
    ayuda: 'Pausada: se conserva todo, pero deja de ofrecerse como opción nueva.',
  },
  archivada: {
    label: 'Archivada',
    color: 'orange',
    ayuda: 'Fuera del listado. El historial de asistencias y pagos se mantiene.',
  },
};

/** Años que se ofrecen como sugerencia; el campo acepta cualquier texto. */
export const ANIOS_SUGERIDOS = Array.from({ length: 25 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

/**
 * La generación tal como la escribió la academia: un año ("2015"), un rango
 * ("2014-2015") o un grupo sin año ("Porteros").
 */
export const formatearGeneracion = (categoria?: Pick<Category, 'birth_year'> | null) =>
  categoria?.birth_year?.trim() || '—';

export const formatearMensualidad = (monto?: number | null) =>
  monto == null ? '—' : `$${Number(monto).toLocaleString('es-MX')}`;

/** "12" o "12/20" cuando la categoría tiene aforo. */
export const formatearOcupacion = (
  categoria: Pick<Category, 'students_count' | 'max_students'>,
) => {
  const alumnos = categoria.students_count ?? 0;
  return categoria.max_students ? `${alumnos}/${categoria.max_students}` : String(alumnos);
};

export const estaLlena = (categoria: Pick<Category, 'students_count' | 'max_students'>) =>
  !!categoria.max_students && (categoria.students_count ?? 0) >= categoria.max_students;

/** Mensaje de error de la API, o uno genérico. */
export const mensajeDeError = (error: any, porDefecto: string) =>
  error?.response?.data?.error || porDefecto;
