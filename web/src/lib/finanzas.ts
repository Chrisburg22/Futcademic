import dayjs from 'dayjs';

/**
 * Utilidades de la pantalla de Finanzas.
 *
 * Todo lo que se puede calcular sin React vive aquí: así la pantalla solo
 * pinta, y las mismas reglas (qué es "esperado", cómo se calcula la tasa de
 * cobranza) se pueden probar y reutilizar.
 */

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** `$1,500` / `$1,500.50` / `—` cuando no hay dato. */
export const pesos = (monto: number | null | undefined) =>
  monto == null || Number.isNaN(Number(monto)) ? '—' : formatoMoneda.format(Number(monto));

export const numero = (valor: number | null | undefined) =>
  valor == null ? '—' : Number(valor).toLocaleString('es-MX');

export type Periodo = { mes: number; anio: number };

export const periodoActual = (): Periodo => ({
  mes: dayjs().month() + 1,
  anio: dayjs().year(),
});

export const mismoPeriodo = (a: Periodo, b: Periodo) => a.mes === b.mes && a.anio === b.anio;

/** "Octubre 2026", con mayúscula inicial. */
export const periodoLegible = ({ mes, anio }: Periodo) =>
  `${dayjs().month(mes - 1).format('MMMM')} ${anio}`.replace(/^./, (c) => c.toUpperCase());

export const mesCorto = (mes: number) =>
  dayjs().month(mes - 1).format('MMM').replace(/^./, (c) => c.toUpperCase());

/** Mueve el periodo `delta` meses, ajustando el año si cruza diciembre. */
export const moverPeriodo = ({ mes, anio }: Periodo, delta: number): Periodo => {
  const fecha = dayjs(`${anio}-${String(mes).padStart(2, '0')}-01`).add(delta, 'month');
  return { mes: fecha.month() + 1, anio: fecha.year() };
};

// ── Cifras del periodo ────────────────────────────────────────────────────

export type ResumenMes = {
  month: number;
  collected: number;
  payroll: number;
  margin: number;
};

export type ResumenFinanciero = {
  year: number;
  months: ResumenMes[];
  totals: { collected: number; payroll: number; margin: number };
};

/** Cifras del mes pedido; ceros si el backend todavía no respondió. */
export const mesDelResumen = (resumen: ResumenFinanciero | undefined, mes: number): ResumenMes =>
  resumen?.months?.find((m) => Number(m.month) === mes) ?? {
    month: mes,
    collected: 0,
    payroll: 0,
    margin: 0,
  };

/**
 * Tasa de cobranza sobre lo que se debía cobrar.
 *
 * `esperado = cobrado + porCobrar` es exacto: lo que ya entró más lo que falta
 * de los alumnos que no han cubierto su cuota. `null` cuando no hay nada que
 * cobrar (sin alumnos activos), para no mostrar un engañoso 100%.
 */
export const tasaCobranza = (cobrado: number, porCobrar: number): number | null => {
  const esperado = Number(cobrado) + Number(porCobrar);
  if (!Number.isFinite(esperado) || esperado <= 0) return null;
  return Math.round((Number(cobrado) / esperado) * 100);
};

/** Variación porcentual contra el periodo anterior; `null` sin base. */
export const variacion = (actual: number, anterior: number): number | null => {
  if (!Number.isFinite(anterior) || anterior <= 0) return null;
  return Math.round(((Number(actual) - Number(anterior)) / anterior) * 100);
};

/** Los últimos `cantidad` meses hasta el periodo dado, del más viejo al actual. */
export const construirTendencia = (
  resumen: ResumenFinanciero | undefined,
  periodo: Periodo,
  cantidad = 6,
) => {
  const puntos: { etiqueta: string; cobrado: number; nomina: number; margen: number }[] = [];
  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const fecha = dayjs(`${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-01`).subtract(
      i,
      'month',
    );
    const mes = fecha.month() + 1;
    // El resumen es de un solo año: los meses de otro ejercicio van en cero.
    const cifras =
      fecha.year() === resumen?.year ? mesDelResumen(resumen, mes) : { collected: 0, payroll: 0 };
    puntos.push({
      etiqueta: mesCorto(mes),
      cobrado: cifras.collected,
      nomina: cifras.payroll,
      margen: cifras.collected - cifras.payroll,
    });
  }
  return puntos;
};

// ── Cobranza ──────────────────────────────────────────────────────────────

export type PendienteDelMes = {
  id: string;
  full_name: string;
  category?: { name?: string | null; monthly_fee?: number | null } | null;
  monthly_fee: number;
  paid_amount: number;
  pending_amount: number;
  status?: string;
};

export type OrdenCobranza = 'adeudo_desc' | 'nombre_asc' | 'nombre_desc';

export const OPCIONES_ORDEN_COBRANZA: { value: OrdenCobranza; label: string }[] = [
  { value: 'adeudo_desc', label: 'Mayor adeudo primero' },
  { value: 'nombre_asc', label: 'Nombre (A-Z)' },
  { value: 'nombre_desc', label: 'Nombre (Z-A)' },
];

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Filtra y ordena la bandeja de cobranza. Se busca por nombre y categoría
 * porque son las dos formas en que el staff identifica a un alumno.
 */
export const prepararCobranza = (
  pendientes: PendienteDelMes[],
  busqueda: string,
  orden: OrdenCobranza,
) => {
  const q = sinAcentos(busqueda.trim());
  const filas = pendientes.filter((p) => {
    if (!q) return true;
    return sinAcentos(`${p.full_name} ${p.category?.name || ''}`).includes(q);
  });

  return [...filas].sort((a, b) => {
    if (orden === 'adeudo_desc') {
      return Number(b.pending_amount) - Number(a.pending_amount);
    }
    const comparacion = sinAcentos(a.full_name || '').localeCompare(sinAcentos(b.full_name || ''));
    return orden === 'nombre_desc' ? -comparacion : comparacion;
  });
};

/** Monto que se propone al cobrar: lo que falta, nunca más que la cuota. */
export const montoSugerido = (pendiente: PendienteDelMes) =>
  Math.max(0, Number(pendiente.pending_amount) || 0);

// ── Estado de la pantalla en la URL ───────────────────────────────────────
//
// El periodo y la vista viven en el query string: un enlace de Inicio puede
// abrir "la cobranza de octubre" y el asistente recibe el mismo contexto que
// ve el admin.

export type TabFinanzas = 'cobranza' | 'pagos' | 'nomina';

export const TABS_FINANZAS: { value: TabFinanzas; label: string }[] = [
  { value: 'cobranza', label: 'Cobranza' },
  { value: 'pagos', label: 'Pagos del mes' },
  { value: 'nomina', label: 'Nómina' },
];

/** Cómo se describe la vista al asistente, en lenguaje natural. */
export const VISTA_PARA_CHAT: Record<TabFinanzas, string> = {
  cobranza: 'pendientes del mes',
  pagos: 'pagos de alumnos',
  nomina: 'pagos a profesores',
};

type LectorDeParams = { get: (clave: string) => string | null };

export const leerTab = (valor: string | null): TabFinanzas =>
  TABS_FINANZAS.some((t) => t.value === valor) ? (valor as TabFinanzas) : 'cobranza';

export const leerPeriodo = (params: LectorDeParams): Periodo => {
  const mes = Number(params.get('mes'));
  const anio = Number(params.get('anio'));
  const valido =
    Number.isInteger(mes) && mes >= 1 && mes <= 12 &&
    Number.isInteger(anio) && anio >= 2000 && anio <= 2100;
  return valido ? { mes, anio } : periodoActual();
};

export const escribirPeriodoEnUrl = (periodo: Periodo, tab: TabFinanzas) => {
  const params = new URLSearchParams();
  params.set('mes', String(periodo.mes));
  params.set('anio', String(periodo.anio));
  params.set('tab', tab);
  return params.toString();
};

