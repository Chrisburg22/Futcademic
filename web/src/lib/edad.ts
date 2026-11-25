import dayjs from 'dayjs';

/**
 * Rango de edad que registra una academia.
 *
 * El mismo que aplica el backend (`api/services/validation.ts`) y que usó la
 * etapa 1 de KDD del proyecto de minería, donde salieron los 3 alumnos con edad
 * imposible que había en producción. Si los tres números dejan de coincidir, el
 * formulario deja pasar lo que la API rechaza.
 */
export const EDAD_MIN_ALUMNO = 3;
export const EDAD_MAX_ALUMNO = 18;

/** Años cumplidos a día de hoy. */
export const edadCumplida = (fecha: Date | string) => dayjs().diff(dayjs(fecha), 'year');

/** La fecha más antigua admisible: el día en que cumpliría la edad máxima. */
export const fechaNacimientoMinima = () =>
  dayjs().subtract(EDAD_MAX_ALUMNO + 1, 'year').add(1, 'day').toDate();

/** Mensaje de error, o `null` si la fecha sirve. */
export function validarFechaNacimiento(valor: Date | null): string | null {
  if (!valor) return 'La fecha de nacimiento es obligatoria';
  if (dayjs(valor).isAfter(dayjs(), 'day')) return 'La fecha no puede estar en el futuro';
  const edad = edadCumplida(valor);
  if (edad < EDAD_MIN_ALUMNO || edad > EDAD_MAX_ALUMNO) {
    return `Da ${edad} años y la academia registra de ${EDAD_MIN_ALUMNO} a ${EDAD_MAX_ALUMNO}. Revisa el año.`;
  }
  return null;
}
