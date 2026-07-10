import { Outlet } from 'react-router-dom';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconMoon, IconSun, IconUser } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { ChatProvider } from '../../contexts/ChatContext';
import { ChatWidget } from '../chat/ChatWidget';
import { useNavigate } from 'react-router-dom';

export function AppShell() {
  const [opened, { toggle, close }] = useDisclosure();
  const { profile, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const shell = (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              {profile?.school?.logo_url ? (
                <Image src={profile.school.logo_url} h={28} w={28} radius="sm" alt="logo" />
              ) : null}
              <Text fw={700} size="lg">
                {profile?.school?.name || 'Futcademic'}
              </Text>
            </Group>
          </Group>
          <Group gap="xs">
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
                  onClick={() => navigate('/settings/edit-profile')}
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
        <Outlet />
      </MantineAppShell.Main>

      {isAdmin && <ChatWidget />}
    </MantineAppShell>
  );

  return isAdmin ? <ChatProvider>{shell}</ChatProvider> : shell;
}
