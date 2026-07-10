import ReactMarkdown from 'react-markdown';
import { Badge, Group, Paper, Text, TypographyStylesProvider } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';
import type { ChatMessage, ContentBlock } from '../../hooks/useChat';

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

export function MessageBubble({ message }: { message: ChatMessage }) {
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

  return (
    <Group justify="flex-start" align="flex-start">
      <Paper bg="gray.0" px="md" py="xs" radius="lg" maw="85%" withBorder>
        <AssistantContent blocks={blocks} />
      </Paper>
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
