import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon,
  Affix,
  Badge,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowsMaximize,
  IconEye,
  IconMessageChatbot,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { useChat } from '../../hooks/useChat';
import { screenContextLabel } from '../../lib/chatScreen';
import { ChatTranscript } from './ChatTranscript';
import { ChatInput } from './ChatInput';
import classes from './chat.module.css';

/**
 * Bola flotante presente en toda la app admin (montada en AppShell). Abre un
 * panel compacto que comparte estado con la página /admin/chat vía
 * ChatContext — la conversación activa y el stream en curso persisten al
 * navegar o al abrir/cerrar el widget.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const chat = useChat();
  const navigate = useRouter();
  const pathname = usePathname();

  // Cerrar con Escape es el gesto esperado en cualquier panel flotante.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // En la página del asistente el widget sobra y tapaba la conversación.
  if (pathname === '/admin/chat') return null;

  const pendingCount = chat.pendingActions?.length ?? 0;
  const hasPending = pendingCount > 0;
  const contextLabel = screenContextLabel(chat.screenContext);
  const status = chat.isStreaming
    ? 'Respondiendo…'
    : hasPending
      ? 'Esperando tu confirmación'
      : 'Pregunta lo que necesites';

  return (
    <Affix
      position={{
        // Se aparta del dock de accesos rápidos y de la barra de gestos.
        bottom: 'calc(16px + var(--quick-dock-height, 0px) + env(safe-area-inset-bottom, 0px))',
        right: 16,
      }}
      zIndex={300}
    >
      {open ? (
        <Paper
          withBorder
          shadow="xl"
          radius="lg"
          w={{ base: 'calc(100vw - 32px)', xs: 400 }}
          maw={400}
          h="min(78dvh, 600px)"
          className={classes.widgetPanel}
          style={{ maxHeight: 'calc(100dvh - 32px - var(--quick-dock-height, 0px))' }}
        >
          <Group justify="space-between" wrap="nowrap" gap="xs" px="sm" py="xs">
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <ThemeIcon size={36} radius="xl" variant="light" color="futcamedic" aria-hidden>
                <IconMessageChatbot size={20} />
              </ThemeIcon>
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text fw={700} size="sm" lh={1.2}>
                  Asistente IA
                </Text>
                <Text size="10px" c="dimmed" lh={1.2} truncate>
                  {status}
                </Text>
              </Stack>
            </Group>

            <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Tooltip label="Nueva conversación" withArrow>
                <ActionIcon
                  size={36}
                  variant="subtle"
                  color="gray"
                  onClick={() => chat.selectConversation(null)}
                  aria-label="Nueva conversación"
                >
                  <IconPlus size={17} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Abrir en pantalla completa" withArrow>
                <ActionIcon
                  size={36}
                  variant="subtle"
                  color="gray"
                  onClick={() => navigate.push('/admin/chat')}
                  aria-label="Abrir en pantalla completa"
                >
                  <IconArrowsMaximize size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Cerrar (Esc)" withArrow>
                <ActionIcon
                  size={36}
                  variant="subtle"
                  color="gray"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar asistente"
                >
                  <IconX size={17} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <Divider />

          {contextLabel && (
            <Group
              px="sm"
              py={6}
              gap={6}
              wrap="nowrap"
              className={classes.contextStrip}
            >
              <IconEye size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
              <Text size="xs" c="dimmed" truncate>
                Viendo: {contextLabel}
              </Text>
            </Group>
          )}

          <ChatTranscript compact onPickSuggestion={chat.sendMessage} />

          <Divider />
          <Group p="xs" style={{ flexShrink: 0 }}>
            <ChatInput
              onSend={chat.sendMessage}
              onStop={chat.stop}
              streaming={chat.isStreaming}
              disabled={!!chat.pendingActions}
              placeholder={
                chat.pendingActions
                  ? 'Confirma o cancela la acción…'
                  : chat.isStreaming
                    ? 'El asistente está respondiendo…'
                    : undefined
              }
            />
          </Group>
        </Paper>
      ) : (
        <Tooltip label="Asistente IA" position="left" withArrow>
          <ActionIcon
            size={58}
            radius="xl"
            variant="filled"
            onClick={() => setOpen(true)}
            className={classes.fab}
            aria-label="Abrir asistente IA"
            pos="relative"
          >
            <IconMessageChatbot size={28} />
            {hasPending && (
              <Badge
                size="xs"
                circle
                color="red"
                className={classes.fabBadge}
                aria-hidden
              >
                {pendingCount}
              </Badge>
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </Affix>
  );
}
