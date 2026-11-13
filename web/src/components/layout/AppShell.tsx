import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Avatar,
  Text,
  Menu,
  ActionIcon,
  useMantineColorScheme,
  Image,
  Badge,
  Box,
} from '@mantine/core';
import { useDisclosure, useNetwork } from '@mantine/hooks';
import { IconLogout, IconMoon, IconSun, IconUser, IconWifiOff } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { InstallButton } from '../pwa/InstallButton';
import { OfflineQueueBadge, usePendingOfflineCount } from '../pwa/OfflineQueueBadge';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { ChatProvider } from '../../contexts/ChatContext';
import { ChatWidget } from '../chat/ChatWidget';
import { useRouter } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const { profile, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { online } = useNetwork();
  const pendingOffline = usePendingOfflineCount();

  const doLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  // Cerrar sesión borra la caché persistida, y con ella la cola: lo que no se
  // haya enviado se pierde. Hay que decirlo antes, no después.
  const handleLogout = () => {
    if (pendingOffline === 0) {
      void doLogout();
      return;
    }
    modals.openConfirmModal({
      title: 'Hay cambios sin enviar',
      centered: true,
      children: (
        <Text size="sm">
          {pendingOffline === 1
            ? 'Un cambio sigue guardado en este dispositivo y aún no se ha enviado.'
            : `${pendingOffline} cambios siguen guardados en este dispositivo y aún no se han enviado.`}{' '}
          Si cierras la sesión ahora se perderán. Conéctate a internet y espera a que
          desaparezca el aviso «por enviar».
        </Text>
      ),
      labels: { confirm: 'Cerrar sesión y perderlos', cancel: 'Esperar' },
      confirmProps: { color: 'red' },
      onConfirm: () => void doLogout(),
    });
  };

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const shell = (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" style={{ minWidth: 0 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" className="touch-target" aria-label="Abrir menú" />
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              {profile?.school?.logo_url ? (
                <Image src={profile.school.logo_url} h={28} w={28} radius="sm" alt="logo" />
              ) : null}
              <Text fw={700} size="lg" truncate>
                {profile?.school?.name || 'Futcademic'}
              </Text>
            </Group>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <OfflineQueueBadge />
            {!online && (
              <Badge
                color="gray"
                variant="light"
                leftSection={<IconWifiOff size={14} />}
                title="Sin conexión: estás viendo datos guardados"
              >
                Sin conexión
              </Badge>
            )}
            {/* Botón completo en escritorio, icono en móvil: la cabecera va
                justa de sitio y es ahí donde más se instala. */}
            <Box visibleFrom="sm">
              <InstallButton />
            </Box>
            <Box hiddenFrom="sm">
              <InstallButton compact />
            </Box>
            <NotificationBell />
            <ActionIcon
              variant="subtle"
              onClick={toggleColorScheme}
              aria-label="Cambiar tema"
              size="lg"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" aria-label="Menú de usuario">
                  <Avatar src={profile?.avatar_url || undefined} size={32} radius="xl">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {profile?.full_name || profile?.email}
                  <Text size="xs" c="dimmed" tt="capitalize">
                    {profile?.role}
                  </Text>
                </Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={14} />}
                  onClick={() => router.push('/settings/edit-profile')}
                >
                  Mi perfil
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <Sidebar onNavigate={close} />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        {children}
      </MantineAppShell.Main>

      {/* La barra inferior se monta una vez aquí, no por pantalla. «Más» abre el
          mismo cajón que el Burger: un solo drawer, cero estado duplicado. */}
      <MobileNav onMore={toggle} />

      {isAdmin && <ChatWidget />}
    </MantineAppShell>
  );

  return isAdmin ? <ChatProvider>{shell}</ChatProvider> : shell;
}
