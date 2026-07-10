import { Button, Card, Code, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { PendingAction } from '../../api/chatStream';

function isDestructive(name: string) {
  return name.startsWith('delete_');
}

function InputDetail({ input }: { input: Record<string, unknown> }) {
  const entries = Object.entries(input).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return null;
  return (
    <Stack gap={2}>
      {entries.map(([key, value]) => (
        <Text key={key} size="xs" c="dimmed">
          {key}: <Code fz="xs">{typeof value === 'string' ? value : JSON.stringify(value)}</Code>
        </Text>
      ))}
    </Stack>
  );
}

export function ConfirmationCard({
  actions,
  onRespond,
  disabled,
}: {
  actions: PendingAction[];
  onRespond: (approved: boolean) => void;
  disabled?: boolean;
}) {
  const destructive = actions.some((a) => isDestructive(a.name));

  return (
    <Card withBorder radius="md" p="md" bg="yellow.0" style={{ borderColor: 'var(--mantine-color-yellow-4)' }}>
      <Stack gap="sm">
        <Group gap="xs">
          <IconAlertTriangle size={18} color="var(--mantine-color-yellow-8)" />
          <Text fw={600} size="sm">
            El asistente necesita tu confirmación
          </Text>
        </Group>

        {actions.map((action) => (
          <Stack key={action.tool_use_id} gap={4}>
            <Text size="sm" fw={500}>
              {action.label}
            </Text>
            <InputDetail input={action.input} />
          </Stack>
        ))}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" size="xs" onClick={() => onRespond(false)} disabled={disabled}>
            Cancelar
          </Button>
          <Button
            color={destructive ? 'red' : 'blue'}
            size="xs"
            onClick={() => onRespond(true)}
            disabled={disabled}
          >
            Confirmar
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
