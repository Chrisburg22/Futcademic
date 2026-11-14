import {
  IconBuildingStadium,
  IconCalendarCheck,
  IconCalendarEvent,
  IconCash,
  IconCategory,
  IconChartBar,
  IconClipboardList,
  IconHeart,
  IconHome,
  IconMessageChatbot,
  IconSchool,
  IconSettings,
  IconTrophy,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import type { Role } from '../../types';

/**
 * Fuente única de la navegación.
 *
 * Antes los destinos vivían duplicados en `Sidebar.tsx` y en los `SHORTCUTS` de
 * `AdminDashboard.tsx`. Aquí están una sola vez, y de aquí se derivan tanto el
 * cajón lateral como la barra inferior de móvil (`MobileNav`).
 */
export type NavItem = {
  to: string;
  label: string;
  /** Etiqueta corta para la barra inferior; cae a `label` si falta. */
  shortLabel?: string;
  /** La misma pantalla se llama distinto según quién la abra. */
  labelByRole?: Partial<Record<Role, string>>;
  /**
   * Componente, no elemento: el cajón lo pinta a 18 px y la barra a 24 px.
   * Congelar el tamaño en el array obligaba a duplicar los destinos.
   */
  icon: React.ComponentType<{ size?: number | string; stroke?: number }>;
  roles?: Role[];
  /**
   * Marca el ítem también en las rutas hijas (`/admin/students/123`).
   * Nunca en `to: '/'`: `startsWith('/')` marcaría Inicio en toda la app.
   */
  matchPrefix?: boolean;
};

export const mainItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: IconHome },
  {
    to: '/attendance',
    label: 'Asistencias',
    shortLabel: 'Asistencia',
    // El profesor conserva «Asistencias»: esa pantalla tiene pase de lista y
    // también histórico, así que «Pase de lista» nombraría solo la mitad.
    labelByRole: { alumno: 'Mi asistencia' },
    icon: IconCalendarCheck,
    matchPrefix: true,
  },
  {
    to: '/finances',
    label: 'Finanzas',
    // Para el admin es la caja de la academia; para el padre, sus mensualidades.
    labelByRole: { padre: 'Pagos' },
    icon: IconCash,
    roles: ['super_admin', 'admin', 'padre'],
    matchPrefix: true,
  },
  {
    to: '/children',
    label: 'Mis hijos',
    shortLabel: 'Mis hijos',
    icon: IconHeart,
    roles: ['padre'],
    matchPrefix: true,
  },
  {
    to: '/team',
    label: 'Mi equipo',
    shortLabel: 'Mi equipo',
    icon: IconUsers,
    roles: ['alumno'],
    matchPrefix: true,
  },
  {
    to: '/achievements',
    label: 'Logros',
    icon: IconTrophy,
    roles: ['alumno'],
    matchPrefix: true,
  },
  {
    to: '/stats',
    label: 'Estadísticas',
    icon: IconChartBar,
    roles: ['alumno'],
    matchPrefix: true,
  },
  { to: '/profile', label: 'Perfil', icon: IconUser, matchPrefix: true },
];

export const adminItems: NavItem[] = [
  {
    to: '/admin/chat',
    label: 'Asistente IA',
    shortLabel: 'Asistente',
    icon: IconMessageChatbot,
    roles: ['super_admin', 'admin'],
    matchPrefix: true,
  },
  {
    to: '/admin/students',
    label: 'Alumnos',
    icon: IconSchool,
    roles: ['super_admin', 'admin', 'profesor'],
    matchPrefix: true,
  },
  {
    to: '/admin/enrollments',
    label: 'Inscripciones',
    shortLabel: 'Inscrip.',
    icon: IconClipboardList,
    roles: ['super_admin', 'admin', 'profesor'],
    matchPrefix: true,
  },
  {
    to: '/admin/teachers',
    label: 'Profesores',
    icon: IconUsers,
    roles: ['super_admin', 'admin'],
    matchPrefix: true,
  },
  {
    to: '/admin/categories',
    label: 'Categorías',
    shortLabel: 'Categoría',
    icon: IconCategory,
    roles: ['super_admin', 'admin', 'profesor'],
    matchPrefix: true,
  },
  {
    to: '/admin/events',
    label: 'Agenda',
    icon: IconCalendarEvent,
    roles: ['super_admin', 'admin'],
    matchPrefix: true,
  },
  {
    to: '/admin/venues',
    label: 'Canchas',
    icon: IconBuildingStadium,
    roles: ['super_admin', 'admin'],
    matchPrefix: true,
  },
];

export const settingsItems: NavItem[] = [
  {
    to: '/settings/edit-academy',
    label: 'Academia',
    icon: IconSettings,
    roles: ['super_admin', 'admin'],
  },
  { to: '/settings/edit-profile', label: 'Mi perfil', icon: IconUser },
  { to: '/settings/security', label: 'Seguridad', icon: IconSettings },
];

export function visibleFor(items: NavItem[], role?: Role): NavItem[] {
  return items.filter((i) => !i.roles || (role && i.roles.includes(role)));
}

/** Cómo se llama el destino para quien lo abre. */
export function labelFor(item: NavItem, role?: Role): string {
  return (role && item.labelByRole?.[role]) || item.label;
}

/** Etiqueta corta de la barra inferior. */
export function shortLabelFor(item: NavItem, role?: Role): string {
  if (role && item.labelByRole?.[role]) return item.labelByRole[role] as string;
  return item.shortLabel || item.label;
}

/**
 * Los cuatro destinos de la barra inferior por rol. El quinto hueco lo ocupa
 * «Más», que abre el mismo cajón que el Burger, así que nada queda
 * inalcanzable. Cuatro + Más deja iconos y texto más grandes que cinco
 * destinos, que es lo que pide el público de alumno y padre.
 */
const BARRA_POR_ROL: Record<Role, string[]> = {
  super_admin: ['/', '/admin/students', '/finances', '/attendance'],
  admin: ['/', '/admin/students', '/finances', '/attendance'],
  profesor: ['/', '/attendance', '/admin/students', '/admin/categories'],
  padre: ['/', '/children', '/finances', '/attendance'],
  alumno: ['/', '/attendance', '/team', '/achievements'],
};

const TODOS = [...mainItems, ...adminItems, ...settingsItems];

export function bottomNavItems(role?: Role): NavItem[] {
  if (!role) return [];
  const permitidos = visibleFor(TODOS, role);
  return BARRA_POR_ROL[role]
    .map((to) => permitidos.find((i) => i.to === to))
    .filter((i): i is NavItem => Boolean(i));
}

/** ¿Este destino es el que está abierto? */
export function esActivo(item: NavItem, pathname: string): boolean {
  if (item.to === '/') return pathname === '/';
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(`${item.to}/`);
  return pathname === item.to;
}
