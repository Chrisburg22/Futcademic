import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { NavLink, ScrollArea, Stack, Text, Divider } from '@mantine/core';
import {
  IconHome,
  IconCalendarCheck,
  IconCash,
  IconUser,
  IconUsers,
  IconSchool,
  IconCategory,
  IconCalendarEvent,
  IconSettings,
  IconBuildingStadium,
  IconHeart,
  IconTrophy,
  IconChartBar,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

type Item = { to: string; label: string; icon: React.ReactNode; roles?: Role[] };

const mainItems: Item[] = [
  { to: '/', label: 'Inicio', icon: <IconHome size={18} /> },
  {
    to: '/attendance',
    label: 'Asistencias',
    icon: <IconCalendarCheck size={18} />,
  },
  {
    to: '/finances',
    label: 'Finanzas',
    icon: <IconCash size={18} />,
    roles: ['super_admin', 'admin', 'padre'],
  },
  {
    to: '/children',
    label: 'Mis hijos',
    icon: <IconHeart size={18} />,
    roles: ['padre'],
  },
  {
    to: '/team',
    label: 'Mi equipo',
    icon: <IconUsers size={18} />,
    roles: ['alumno'],
  },
  {
    to: '/achievements',
    label: 'Logros',
    icon: <IconTrophy size={18} />,
    roles: ['alumno'],
  },
  {
    to: '/stats',
    label: 'Estadísticas',
    icon: <IconChartBar size={18} />,
    roles: ['alumno'],
  },
  { to: '/profile', label: 'Perfil', icon: <IconUser size={18} /> },
];

const adminItems: Item[] = [
  {
    to: '/admin/students',
    label: 'Alumnos',
    icon: <IconSchool size={18} />,
    roles: ['super_admin', 'admin', 'profesor'],
  },
  {
    to: '/admin/teachers',
    label: 'Profesores',
    icon: <IconUsers size={18} />,
    roles: ['super_admin', 'admin'],
  },
  {
    to: '/admin/categories',
    label: 'Categorías',
    icon: <IconCategory size={18} />,
    roles: ['super_admin', 'admin'],
  },
  {
    to: '/admin/events',
    label: 'Agenda',
    icon: <IconCalendarEvent size={18} />,
    roles: ['super_admin', 'admin'],
  },
  {
    to: '/admin/venues',
    label: 'Canchas',
    icon: <IconBuildingStadium size={18} />,
    roles: ['super_admin', 'admin'],
  },
];

const settingsItems: Item[] = [
  {
    to: '/settings/edit-academy',
    label: 'Academia',
    icon: <IconSettings size={18} />,
    roles: ['super_admin', 'admin'],
  },
  { to: '/settings/edit-profile', label: 'Mi perfil', icon: <IconUser size={18} /> },
  { to: '/settings/security', label: 'Seguridad', icon: <IconSettings size={18} /> },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth();
  const role = profile?.role;
  const location = useLocation();

  const visible = (items: Item[]) =>
    items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  const renderItems = (items: Item[]) =>
    visible(items).map((i) => (
      <NavLink
        key={i.to}
        component={RouterLink}
        to={i.to}
        label={i.label}
        leftSection={i.icon}
        active={location.pathname === i.to}
        onClick={onNavigate}
      />
    ));

  return (
    <ScrollArea h="100%">
      <Stack gap="xs" p="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} px="sm">
          Principal
        </Text>
        {renderItems(mainItems)}

        {visible(adminItems).length > 0 && (
          <>
            <Divider my="xs" />
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} px="sm">
              Administración
            </Text>
            {renderItems(adminItems)}
          </>
        )}

        <Divider my="xs" />
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} px="sm">
          Ajustes
        </Text>
        {renderItems(settingsItems)}
      </Stack>
    </ScrollArea>
  );
}
