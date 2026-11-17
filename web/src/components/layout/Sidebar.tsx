import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLink, ScrollArea, Stack, Text, Divider } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';
import {
  adminItems,
  esActivo,
  labelFor,
  mainItems,
  settingsItems,
  visibleFor,
  type NavItem,
} from './navItems';

/**
 * Cajón lateral: en escritorio es la navegación; en teléfono es «todo lo
 * demás», lo que no entra en la barra inferior (`MobileNav`). Los destinos
 * salen de `navItems.ts`, que es la única fuente.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth();
  const role = profile?.role;
  const pathname = usePathname();

  const renderItems = (items: NavItem[]) =>
    visibleFor(items, role).map((i) => {
      const Icono = i.icon;
      return (
        <NavLink
          key={i.to}
          component={Link}
          href={i.to}
          // El mínimo táctil de 44 px en teléfono (`globals.css`); el NavLink
          // de Mantine se queda en 41 px.
          className="touch-target"
          label={labelFor(i, role)}
          leftSection={<Icono size={18} />}
          active={esActivo(i, pathname)}
          onClick={onNavigate}
        />
      );
    });

  return (
    <ScrollArea h="100%">
      <Stack gap="xs" p="sm">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} px="sm">
          Principal
        </Text>
        {renderItems(mainItems)}

        {visibleFor(adminItems, role).length > 0 && (
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
