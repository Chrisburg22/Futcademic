import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ActionIcon, Badge, Group, Menu, Paper, Stack, Text, TypographyStylesProvider } from '@mantine/core';
import { IconThumbDown, IconThumbUp, IconTool } from '@tabler/icons-react';
import type { ChatMessage, ContentBlock, FeedbackRating } from '../../hooks/useChat';

const DOWN_REASONS = [
  { value: 'datos_incorrectos', label: 'Datos incorrectos' },
  { value: 'no_era_eso', label: 'No era lo que pedí' },
  { value: 'incompleta', label: 'Respuesta incompleta' },
  { value: 'no_ejecuto', label: 'No ejecutó la acción' },
];

function toolChipLabel(name?: string) {
  if (!name) return 'acción';
  return name.replace(/_/g, ' ');
}

function AssistantContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'text' && block.text) {
          return (
            <TypographyStylesProvider key={i} fz="sm" m={0} p={0} c="black">
              <ReactMarkdown>{block.text}</ReactMarkdown>
            </TypographyStylesProvider>
          );
        }
        if (block.type === 'tool_use') {
          return (
            <Badge
              key={i}
              variant="light"
              color="gray"
              size="sm"
              leftSection={<IconTool size={12} />}
              my={4}
              style={{ textTransform: 'none' }}
            >
              {toolChipLabel(block.name)}
            </Badge>
          );
        }
        return null; // thinking u otros bloques internos
      })}
    </>
  );
}

/**
 * Pulgares de valoración. El 👎 abre un menú de motivos, pero el voto se
 * registra al instante: el dataset no depende de que el usuario termine el
 * formulario.
 */
function FeedbackBar({
  messageId,
  value,
  onFeedback,
}: {
  messageId: string;
  value?: FeedbackRating;
  onFeedback: (messageId: string, rating: FeedbackRating, reason?: string) => void;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <Group gap={2}>
      <ActionIcon
        size="sm"
        variant={value === 'up' ? 'light' : 'subtle'}
        color={value === 'up' ? 'teal' : 'gray'}
        onClick={() => onFeedback(messageId, 'up')}
        aria-label="Respuesta útil"
        title="Respuesta útil"
      >
        <IconThumbUp size={14} />
      </ActionIcon>

      <Menu opened={opened} onChange={setOpened} position="bottom-start" shadow="md" width={220}>
        <Menu.Target>
          <ActionIcon
            size="sm"
            variant={value === 'down' ? 'light' : 'subtle'}
            color={value === 'down' ? 'red' : 'gray'}
            onClick={() => {
              onFeedback(messageId, 'down');
              setOpened(true);
            }}
            aria-label="Respuesta incorrecta"
            title="Respuesta incorrecta"
          >
            <IconThumbDown size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>¿Qué falló? (opcional)</Menu.Label>
          {DOWN_REASONS.map((reason) => (
            <Menu.Item
              key={reason.value}
              onClick={() => {
                onFeedback(messageId, 'down', reason.value);
                setOpened(false);
              }}
            >
              {reason.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      {value === 'down' && (
        <Text size="xs" c="dimmed">
          Gracias, lo revisaremos.
        </Text>
      )}
    </Group>
  );
}

export function MessageBubble({
  message,
  feedback,
  onFeedback,
}: {
  message: ChatMessage;
  feedback?: FeedbackRating;
  onFeedback?: (messageId: string, rating: FeedbackRating, reason?: string) => void;
}) {
  const blocks = Array.isArray(message.content) ? message.content : [];

  if (message.role === 'user') {
    const text = blocks
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text)
      .join('\n');
    if (!text) return null; // mensajes internos de tool_result
    return (
      <Group justify="flex-end">
        <Paper bg="blue.6" c="white" px="md" py="xs" radius="lg" maw="75%">
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {text}
          </Text>
        </Paper>
      </Group>
    );
  }

  const hasVisible = blocks.some((b) => (b.type === 'text' && b.text) || b.type === 'tool_use');
  if (!hasVisible) return null;

  const hasText = blocks.some((b) => b.type === 'text' && b.text);

  return (
    <Group justify="flex-start" align="flex-start">
      <Stack gap={2} align="flex-start" maw="85%">
        <Paper bg="gray.0" px="md" py="xs" radius="lg" withBorder>
          <AssistantContent blocks={blocks} />
        </Paper>
        {hasText && onFeedback && (
          <FeedbackBar messageId={message.id} value={feedback} onFeedback={onFeedback} />
        )}
      </Stack>
    </Group>
  );
}

export function StreamingBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Group justify="flex-start" align="flex-start">
      <Paper bg="gray.0" px="md" py="xs" radius="lg" maw="85%" withBorder>
        <TypographyStylesProvider fz="sm" m={0} p={0} c="black">
          <ReactMarkdown>{text}</ReactMarkdown>
        </TypographyStylesProvider>
      </Paper>
    </Group>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <Group justify="flex-end">
      <Paper bg="blue.6" c="white" px="md" py="xs" radius="lg" maw="75%">
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Text>
      </Paper>
    </Group>
  );
}
