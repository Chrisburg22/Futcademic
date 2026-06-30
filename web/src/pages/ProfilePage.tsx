import { Card, Stack, Group, Avatar, Text, Button, Divider, Anchor } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconUser,
  IconBuilding,
  IconLock,
  IconBell,
  IconDownload,
  IconHelp,
  IconFileText,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';

export function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const items: { to: string; label: string; icon: React.ReactNode; admin?: boolean }[] = [
    { to: '/settings/edit-academy', label: 'Datos de la academia', icon: <IconBuilding size={18} />, admin: true },
    { to: '/settings/edit-profile', label: 'Mi perfil', icon: <IconUser size={18} /> },
    { to: '/settings/security', label: 'Seguridad', icon: <IconLock size={18} /> },
    { to: '/settings/notifications', label: 'Notificaciones', icon: <IconBell size={18} /> },
    { to: '/settings/export', label: 'Exportar datos', icon: <IconDownload size={18} /> },
    { to: '/settings/support', label: 'Soporte', icon: <IconHelp size={18} /> },
    { to: '/settings/terms', label: 'Términos y condiciones', icon: <IconFileText size={18} /> },
  ];

  return (
    <>
      <PageHeader title="Mi cuenta" />
      <Card withBorder padding="lg" radius="md" mb="md">
        <Group>
          <Avatar src={profile?.avatar_url || undefined} size={64} radius="xl">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <div>
            <Text fw={700} size="lg">
              {profile?.full_name || profile?.email}
            </Text>
            <Text size="sm" c="dimmed">
              {profile?.email}
            </Text>
            <Text size="xs" c="dimmed" tt="capitalize">
              {profile?.role}
            </Text>
          </div>
        </Group>
      </Card>

      <Card withBorder padding={0} radius="md">
        <Stack gap={0}>
          {items
            .filter((i) => !i.admin || isAdmin)
            .map((i, idx, arr) => (
              <div key={i.to}>
                <Anchor
                  component={Link}
                  to={i.to}
                  underline="never"
                  c="inherit"
                  display="block"
                  px="lg"
                  py="md"
                >
                  <Group justify="space-between">
                    <Group>
                      {i.icon}
                      <Text>{i.label}</Text>
                    </Group>
                    <Text c="dimmed">›</Text>
                  </Group>
                </Anchor>
                {idx < arr.length - 1 && <Divider />}
              </div>
            ))}
        </Stack>
      </Card>

      <Button
        mt="lg"
        color="red"
        variant="light"
        leftSection={<IconLogout size={16} />}
        onClick={async () => {
          await signOut();
          navigate('/login', { replace: true });
        }}
      >
        Cerrar sesión
      </Button>
    </>
  );
}
