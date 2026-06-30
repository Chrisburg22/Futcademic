import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';

export function EmptyState({
  title = 'Sin datos',
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <ThemeIcon size={64} radius="xl" variant="light">
          {icon || <IconInbox size={32} />}
        </ThemeIcon>
        <Text fw={600}>{title}</Text>
        {description && (
          <Text size="sm" c="dimmed" ta="center" maw={320}>
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}
