import { Group, Loader, Text } from '@mantine/core';

export function ToolActivity({ label }: { label: string }) {
  return (
    <Group gap="xs" px="sm">
      <Loader size="xs" />
      <Text size="sm" c="dimmed" fs="italic">
        {label}…
      </Text>
    </Group>
  );
}
