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

/** Antigüedad del alta, en días. */
export type RangoAlta = '7' | '30' | '90';

export type FiltrosAlumnos = {
  busqueda: string;
  categoria: string | null;
  estado: StudentStatus | null;
  expediente: string | null;
  uniforme: 'entregado' | 'pendiente' | null;
  anio: string | null;
  tutor: 'con' | 'sin' | null;
  /** Adeudo de la mensualidad del mes en curso. */
  adeudo: 'con' | 'sin' | null;
  emergencia: 'con' | 'sin' | null;
  medicas: 'con' | 'sin' | null;
  alta: RangoAlta | null;
  /** Solo los que tienen algo urgente por resolver. */
  atencion: 'si' | null;
};

export const FILTROS_VACIOS: FiltrosAlumnos = {
  busqueda: '',
  categoria: null,
  estado: null,
  expediente: null,
  uniforme: null,
  anio: null,
  tutor: null,
  adeudo: null,
  emergencia: null,
  medicas: null,
  alta: null,
  atencion: null,
};

/**
 * Lo que el listado sabe de cada alumno y no viene en `GET /students`.
 * Hoy solo el adeudo del mes, que sale de `GET /payments/pending`.
 */
export type ContextoAlumnos = {
  deudas?: Record<string, number>;
};

const CLAVES_FILTRO: (keyof FiltrosAlumnos)[] = [
  'categoria',
  'estado',
  'expediente',
  'uniforme',
  'anio',
  'tutor',
  'adeudo',
  'emergencia',
  'medicas',
  'alta',
  'atencion',
];

/** Cuántos filtros hay activos (sin contar la búsqueda de texto). */
export const contarFiltros = (f: FiltrosAlumnos) =>
  CLAVES_FILTRO.filter((clave) => f[clave]).length;

export const hayFiltros = (f: FiltrosAlumnos) => contarFiltros(f) > 0 || !!f.busqueda.trim();

export const OPCIONES_UNIFORME = [
  { value: 'entregado', label: 'Entregado' },
  { value: 'pendiente', label: 'Por entregar' },
];

export const OPCIONES_TUTOR = [
  { value: 'con', label: 'Con tutor' },
  { value: 'sin', label: 'Sin tutor asignado' },
];

export const OPCIONES_ADEUDO = [
  { value: 'con', label: 'Con adeudo este mes' },
  { value: 'sin', label: 'Al corriente' },
];

export const OPCIONES_EMERGENCIA = [
  { value: 'con', label: 'Con contacto' },
  { value: 'sin', label: 'Sin contacto' },
];

export const OPCIONES_MEDICAS = [
  { value: 'con', label: 'Con notas médicas' },
  { value: 'sin', label: 'Sin notas médicas' },
];

export const OPCIONES_ALTA = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
];

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const conTexto = (valor?: string | null) => !!valor && valor.trim().length > 0;

export const deudaDe = (alumno: Pick<Student, 'id'>, ctx: ContextoAlumnos = {}) =>
  ctx.deudas?.[alumno.id] ?? 0;

export const filtrarAlumnos = (
  alumnos: Student[],
  f: FiltrosAlumnos,
  ctx: ContextoAlumnos = {},
) => {
  const q = sinAcentos(f.busqueda.trim());
  const desdeAlta = f.alta ? dayjs().subtract(Number(f.alta), 'day') : null;
  return alumnos.filter((a) => {
    if (f.categoria && a.category_id !== f.categoria) return false;
    if (f.estado && normalizarEstado(a.status) !== f.estado) return false;
    if (f.expediente && (a.expediente_status || 'incompleto') !== f.expediente) return false;
    if (f.uniforme === 'entregado' && !a.uniform_delivered) return false;
    if (f.uniforme === 'pendiente' && a.uniform_delivered) return false;
    if (f.anio && anioNacimiento(a.birth_date) !== f.anio) return false;
    if (f.tutor === 'con' && !a.parent_id) return false;
    if (f.tutor === 'sin' && a.parent_id) return false;
    const deuda = deudaDe(a, ctx);
    if (f.adeudo === 'con' && deuda <= 0) return false;
    if (f.adeudo === 'sin' && deuda > 0) return false;
    if (f.emergencia === 'con' && !conTexto(a.emergency_contact_phone)) return false;
    if (f.emergencia === 'sin' && conTexto(a.emergency_contact_phone)) return false;
    if (f.medicas === 'con' && !conTexto(a.medical_notes)) return false;
    if (f.medicas === 'sin' && conTexto(a.medical_notes)) return false;
    if (desdeAlta) {
      const alta = a.created_at ? dayjs(a.created_at) : null;
      if (!alta?.isValid() || alta.isBefore(desdeAlta)) return false;
    }
    if (f.atencion === 'si' && !requiereAtencion(a, { deuda })) return false;
    if (q) {
      const pajar = sinAcentos(
        [
          a.full_name,
          a.email,
          nombreTutor(a),
          a.category?.name,
          a.phone,
          a.emergency_contact_name,
        ]
          .filter(Boolean)
          .join(' '),
      );
      if (!pajar.includes(q)) return false;
    }
    return true;
  });
};

/** Un filtro activo, listo para pintarse como etiqueta que se puede quitar. */
export type ChipFiltro = {
  clave: keyof FiltrosAlumnos;
  titulo: string;
  valor: string;
};

const etiquetaDe = (opciones: { value: string; label: string }[], valor: string) =>
  opciones.find((o) => o.value === valor)?.label || valor;

export const chipsDeFiltros = (
  f: FiltrosAlumnos,
  categorias: { id: string; name: string }[] = [],
): ChipFiltro[] => {
  const chips: ChipFiltro[] = [];
  if (f.busqueda.trim()) chips.push({ clave: 'busqueda', titulo: 'Busca', valor: f.busqueda.trim() });
  if (f.atencion) chips.push({ clave: 'atencion', titulo: 'Solo', valor: 'Por atender' });
  if (f.categoria) {
    chips.push({
      clave: 'categoria',
      titulo: 'Categoría',
      valor: categorias.find((c) => c.id === f.categoria)?.name || 'Categoría',
    });
  }
  if (f.estado) {
    chips.push({ clave: 'estado', titulo: 'Estado', valor: ESTADOS_ALUMNO[f.estado].label });
  }
  if (f.expediente) {
    chips.push({
      clave: 'expediente',
      titulo: 'Expediente',
      valor: etiquetaDe(OPCIONES_EXPEDIENTE, f.expediente),
    });
  }
  if (f.adeudo) {
    chips.push({ clave: 'adeudo', titulo: 'Pago', valor: etiquetaDe(OPCIONES_ADEUDO, f.adeudo) });
  }
  if (f.uniforme) {
    chips.push({
      clave: 'uniforme',
      titulo: 'Uniforme',
      valor: etiquetaDe(OPCIONES_UNIFORME, f.uniforme),
    });
  }
  if (f.tutor) {
    chips.push({ clave: 'tutor', titulo: 'Tutor', valor: etiquetaDe(OPCIONES_TUTOR, f.tutor) });
  }
  if (f.emergencia) {
    chips.push({
      clave: 'emergencia',
      titulo: 'Emergencia',
      valor: etiquetaDe(OPCIONES_EMERGENCIA, f.emergencia),
    });
  }
  if (f.medicas) {
    chips.push({
      clave: 'medicas',
      titulo: 'Salud',
      valor: etiquetaDe(OPCIONES_MEDICAS, f.medicas),
    });
  }
  if (f.anio) chips.push({ clave: 'anio', titulo: 'Nacido en', valor: f.anio });
  if (f.alta) chips.push({ clave: 'alta', titulo: 'Alta', valor: etiquetaDe(OPCIONES_ALTA, f.alta) });
  return chips;
};

export type CampoOrden = 'nombre' | 'categoria' | 'edad' | 'estado' | 'alta' | 'adeudo';
export type Orden = { campo: CampoOrden; direccion: 'asc' | 'desc' };

export const ORDEN_INICIAL: Orden = { campo: 'nombre', direccion: 'asc' };

export const OPCIONES_ORDEN: { value: string; label: string }[] = [
  { value: 'nombre:asc', label: 'Nombre (A-Z)' },
  { value: 'nombre:desc', label: 'Nombre (Z-A)' },
  { value: 'edad:asc', label: 'Edad (menor a mayor)' },
  { value: 'edad:desc', label: 'Edad (mayor a menor)' },
  { value: 'categoria:asc', label: 'Categoría (A-Z)' },
  { value: 'adeudo:desc', label: 'Adeudo (mayor primero)' },
  { value: 'alta:desc', label: 'Altas recientes' },
];

const clave = (a: Student, campo: CampoOrden, ctx: ContextoAlumnos): string | number => {
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
    case 'adeudo':
      return deudaDe(a, ctx);
    default:
      return sinAcentos(a.full_name || '');
  }
};

export const ordenarAlumnos = (alumnos: Student[], orden: Orden, ctx: ContextoAlumnos = {}) => {
  const signo = orden.direccion === 'asc' ? 1 : -1;
  return [...alumnos].sort((a, b) => {
    const ka = clave(a, orden.campo, ctx);
    const kb = clave(b, orden.campo, ctx);
    if (ka < kb) return -1 * signo;
    if (ka > kb) return 1 * signo;
    return sinAcentos(a.full_name || '').localeCompare(sinAcentos(b.full_name || ''));
  });
};

// ── Estado en la URL ──────────────────────────────────────────────────────
//
// Los filtros viven en el query string para poder compartir una vista, volver
// atrás sin perderla y enlazar desde Inicio ("ver los 4 sin tutor").

const PARAMETROS: Record<string, keyof FiltrosAlumnos> = {
  q: 'busqueda',
  categoria: 'categoria',
  estado: 'estado',
  expediente: 'expediente',
  uniforme: 'uniforme',
  anio: 'anio',
  tutor: 'tutor',
  adeudo: 'adeudo',
  emergencia: 'emergencia',
  medicas: 'medicas',
  alta: 'alta',
  atencion: 'atencion',
};

export type EstadoListado = { filtros: FiltrosAlumnos; orden: Orden; pagina: number };

export const leerEstadoDeUrl = (busqueda: string): EstadoListado => {
  const params = new URLSearchParams(busqueda);
  const filtros = { ...FILTROS_VACIOS };
  for (const [param, campo] of Object.entries(PARAMETROS)) {
    const valor = params.get(param);
    if (valor) (filtros as Record<string, unknown>)[campo] = valor;
  }
  const [campo, direccion] = (params.get('orden') || '').split(':');
  const orden: Orden =
    campo && direccion
      ? { campo: campo as CampoOrden, direccion: direccion === 'desc' ? 'desc' : 'asc' }
      : ORDEN_INICIAL;
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  return { filtros, orden, pagina };
};

export const escribirEstadoEnUrl = ({ filtros, orden, pagina }: EstadoListado) => {
  const params = new URLSearchParams();
  for (const [param, campo] of Object.entries(PARAMETROS)) {
    const valor = filtros[campo];
    if (typeof valor === 'string' && valor.trim()) params.set(param, valor.trim());
  }
  if (orden.campo !== ORDEN_INICIAL.campo || orden.direccion !== ORDEN_INICIAL.direccion) {
    params.set('orden', `${orden.campo}:${orden.direccion}`);
  }
  if (pagina > 1) params.set('pagina', String(pagina));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};

/** Enlace al listado con un filtro ya puesto, para los avisos de Inicio. */
export const enlaceAlListado = (filtros: Partial<FiltrosAlumnos>) =>
  `/admin/students${escribirEstadoEnUrl({
    filtros: { ...FILTROS_VACIOS, ...filtros },
    orden: ORDEN_INICIAL,
    pagina: 1,
  })}`;

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
  conAdeudo: number;
  /** Suma de lo que falta por cobrar este mes. */
  adeudoTotal: number;
  sinEmergencia: number;
  /** Altas de los últimos 30 días. */
  nuevos: number;
  /** Alumnos con al menos un pendiente urgente. */
  porAtender: number;
};

export const resumirAlumnos = (
  alumnos: Student[],
  ctx: ContextoAlumnos = {},
): ResumenAlumnos => {
  const resumen: ResumenAlumnos = {
    total: alumnos.length,
    activos: 0,
    pendientePago: 0,
    becados: 0,
    inactivos: 0,
    expedienteIncompleto: 0,
    sinTutor: 0,
    sinUniforme: 0,
    conAdeudo: 0,
    adeudoTotal: 0,
    sinEmergencia: 0,
    nuevos: 0,
    porAtender: 0,
  };
  const hace30 = dayjs().subtract(30, 'day');
  for (const a of alumnos) {
    const estado = normalizarEstado(a.status);
    if (estado === 'activo') resumen.activos += 1;
    if (estado === 'pendiente_pago') resumen.pendientePago += 1;
    if (estado === 'becado') resumen.becados += 1;
    if (estado === 'inactivo') resumen.inactivos += 1;
    if (!a.parent_id) resumen.sinTutor += 1;
    else if (a.expediente_status === 'incompleto') resumen.expedienteIncompleto += 1;
    if (!a.uniform_delivered && estado !== 'inactivo') resumen.sinUniforme += 1;
    const deuda = deudaDe(a, ctx);
    if (deuda > 0) {
      resumen.conAdeudo += 1;
      resumen.adeudoTotal += deuda;
    }
    if (!a.emergency_contact_phone && estado !== 'inactivo') resumen.sinEmergencia += 1;
    if (a.created_at && dayjs(a.created_at).isAfter(hace30)) resumen.nuevos += 1;
    if (requiereAtencion(a, { deuda })) resumen.porAtender += 1;
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

/**
 * ¿Hay algo urgente? Un alumno inactivo no "requiere atención": dejó de
 * entrenar, así que su expediente o su uniforme ya no urgen.
 */
export const requiereAtencion = (alumno: Student, opciones: { deuda?: number } = {}) => {
  if (normalizarEstado(alumno.status) === 'inactivo') return false;
  return pendientesDelAlumno(alumno, opciones).some((p) => p.severidad === 'alta');
};

// ── Exportación ───────────────────────────────────────────────────────────

const celdaCsv = (valor: unknown) => {
  const texto = valor == null ? '' : String(valor);
  // Evita que Excel interprete una celda como fórmula.
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[",\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

export const alumnosACsv = (alumnos: Student[], ctx: ContextoAlumnos = {}) => {
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
    ['Adeudo del mes', (a) => deudaDe(a, ctx) || 0],
    ['Fecha de alta', (a) => (a.created_at ? dayjs(a.created_at).format('YYYY-MM-DD') : null)],
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
