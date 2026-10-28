import dayjs from 'dayjs';
import type { Attendance, Student } from '../types';

export type TipoSesion = 'entrenamiento' | 'partido';

export const TIPOS_SESION: { value: TipoSesion; label: string; corto: string }[] = [
  { value: 'entrenamiento', label: 'Entrenamiento', corto: 'Entreno' },
  { value: 'partido', label: 'Partido', corto: 'Partido' },
];

export const etiquetaTipo = (tipo?: string | null) =>
  TIPOS_SESION.find((t) => t.value === tipo)?.label || 'Sesión';

// ── Marcas del pase de lista ──────────────────────────────────────────────
//
// `attendances.present` es un booleano, así que la base solo distingue
// presente de ausente. «Sin marcar» existe únicamente en la pantalla: es la
// diferencia entre "faltó" y "nadie pasó lista", y por eso no se guarda sola
// (ver `MarcasPorAlumno`).

export type Marca = 'presente' | 'ausente' | 'sin_marcar';

export const MARCAS: Record<Marca, { label: string; corto: string; color: string }> = {
  presente: { label: 'Presente', corto: 'Asistió', color: 'green' },
  ausente: { label: 'Ausente', corto: 'Faltó', color: 'red' },
  sin_marcar: { label: 'Sin marcar', corto: 'Sin marcar', color: 'gray' },
};

/** Lo marcado en la pantalla; un alumno ausente de este mapa está sin marcar. */
export type MarcasPorAlumno = Record<string, boolean>;

export const marcaDe = (marcas: MarcasPorAlumno, studentId: string): Marca => {
  const valor = marcas[studentId];
  if (valor === undefined) return 'sin_marcar';
  return valor ? 'presente' : 'ausente';
};

/** Las marcas ya guardadas de una fecha y tipo, listas para precargar. */
export const marcasDeRegistros = (
  registros: Attendance[],
  tipo: TipoSesion,
  fecha: string,
): MarcasPorAlumno => {
  const marcas: MarcasPorAlumno = {};
  for (const r of registros) {
    if (r.type !== tipo) continue;
    if (dayjs(r.date).format('YYYY-MM-DD') !== fecha) continue;
    marcas[r.student_id] = !!r.present;
  }
  return marcas;
};

/**
 * ¿Son las mismas marcas? Los mapas se recalculan en cada render, así que
 * comparar por contenido es lo que evita un bucle de `setState`.
 */
export const mismasMarcas = (a: MarcasPorAlumno, b: MarcasPorAlumno) => {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((clave) => a[clave] === b[clave]);
};

export type ResumenPaseLista = {
  total: number;
  presentes: number;
  ausentes: number;
  sinMarcar: number;
  /** Porcentaje sobre los alumnos ya marcados. */
  porcentaje: number;
};

export const resumirPaseLista = (
  alumnos: Pick<Student, 'id'>[],
  marcas: MarcasPorAlumno,
): ResumenPaseLista => {
  let presentes = 0;
  let ausentes = 0;
  for (const a of alumnos) {
    const marca = marcaDe(marcas, a.id);
    if (marca === 'presente') presentes += 1;
    else if (marca === 'ausente') ausentes += 1;
  }
  const marcados = presentes + ausentes;
  return {
    total: alumnos.length,
    presentes,
    ausentes,
    sinMarcar: alumnos.length - marcados,
    porcentaje: marcados ? Math.round((presentes / marcados) * 100) : 0,
  };
};

// ── Historial por alumno ──────────────────────────────────────────────────

/** Cómo se lee un porcentaje de asistencia: color y etiqueta compartidos. */
export const nivelAsistencia = (porcentaje: number) => {
  if (porcentaje >= 85) return { color: 'green', label: 'Constante' };
  if (porcentaje >= 70) return { color: 'teal', label: 'Regular' };
  if (porcentaje >= 50) return { color: 'yellow', label: 'Irregular' };
  return { color: 'red', label: 'En riesgo' };
};

/** Faltas seguidas a partir de las cuales conviene llamar al tutor. */
export const FALTAS_SEGUIDAS_RIESGO = 3;
/** Asistencia mínima aceptable, y mínimo de sesiones para poder juzgarla. */
export const PORCENTAJE_RIESGO = 60;
export const SESIONES_MINIMAS_RIESGO = 4;

export type RegistroAlumno = {
  id: string;
  date: string;
  type: string;
  present: boolean;
};

export type EstadisticaAlumno = {
  studentId: string;
  nombre: string;
  sesiones: number;
  asistidas: number;
  faltas: number;
  porcentaje: number;
  /** Última sesión a la que sí asistió. */
  ultimaAsistencia: string | null;
  /** Última sesión registrada, haya venido o no. */
  ultimoRegistro: string | null;
  /** Faltas consecutivas contando desde la sesión más reciente. */
  faltasSeguidas: number;
  /** Las últimas sesiones, de la más vieja a la más nueva, para la tendencia. */
  tendencia: boolean[];
  enRiesgo: boolean;
};

const nombreDeRegistro = (r: any): string =>
  r.student?.full_name ||
  [r.student?.first_name, r.student?.last_name].filter(Boolean).join(' ') ||
  'Alumno sin nombre';

/** Orden cronológico ascendente; empata por id para que sea estable. */
const porFecha = (a: { date: string; id: string }, b: { date: string; id: string }) =>
  a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date);

export const estadisticaDeRegistros = (
  registros: RegistroAlumno[],
  datos: { studentId: string; nombre: string },
): EstadisticaAlumno => {
  const ordenados = [...registros].sort(porFecha);
  const asistidas = ordenados.filter((r) => r.present).length;
  const sesiones = ordenados.length;
  let faltasSeguidas = 0;
  for (let i = ordenados.length - 1; i >= 0; i -= 1) {
    if (ordenados[i].present) break;
    faltasSeguidas += 1;
  }
  const ultimaAsistencia = [...ordenados].reverse().find((r) => r.present)?.date || null;
  const porcentaje = sesiones ? Math.round((asistidas / sesiones) * 100) : 0;
  return {
    studentId: datos.studentId,
    nombre: datos.nombre,
    sesiones,
    asistidas,
    faltas: sesiones - asistidas,
    porcentaje,
    ultimaAsistencia,
    ultimoRegistro: ordenados.at(-1)?.date || null,
    faltasSeguidas,
    tendencia: ordenados.slice(-8).map((r) => r.present),
    enRiesgo:
      faltasSeguidas >= FALTAS_SEGUIDAS_RIESGO ||
      (sesiones >= SESIONES_MINIMAS_RIESGO && porcentaje < PORCENTAJE_RIESGO),
  };
};

/** Una fila por alumno con registros; el nombre sale del propio registro. */
export const estadisticasPorAlumno = (registros: Attendance[]): EstadisticaAlumno[] => {
  const grupos = new Map<string, { nombre: string; registros: RegistroAlumno[] }>();
  for (const r of registros) {
    const grupo = grupos.get(r.student_id) || { nombre: nombreDeRegistro(r), registros: [] };
    grupo.registros.push({
      id: r.id,
      date: dayjs(r.date).format('YYYY-MM-DD'),
      type: r.type,
      present: !!r.present,
    });
    grupos.set(r.student_id, grupo);
  }
  return [...grupos.entries()].map(([studentId, grupo]) =>
    estadisticaDeRegistros(grupo.registros, { studentId, nombre: grupo.nombre }),
  );
};

/** Asistencia por mes, de la más reciente a la más vieja. */
export type MesAsistencia = {
  mes: string;
  etiqueta: string;
  sesiones: number;
  asistidas: number;
  porcentaje: number;
};

export const asistenciaPorMes = (registros: RegistroAlumno[], meses = 6): MesAsistencia[] => {
  const grupos = new Map<string, { sesiones: number; asistidas: number }>();
  for (const r of registros) {
    const mes = dayjs(r.date).format('YYYY-MM');
    const grupo = grupos.get(mes) || { sesiones: 0, asistidas: 0 };
    grupo.sesiones += 1;
    if (r.present) grupo.asistidas += 1;
    grupos.set(mes, grupo);
  }
  return [...grupos.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, meses)
    .map(([mes, grupo]) => ({
      mes,
      etiqueta: dayjs(`${mes}-01`).format('MMM YYYY'),
      sesiones: grupo.sesiones,
      asistidas: grupo.asistidas,
      porcentaje: grupo.sesiones ? Math.round((grupo.asistidas / grupo.sesiones) * 100) : 0,
    }));
};

// ── Sesiones del histórico de una categoría ───────────────────────────────

export type SesionHistorica = {
  clave: string;
  date: string;
  type: string;
  presentes: number;
  ausentes: number;
  total: number;
  porcentaje: number;
  registros: Attendance[];
};

export const sesionesDeRegistros = (registros: Attendance[]): SesionHistorica[] => {
  const grupos = new Map<string, SesionHistorica>();
  for (const r of registros) {
    const fecha = dayjs(r.date).format('YYYY-MM-DD');
    const clave = `${fecha}|${r.type}`;
    const sesion =
      grupos.get(clave) ||
      ({
        clave,
        date: fecha,
        type: r.type,
        presentes: 0,
        ausentes: 0,
        total: 0,
        porcentaje: 0,
        registros: [],
      } as SesionHistorica);
    sesion.registros.push(r);
    sesion.total += 1;
    if (r.present) sesion.presentes += 1;
    else sesion.ausentes += 1;
    grupos.set(clave, sesion);
  }
  return [...grupos.values()]
    .map((s) => ({
      ...s,
      porcentaje: s.total ? Math.round((s.presentes / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.clave.localeCompare(a.clave));
};

// ── Filtros del histórico ─────────────────────────────────────────────────

export type Periodo = '30' | '90' | 'temporada' | 'todo';

export const OPCIONES_PERIODO: { value: Periodo; label: string }[] = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: 'temporada', label: 'Temporada actual' },
  { value: 'todo', label: 'Todo el historial' },
];

/** Primer día incluido en el periodo; `null` = sin límite. */
export const inicioDePeriodo = (periodo: Periodo) => {
  if (periodo === 'todo') return null;
  if (periodo === 'temporada') return dayjs().startOf('year');
  return dayjs().subtract(Number(periodo), 'day').startOf('day');
};

export const enPeriodo = (fecha: string, periodo: Periodo) => {
  const desde = inicioDePeriodo(periodo);
  if (!desde) return true;
  const dia = dayjs(fecha);
  return dia.isValid() && !dia.isBefore(desde, 'day');
};

export const filtrarRegistros = (
  registros: Attendance[],
  filtros: { periodo: Periodo; tipo: TipoSesion | null },
) =>
  registros.filter((r) => {
    if (filtros.tipo && r.type !== filtros.tipo) return false;
    return enPeriodo(dayjs(r.date).format('YYYY-MM-DD'), filtros.periodo);
  });

export type ResumenCategoria = {
  sesiones: number;
  alumnos: number;
  marcas: number;
  asistencias: number;
  porcentaje: number;
  enRiesgo: number;
};

export const resumirCategoria = (
  registros: Attendance[],
  estadisticas: EstadisticaAlumno[],
): ResumenCategoria => {
  const sesiones = new Set(
    registros.map((r) => `${dayjs(r.date).format('YYYY-MM-DD')}|${r.type}`),
  ).size;
  const asistencias = registros.filter((r) => r.present).length;
  return {
    sesiones,
    alumnos: estadisticas.length,
    marcas: registros.length,
    asistencias,
    porcentaje: registros.length ? Math.round((asistencias / registros.length) * 100) : 0,
    enRiesgo: estadisticas.filter((e) => e.enRiesgo).length,
  };
};

// ── Orden de la tabla por alumno ──────────────────────────────────────────

export type CampoOrdenAsistencia = 'nombre' | 'porcentaje' | 'faltas' | 'seguidas' | 'ultima';

export type OrdenAsistencia = { campo: CampoOrdenAsistencia; direccion: 'asc' | 'desc' };

export const ORDEN_ASISTENCIA_INICIAL: OrdenAsistencia = { campo: 'porcentaje', direccion: 'asc' };

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const coincide = (texto: string | null | undefined, busqueda: string) =>
  !busqueda.trim() || sinAcentos(texto || '').includes(sinAcentos(busqueda.trim()));

export const ordenarEstadisticas = (
  estadisticas: EstadisticaAlumno[],
  orden: OrdenAsistencia,
) => {
  const signo = orden.direccion === 'asc' ? 1 : -1;
  const clave = (e: EstadisticaAlumno): string | number => {
    switch (orden.campo) {
      case 'porcentaje':
        return e.porcentaje;
      case 'faltas':
        return e.faltas;
      case 'seguidas':
        return e.faltasSeguidas;
      case 'ultima':
        return e.ultimaAsistencia ? dayjs(e.ultimaAsistencia).valueOf() : 0;
      default:
        return sinAcentos(e.nombre);
    }
  };
  return [...estadisticas].sort((a, b) => {
    const ka = clave(a);
    const kb = clave(b);
    if (ka < kb) return -1 * signo;
    if (ka > kb) return 1 * signo;
    return sinAcentos(a.nombre).localeCompare(sinAcentos(b.nombre));
  });
};

// ── Exportación ───────────────────────────────────────────────────────────

const celdaCsv = (valor: unknown) => {
  const texto = valor == null ? '' : String(valor);
  // Evita que Excel interprete una celda como fórmula.
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[",\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

const aCsv = (filas: unknown[][]) =>
  // BOM para que Excel respete los acentos.
  `﻿${filas.map((fila) => fila.map(celdaCsv).join(',')).join('\r\n')}`;

export const estadisticasACsv = (estadisticas: EstadisticaAlumno[]) =>
  aCsv([
    [
      'Alumno',
      'Sesiones',
      'Asistió',
      'Faltó',
      '% asistencia',
      'Faltas seguidas',
      'Última asistencia',
      'En riesgo',
    ],
    ...estadisticas.map((e) => [
      e.nombre,
      e.sesiones,
      e.asistidas,
      e.faltas,
      e.porcentaje,
      e.faltasSeguidas,
      e.ultimaAsistencia ? dayjs(e.ultimaAsistencia).format('YYYY-MM-DD') : '',
      e.enRiesgo ? 'Sí' : 'No',
    ]),
  ]);

export const sesionesACsv = (sesiones: SesionHistorica[]) =>
  aCsv([
    ['Fecha', 'Tipo', 'Presentes', 'Ausentes', 'Total', '% asistencia'],
    ...sesiones.map((s) => [
      s.date,
      etiquetaTipo(s.type),
      s.presentes,
      s.ausentes,
      s.total,
      s.porcentaje,
    ]),
  ]);

export const registrosACsv = (registros: RegistroAlumno[]) =>
  aCsv([
    ['Fecha', 'Tipo', 'Asistencia'],
    ...[...registros]
      .sort((a, b) => porFecha(b, a))
      .map((r) => [
        dayjs(r.date).format('YYYY-MM-DD'),
        etiquetaTipo(r.type),
        r.present ? 'Asistió' : 'Faltó',
      ]),
  ]);

/** Descarga un CSV ya armado, sin dejar el enlace colgando en el DOM. */
export const descargarCsv = (nombre: string, contenido: string) => {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
};

// ── Estado de la pantalla en la URL ───────────────────────────────────────
//
// Compartir "el histórico de la Sub-12 de los últimos 90 días" o volver atrás
// sin perder la vista es parte del trabajo del admin.

export type VistaHistorico = 'alumnos' | 'sesiones';

export type EstadoAsistencias = {
  vista: 'pase' | 'historico';
  categoria: string | null;
  fecha: string | null;
  tipo: TipoSesion;
  periodo: Periodo;
  detalle: VistaHistorico;
};

export const ESTADO_ASISTENCIAS_INICIAL: EstadoAsistencias = {
  vista: 'pase',
  categoria: null,
  fecha: null,
  tipo: 'entrenamiento',
  periodo: '90',
  detalle: 'alumnos',
};

export const leerEstadoDeUrl = (busqueda: string): EstadoAsistencias => {
  const params = new URLSearchParams(busqueda);
  const tipo = params.get('tipo');
  const periodo = params.get('periodo');
  const detalle = params.get('detalle');
  const fecha = params.get('fecha');
  return {
    vista: params.get('vista') === 'historico' ? 'historico' : 'pase',
    categoria: params.get('categoria') || null,
    fecha: fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && dayjs(fecha).isValid() ? fecha : null,
    tipo: tipo === 'partido' ? 'partido' : 'entrenamiento',
    periodo: OPCIONES_PERIODO.some((o) => o.value === periodo)
      ? (periodo as Periodo)
      : ESTADO_ASISTENCIAS_INICIAL.periodo,
    detalle: detalle === 'sesiones' ? 'sesiones' : 'alumnos',
  };
};

export const escribirEstadoEnUrl = (estado: EstadoAsistencias) => {
  const params = new URLSearchParams();
  if (estado.vista !== 'pase') params.set('vista', estado.vista);
  if (estado.categoria) params.set('categoria', estado.categoria);
  // La fecha de hoy es el valor por omisión: no hace falta escribirla.
  if (estado.fecha && estado.fecha !== dayjs().format('YYYY-MM-DD')) {
    params.set('fecha', estado.fecha);
  }
  if (estado.tipo !== ESTADO_ASISTENCIAS_INICIAL.tipo) params.set('tipo', estado.tipo);
  if (estado.vista === 'historico') {
    if (estado.periodo !== ESTADO_ASISTENCIAS_INICIAL.periodo) params.set('periodo', estado.periodo);
    if (estado.detalle !== ESTADO_ASISTENCIAS_INICIAL.detalle) params.set('detalle', estado.detalle);
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
};
