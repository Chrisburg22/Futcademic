import { Group, Loader, Text } from '@mantine/core';
import { AssistantAvatar } from './MessageBubble';
import classes from './chat.module.css';

/**
 * Herramienta en ejecución. Va dentro de la conversación (no como burbuja
 * aparte) para que el usuario vea que el asistente está consultando datos
 * reales y no colgado.
 */
export function ToolActivity({ label }: { label: string }) {
  return (
    <Group gap="xs" align="center" wrap="nowrap" w="100%">
      <AssistantAvatar />
      <Group gap="xs" wrap="nowrap" className={classes.toolPill}>
        <Loader size={14} />
        <Text size="xs" c="dimmed" fw={500}>
          {label}…
        </Text>
      </Group>
    </Group>
  );
}
