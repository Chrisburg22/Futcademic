import dayjs from 'dayjs';
import type { Student, StudentStatus } from '../types';

export const ESTADOS_ALUMNO: Record<
  StudentStatus,
  { label: string; corto: string; color: string; ayuda: string }
> = {
  activo: {
    label: 'Activo',
    corto: 'Activo',
    color: 'green',
    ayuda: 'Entrena y paga su mensualidad con normalidad.',
  },
  pendiente_pago: {
    label: 'Pendiente de pago',
    corto: 'Pend. pago',
    color: 'orange',
    ayuda: 'Sigue entrenando, pero tiene una mensualidad por cobrar.',
  },
  becado: {
    label: 'Becado',
    corto: 'Becado',
    color: 'violet',
    ayuda: 'Entrena con beca: no genera deuda de mensualidad.',
  },
  inactivo: {
    label: 'Inactivo',
    corto: 'Inactivo',
    color: 'gray',
    ayuda: 'Pausado o dado de baja sin borrar su historial.',
  },
};

export const OPCIONES_ESTADO = (Object.keys(ESTADOS_ALUMNO) as StudentStatus[]).map((value) => ({
  value,
  label: ESTADOS_ALUMNO[value].label,
}));

/**
 * `schema.sql` declara `beca` y `pendiente`, pero el controlador escribe
 * `becado` y `pendiente_pago`. Se aceptan ambos para no mostrar un estado
 * desconocido si la base trae los valores antiguos.
 */
export const normalizarEstado = (estado?: string | null): StudentStatus => {
  if (estado === 'beca') return 'becado';
  if (estado === 'pendiente') return 'pendiente_pago';
  if (estado && estado in ESTADOS_ALUMNO) return estado as StudentStatus;
  return 'activo';
};

/** Estados que calcula la vista `student_expediente_status`. */
export const ESTADOS_EXPEDIENTE = {
  completo: { label: 'Completo', color: 'green' },
  en_revision: { label: 'En revisión', color: 'yellow' },
  incompleto: { label: 'Incompleto', color: 'orange' },
  sin_tutor: { label: 'Sin tutor', color: 'gray' },
} as const;

export const OPCIONES_EXPEDIENTE = [
  { value: 'completo', label: 'Completo' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'incompleto', label: 'Incompleto' },
  { value: 'sin_tutor', label: 'Sin tutor' },
];

/** Los siete documentos obligatorios de la vista del expediente. */
export const DOCUMENTOS: Record<string, string> = {
  acta_nacimiento: 'Acta de nacimiento',
  curp: 'CURP',
  identificacion_tutor_frente: 'Identificación del tutor (frente)',
  identificacion_tutor_reverso: 'Identificación del tutor (reverso)',
  comprobante_domicilio: 'Comprobante de domicilio',
  certificado_medico: 'Certificado médico',
  foto_alumno: 'Foto del alumno',
};

export const nombreDocumento = (clave: string) =>
  DOCUMENTOS[clave] || clave.replace(/_/g, ' ');

export const iniciales = (nombre?: string | null) =>
  (nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

/** Edad en años cumplidos, o `null` si no hay fecha válida. */
export const calcularEdad = (fechaNacimiento?: string | null) => {
  if (!fechaNacimiento) return null;
  const nacimiento = dayjs(fechaNacimiento);
  if (!nacimiento.isValid()) return null;
  return dayjs().diff(nacimiento, 'year');
};

export const anioNacimiento = (fechaNacimiento?: string | null) => {
  const nacimiento = dayjs(fechaNacimiento);
  return fechaNacimiento && nacimiento.isValid() ? String(nacimiento.year()) : null;
};

export const nombreTutor = (alumno: Pick<Student, 'parent'>) =>
  alumno.parent?.full_name ||
  [(alumno.parent as any)?.first_name, (alumno.parent as any)?.last_name]
    .filter(Boolean)
    .join(' ') ||
  null;

// ── Filtros y orden del listado ───────────────────────────────────────────

export type FiltrosAlumnos = {
  busqueda: string;
  categoria: string | null;
  estado: StudentStatus | null;
  expediente: string | null;
  uniforme: 'entregado' | 'pendiente' | null;
  anio: string | null;
  tutor: 'con' | 'sin' | null;
};

export const FILTROS_VACIOS: FiltrosAlumnos = {
  busqueda: '',
  categoria: null,
  estado: null,
  expediente: null,
  uniforme: null,
  anio: null,
  tutor: null,
};

/** Cuántos filtros hay activos (sin contar la búsqueda de texto). */
export const contarFiltros = (f: FiltrosAlumnos) =>
  [f.categoria, f.estado, f.expediente, f.uniforme, f.anio, f.tutor].filter(Boolean).length;

export const hayFiltros = (f: FiltrosAlumnos) => contarFiltros(f) > 0 || !!f.busqueda.trim();

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const filtrarAlumnos = (alumnos: Student[], f: FiltrosAlumnos) => {
  const q = sinAcentos(f.busqueda.trim());
  return alumnos.filter((a) => {
    if (f.categoria && a.category_id !== f.categoria) return false;
    if (f.estado && normalizarEstado(a.status) !== f.estado) return false;
    if (f.expediente && (a.expediente_status || 'incompleto') !== f.expediente) return false;
    if (f.uniforme === 'entregado' && !a.uniform_delivered) return false;
    if (f.uniforme === 'pendiente' && a.uniform_delivered) return false;
    if (f.anio && anioNacimiento(a.birth_date) !== f.anio) return false;
    if (f.tutor === 'con' && !a.parent_id) return false;
    if (f.tutor === 'sin' && a.parent_id) return false;
    if (q) {
      const pajar = sinAcentos(
        [a.full_name, a.email, nombreTutor(a), a.category?.name, a.phone].filter(Boolean).join(' '),
      );
      if (!pajar.includes(q)) return false;
    }
    return true;
  });
};

export type CampoOrden = 'nombre' | 'categoria' | 'edad' | 'estado' | 'alta';
export type Orden = { campo: CampoOrden; direccion: 'asc' | 'desc' };

export const ORDEN_INICIAL: Orden = { campo: 'nombre', direccion: 'asc' };

export const OPCIONES_ORDEN: { value: string; label: string }[] = [
  { value: 'nombre:asc', label: 'Nombre (A-Z)' },
  { value: 'nombre:desc', label: 'Nombre (Z-A)' },
  { value: 'edad:asc', label: 'Edad (menor a mayor)' },
  { value: 'edad:desc', label: 'Edad (mayor a menor)' },
  { value: 'categoria:asc', label: 'Categoría (A-Z)' },
  { value: 'alta:desc', label: 'Altas recientes' },
];

const clave = (a: Student, campo: CampoOrden): string | number => {
  switch (campo) {
    case 'categoria':
      return sinAcentos(a.category?.name || '~');
    case 'edad':
      // Más joven = fecha de nacimiento más reciente.
      return -(dayjs(a.birth_date).valueOf() || 0);
    case 'estado':
      return Object.keys(ESTADOS_ALUMNO).indexOf(normalizarEstado(a.status));
    case 'alta':
      return dayjs(a.created_at).valueOf() || 0;
    default:
      return sinAcentos(a.full_name || '');
  }
};

export const ordenarAlumnos = (alumnos: Student[], orden: Orden) => {
  const signo = orden.direccion === 'asc' ? 1 : -1;
  return [...alumnos].sort((a, b) => {
    const ka = clave(a, orden.campo);
    const kb = clave(b, orden.campo);
    if (ka < kb) return -1 * signo;
    if (ka > kb) return 1 * signo;
    return sinAcentos(a.full_name || '').localeCompare(sinAcentos(b.full_name || ''));
  });
};

// ── Resumen y alertas ─────────────────────────────────────────────────────

export type ResumenAlumnos = {
  total: number;
  activos: number;
  pendientePago: number;
  becados: number;
  inactivos: number;
  expedienteIncompleto: number;
  sinTutor: number;
  sinUniforme: number;
};

export const resumirAlumnos = (alumnos: Student[]): ResumenAlumnos => {
  const resumen: ResumenAlumnos = {
    total: alumnos.length,
    activos: 0,
    pendientePago: 0,
    becados: 0,
    inactivos: 0,
    expedienteIncompleto: 0,
    sinTutor: 0,
    sinUniforme: 0,
  };
  for (const a of alumnos) {
    const estado = normalizarEstado(a.status);
    if (estado === 'activo') resumen.activos += 1;
    if (estado === 'pendiente_pago') resumen.pendientePago += 1;
    if (estado === 'becado') resumen.becados += 1;
    if (estado === 'inactivo') resumen.inactivos += 1;
    if (!a.parent_id) resumen.sinTutor += 1;
    else if (a.expediente_status === 'incompleto') resumen.expedienteIncompleto += 1;
    if (!a.uniform_delivered && estado !== 'inactivo') resumen.sinUniforme += 1;
  }
  return resumen;
};

export type Pendiente = {
  clave: string;
  mensaje: string;
  /** Pestaña de la ficha donde se resuelve. */
  destino?: 'datos' | 'expediente' | 'pagos';
  severidad: 'alta' | 'media';
};

/** Lo que falta por resolver de un alumno, ordenado por importancia. */
export const pendientesDelAlumno = (
  alumno: Student,
  opciones: { deuda?: number } = {},
): Pendiente[] => {
  const lista: Pendiente[] = [];
  const estado = normalizarEstado(alumno.status);
  if (!alumno.parent_id) {
    lista.push({
      clave: 'tutor',
      mensaje: 'No tiene tutor asignado: nadie puede ver su información ni recibir avisos.',
      destino: 'datos',
      severidad: 'alta',
    });
  } else if (alumno.expediente_status === 'incompleto') {
    const faltan = alumno.expediente_missing?.length || 0;
    lista.push({
      clave: 'expediente',
      mensaje: faltan
        ? `Al expediente le faltan ${faltan} ${faltan === 1 ? 'documento' : 'documentos'}.`
        : 'Falta el consentimiento firmado.',
      destino: 'expediente',
      severidad: 'alta',
    });
  } else if (alumno.expediente_status === 'en_revision') {
    lista.push({
      clave: 'revision',
      mensaje: 'Hay documentos por validar en el expediente.',
      destino: 'expediente',
      severidad: 'media',
    });
  }
  if ((opciones.deuda ?? 0) > 0 && estado !== 'becado') {
    lista.push({
      clave: 'pago',
      mensaje: `Debe $${Number(opciones.deuda).toLocaleString('es-MX')} de la mensualidad de este mes.`,
      destino: 'pagos',
      severidad: 'alta',
    });
  }
  if (!alumno.emergency_contact_phone) {
    lista.push({
      clave: 'emergencia',
      mensaje: 'Falta un contacto de emergencia.',
      destino: 'datos',
      severidad: 'media',
    });
  }
  if (!alumno.uniform_delivered && estado !== 'inactivo') {
    lista.push({ clave: 'uniforme', mensaje: 'Uniforme sin entregar.', severidad: 'media' });
  }
  return lista;
};

// ── Exportación ───────────────────────────────────────────────────────────

const celdaCsv = (valor: unknown) => {
  const texto = valor == null ? '' : String(valor);
  // Evita que Excel interprete una celda como fórmula.
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[",\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

export const alumnosACsv = (alumnos: Student[]) => {
  const columnas: [string, (a: Student) => unknown][] = [
    ['Nombre', (a) => a.full_name],
    ['Fecha de nacimiento', (a) => a.birth_date],
    ['Edad', (a) => calcularEdad(a.birth_date)],
    ['Categoría', (a) => a.category?.name],
    ['Estado', (a) => ESTADOS_ALUMNO[normalizarEstado(a.status)].label],
    ['Expediente', (a) => a.expediente_status],
    ['Uniforme entregado', (a) => (a.uniform_delivered ? 'Sí' : 'No')],
    ['Tutor', (a) => nombreTutor(a)],
    ['Teléfono', (a) => a.phone],
    ['Contacto de emergencia', (a) => a.emergency_contact_name],
    ['Teléfono de emergencia', (a) => a.emergency_contact_phone],
    ['Notas médicas', (a) => a.medical_notes],
  ];
  const filas = [
    columnas.map(([titulo]) => celdaCsv(titulo)).join(','),
    ...alumnos.map((a) => columnas.map(([, leer]) => celdaCsv(leer(a))).join(',')),
  ];
  // BOM para que Excel respete los acentos.
  return `﻿${filas.join('\r\n')}`;
};

// ── Recordatorio al tutor ─────────────────────────────────────────────────

export type MotivoRecordatorio = 'documentos' | 'consentimiento' | 'pago';

export const MOTIVOS_RECORDATORIO: Record<MotivoRecordatorio, string> = {
  documentos: 'Documentos del expediente',
  consentimiento: 'Consentimiento firmado',
  pago: 'Mensualidad pendiente',
};

/** Motivos que tiene sentido recordar según lo que le falta al alumno. */
export const motivosDisponibles = (
  alumno: Student,
  opciones: { deuda?: number } = {},
): MotivoRecordatorio[] => {
  const motivos: MotivoRecordatorio[] = [];
  if (alumno.parent_id && alumno.expediente_status === 'incompleto') {
    if (alumno.expediente_missing?.length) motivos.push('documentos');
    else motivos.push('consentimiento');
  }
  if ((opciones.deuda ?? 0) > 0 && normalizarEstado(alumno.status) !== 'becado') {
    motivos.push('pago');
  }
  return motivos;
};

export const construirRecordatorio = ({
  tutor,
  alumno,
  academia,
  motivos,
  faltantes = [],
  deuda = 0,
}: {
  tutor?: string | null;
  alumno: string;
  academia?: string | null;
  motivos: MotivoRecordatorio[];
  faltantes?: string[];
  deuda?: number;
}) => {
  const lineas: string[] = [];
  lineas.push(`Hola${tutor ? ` ${tutor.split(' ')[0]}` : ''}, te escribimos${academia ? ` de ${academia}` : ''} sobre ${alumno}.`);
  if (motivos.length) lineas.push('');
  if (motivos.includes('documentos')) {
    lineas.push('Nos faltan estos documentos para completar su expediente:');
    faltantes.forEach((clave) => lineas.push(`• ${nombreDocumento(clave)}`));
  }
  if (motivos.includes('consentimiento')) {
    lineas.push('Nos falta el consentimiento firmado para completar su expediente.');
  }
  if (motivos.includes('pago')) {
    lineas.push(
      `${motivos.length > 1 ? 'Además, ' : ''}tiene pendiente $${Number(deuda).toLocaleString('es-MX')} de la mensualidad de este mes.`,
    );
  }
  if (motivos.length) {
    lineas.push('', '¿Nos ayudas a resolverlo? Gracias.');
  }
  return lineas.join('\n');
};

/**
 * Enlace de WhatsApp para un teléfono mexicano. Un número de 10 dígitos
 * recibe la lada 52; uno más largo se respeta tal cual. `null` si no sirve.
 */
export const enlaceWhatsapp = (telefono: string | null | undefined, mensaje: string) => {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const numero = digitos.length === 10 ? `52${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};
