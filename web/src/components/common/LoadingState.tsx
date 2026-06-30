import { Center, Loader, Stack, Text } from '@mantine/core';

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <Loader />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}
