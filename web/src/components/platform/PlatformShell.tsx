'use client';

import {
  ActionIcon,
  AppShell as MantineShell,
  Badge,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuildingStadium,
  IconHistory,
  IconLayoutDashboard,
  IconLogout,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Shell de la consola de plataforma, aparte del `AppShell` de academia.
 *
 * No se reutiliza el de academia a propósito: su menú, su logo y su lenguaje
 * hablan de «mi academia», y mezclarlos invita a confundir una academia con
 * todas. El color oscuro del encabezado es la señal de «estás en la consola».
 */
const DESTINOS = [
  { to: '/platform', label: 'Resumen', icon: IconLayoutDashboard },
  { to: '/platform/schools', label: 'Academias', icon: IconBuildingStadium, prefijo: true },
  { to: '/platform/users', label: 'Personas', icon: IconUsers },
  { to: '/platform/audit', label: 'Bitácora', icon: IconHistory },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [abierto, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const activo = (destino: (typeof DESTINOS)[number]) =>
    destino.prefijo ? pathname.startsWith(destino.to) : pathname === destino.to;

  return (
    <MantineShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !abierto } }}
      padding="md"
    >
      <MantineShell.Header bg="dark.7" c="white">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={abierto} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            <Text fw={700}>Futcademic</Text>
            <Badge variant="light" color="gray">
              Consola de plataforma
            </Badge>
          </Group>
          <Group gap="sm">
            <Text size="sm" visibleFrom="sm">
              {profile?.full_name || 'Dueño'}
            </Text>
            <Tooltip label="Salir">
              <ActionIcon variant="subtle" color="gray" aria-label="Salir" onClick={() => signOut()}>
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </MantineShell.Header>

      <MantineShell.Navbar p="xs">
        <ScrollArea>
          <Stack gap={4}>
            {DESTINOS.map((destino) => (
              <NavLink
                key={destino.to}
                component={Link}
                href={destino.to}
                label={destino.label}
                leftSection={<destino.icon size={18} />}
                active={activo(destino)}
                onClick={close}
              />
            ))}
          </Stack>
        </ScrollArea>
      </MantineShell.Navbar>

      <MantineShell.Main>{children}</MantineShell.Main>
    </MantineShell>
  );
}
