import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconSparkles,
  IconThumbDown,
  IconThumbUp,
  IconTool,
} from '@tabler/icons-react';
import type { ChatMessage, ContentBlock, FeedbackRating } from '../../hooks/useChat';
import { describeToolUse } from '../../lib/chatTools';
import type { Components } from 'react-markdown';
import classes from './chat.module.css';

const DOWN_REASONS = [
  { value: 'datos_incorrectos', label: 'Datos incorrectos' },
  { value: 'no_era_eso', label: 'No era lo que pedí' },
  { value: 'incompleta', label: 'Respuesta incompleta' },
  { value: 'no_ejecuto', label: 'No ejecutó la acción' },
];

const timeFormat = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

// Las tablas necesitan su propio contenedor con scroll horizontal; si no, en
// móvil las columnas se comprimen y las palabras se rompen letra a letra.
const markdownComponents: Components = {
  table: ({ node: _node, ...props }) => (
    <div className={classes.tableBlock}>
      <div
        className={classes.tableWrap}
        role="region"
        aria-label="Tabla de datos"
        tabIndex={0}
      >
        <table {...props} />
      </div>
      <span className={classes.tableHint} aria-hidden>
        Desliza para ver toda la tabla
      </span>
    </div>
  ),
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
};

function messageTime(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  return sameDay
    ? timeFormat.format(date)
    : `${dateFormat.format(date)}, ${timeFormat.format(date)}`;
}

function textOf(blocks: ContentBlock[]) {
  return blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n\n');
}

/** Avatar del asistente. Se repite en la respuesta, el stream y el widget. */
export function AssistantAvatar({ size = 30 }: { size?: number }) {
  return (
    <ThemeIcon size={size} radius="xl" variant="light" color="futcamedic" aria-hidden>
      <IconSparkles size={size * 0.52} />
    </ThemeIcon>
  );
}

function AssistantContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <Stack gap={4} align="flex-start">
      {blocks.map((block, i) => {
        if (block.type === 'text' && block.text) {
          return (
            <Box key={i} className={classes.markdown} w="100%">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {block.text}
              </ReactMarkdown>
            </Box>
          );
        }
        if (block.type === 'tool_use') {
          return (
            <Badge
              key={i}
              variant="light"
              color="gray"
              size="sm"
              radius="sm"
              leftSection={<IconTool size={11} />}
              className={classes.toolChip}
            >
              {describeToolUse(block.name)}
            </Badge>
          );
        }
        return null; // thinking u otros bloques internos
      })}
    </Stack>
  );
}

/**
 * Copiar la respuesta y valorar. El 👎 abre un menú de motivos, pero el voto se
 * registra al instante: el dataset no depende de que el usuario termine el
 * formulario.
 */
function MessageActions({
  messageId,
  text,
  value,
  onFeedback,
}: {
  messageId: string;
  text: string;
  value?: FeedbackRating;
  onFeedback?: (messageId: string, rating: FeedbackRating, reason?: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* sin permisos de portapapeles: no interrumpimos la lectura */
    }
  };

  return (
    <Group gap={2} className={classes.actions} wrap="wrap">
      <Tooltip label={copied ? 'Copiado' : 'Copiar respuesta'} withArrow>
        <ActionIcon
          size={36}
          variant="subtle"
          color="gray"
          onClick={copy}
          aria-label="Copiar respuesta"
        >
          {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
        </ActionIcon>
      </Tooltip>

      {onFeedback && (
        <>
          <Tooltip label="Respuesta útil" withArrow>
            <ActionIcon
              size={36}
              variant={value === 'up' ? 'light' : 'subtle'}
              color={value === 'up' ? 'teal' : 'gray'}
              onClick={() => onFeedback(messageId, 'up')}
              aria-label="Respuesta útil"
              aria-pressed={value === 'up'}
            >
              <IconThumbUp size={15} />
            </ActionIcon>
          </Tooltip>

          <Menu opened={opened} onChange={setOpened} position="bottom-start" shadow="md" width={220}>
            <Menu.Target>
              <ActionIcon
                size={36}
                variant={value === 'down' ? 'light' : 'subtle'}
                color={value === 'down' ? 'red' : 'gray'}
                onClick={() => {
                  onFeedback(messageId, 'down');
                  setOpened(true);
                }}
                aria-label="Respuesta incorrecta"
                aria-pressed={value === 'down'}
              >
                <IconThumbDown size={15} />
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
        </>
      )}

      {value === 'down' && (
        <Text size="xs" c="dimmed">
          Gracias, lo revisaremos.
        </Text>
      )}
    </Group>
  );
}

function AssistantFrame({
  time,
  children,
  actions,
}: {
  time?: string | null;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Group align="flex-start" gap="xs" wrap="nowrap" w="100%">
      <AssistantAvatar />
      <Stack gap={4} style={{ minWidth: 0, flex: 1 }} maw={720}>
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" fw={600}>
            Asistente
          </Text>
          {time && (
            <Text size="xs" c="dimmed">
              {time}
            </Text>
          )}
        </Group>
        {children}
        {actions}
      </Stack>
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
    const text = textOf(blocks);
    if (!text) return null; // mensajes internos de tool_result
    return (
      <Group justify="flex-end" wrap="nowrap">
        <Paper className={classes.userBubble} px="md" py="xs" radius="lg" style={{ borderBottomRightRadius: 4 }}>
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
  const text = textOf(blocks);

  return (
    <AssistantFrame
      time={messageTime(message.created_at)}
      actions={
        hasText ? (
          <MessageActions
            messageId={message.id}
            text={text}
            value={feedback}
            onFeedback={onFeedback}
          />
        ) : undefined
      }
    >
      <Paper
        className={classes.assistantBubble}
        px="md"
        py="sm"
        radius="lg"
        style={{ borderTopLeftRadius: 4 }}
      >
        <AssistantContent blocks={blocks} />
      </Paper>
    </AssistantFrame>
  );
}

export function StreamingBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <AssistantFrame>
      <Paper
        className={classes.assistantBubble}
        px="md"
        py="sm"
        radius="lg"
        style={{ borderTopLeftRadius: 4 }}
      >
        <Box className={classes.markdown}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {text}
          </ReactMarkdown>
          <span className={classes.caret} aria-hidden />
        </Box>
      </Paper>
    </AssistantFrame>
  );
}

/** Tres puntos animados mientras el servidor prepara el primer token. */
export function TypingBubble() {
  return (
    <AssistantFrame>
      <Paper
        className={classes.assistantBubble}
        px="md"
        py="xs"
        radius="lg"
        style={{ borderTopLeftRadius: 4 }}
      >
        <Group gap={0} wrap="nowrap" role="status" aria-label="El asistente está respondiendo">
          <span className={classes.typing} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </Group>
      </Paper>
    </AssistantFrame>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <Group justify="flex-end" wrap="nowrap">
      <Paper className={classes.userBubble} px="md" py="xs" radius="lg" style={{ borderBottomRightRadius: 4 }}>
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Text>
      </Paper>
    </Group>
  );
}
