/**
 * Contexto de pantalla que el chat envía al backend.
 *
 * La ruta da un contexto genérico ("estás en Finanzas"); las pantallas que
 * conocen el registro abierto lo enriquecen con el nombre ("Ficha de Ana
 * Torres"), que es lo que permite decir "súbele la mensualidad a esta alumna".
 */

export interface ChatScreenEntity {
  type: string;
  id?: string;
  name?: string;
}

export interface ChatScreenFilter {
  label: string;
  value: string;
}

export interface ChatScreenContext {
  screen: string;
  entity?: ChatScreenEntity;
  filters?: ChatScreenFilter[];
}

// Las rutas de detalle van antes que las de listado: si no, "students/:id"
// caería en la regla de "students".
const ROUTES: { pattern: RegExp; screen: string }[] = [
  { pattern: /^\/admin\/students\/[^/]+$/, screen: 'Ficha del alumno' },
  { pattern: /^\/admin\/students$/, screen: 'Lista de alumnos' },
  { pattern: /^\/admin\/teachers\/[^/]+$/, screen: 'Ficha del profesor' },
  { pattern: /^\/admin\/teachers$/, screen: 'Lista de profesores' },
  { pattern: /^\/admin\/categories\/[^/]+$/, screen: 'Ficha de la categoría' },
  { pattern: /^\/admin\/categories$/, screen: 'Categorías' },
  { pattern: /^\/admin\/events$/, screen: 'Eventos' },
  { pattern: /^\/admin\/venues$/, screen: 'Sedes' },
  { pattern: /^\/finances$/, screen: 'Finanzas' },
  { pattern: /^\/attendance$/, screen: 'Asistencias' },
  { pattern: /^\/stats$/, screen: 'Estadísticas' },
  { pattern: /^\/team$/, screen: 'Equipo' },
  { pattern: /^\/achievements$/, screen: 'Logros' },
  { pattern: /^\/children$/, screen: 'Hijos' },
  { pattern: /^\/settings\/edit-academy$/, screen: 'Ajustes de la academia' },
  { pattern: /^\/settings\//, screen: 'Ajustes' },
  { pattern: /^\/profile$/, screen: 'Perfil' },
  { pattern: /^\/onboarding$/, screen: 'Configuración inicial' },
];

/**
 * Contexto mínimo derivado de la ruta. Devuelve null en el propio chat: ahí no
 * hay pantalla de datos que aporte nada.
 */
export function screenFromPath(pathname: string): ChatScreenContext | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin/chat' || path === '/') return null;

  const match = ROUTES.find((r) => r.pattern.test(path));
  return match ? { screen: match.screen } : null;
}

/** Texto corto para la franja "Viendo: …" del asistente. */
export function screenContextLabel(ctx: ChatScreenContext | null): string | null {
  if (!ctx) return null;
  return ctx.entity?.name ? `${ctx.screen} · ${ctx.entity.name}` : ctx.screen;
}
