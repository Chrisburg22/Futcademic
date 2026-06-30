import {
  ActionIcon,
  Indicator,
  Menu,
  Text,
  Stack,
  Group,
  Button,
  ScrollArea,
  UnstyledButton,
} from '@mantine/core';
import { IconBell, IconBellOff } from '@tabler/icons-react';
import {
  useGetNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import type { NotificationItem } from '../../types';

export function NotificationBell() {
  const { data: notifications = [] } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = notifications.filter((n: NotificationItem) => !n.is_read).length;

  return (
    <Menu position="bottom-end" withArrow width={320} shadow="md">
      <Menu.Target>
        <Indicator
          disabled={unread === 0}
          label={unread > 9 ? '9+' : unread}
          size={16}
          offset={6}
          color="red"
        >
          <ActionIcon variant="subtle" size="lg" aria-label="Notificaciones">
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      <Menu.Dropdown>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={600} size="sm">
            Notificaciones
          </Text>
          {unread > 0 && (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              Marcar todas
            </Button>
          )}
        </Group>
        <Menu.Divider />
        {notifications.length === 0 ? (
          <Stack align="center" py="lg" gap={4}>
            <IconBellOff size={24} opacity={0.5} />
            <Text size="xs" c="dimmed">
              Sin notificaciones
            </Text>
          </Stack>
        ) : (
          <ScrollArea.Autosize mah={360}>
            {notifications.map((n: NotificationItem) => (
              <UnstyledButton
                key={n.id}
                w="100%"
                px="sm"
                py="xs"
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                style={{
                  display: 'block',
                  backgroundColor: n.is_read ? undefined : 'var(--mantine-color-blue-light)',
                  borderRadius: 4,
                }}
              >
                <Text size="sm" fw={n.is_read ? 400 : 600} lineClamp={1}>
                  {n.title}
                </Text>
                {n.body && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {n.body}
                  </Text>
                )}
                <Text size="10px" c="dimmed">
                  {new Date(n.created_at).toLocaleString()}
                </Text>
              </UnstyledButton>
            ))}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
