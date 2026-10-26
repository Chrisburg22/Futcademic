import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Affix,
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowsMaximize,
  IconMessageChatbot,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useChat } from '../../hooks/useChat';
import { MessageBubble, StreamingBubble, UserBubble } from './MessageBubble';
import { ToolActivity } from './ToolActivity';
import { ConfirmationCard } from './ConfirmationCard';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';

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
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [
    open,
    chat.messages,
    chat.streamingText,
    chat.activeTool,
    chat.pendingActions,
    chat.liveUserText,
    chat.error,
  ]);

  const hasPending = !!chat.pendingActions?.length;
  const hasContent = chat.messages.length > 0 || !!chat.liveUserText;

  return (
    <Affix
      position={{
        // Se aparta del dock de accesos rápidos y de la barra de gestos.
        bottom: 'calc(20px + var(--quick-dock-height, 0px) + env(safe-area-inset-bottom, 0px))',
        right: 20,
      }}
      zIndex={300}
    >
      {open ? (
        <Paper
          withBorder
          shadow="lg"
          radius="md"
          w={{ base: 'calc(100vw - 32px)', xs: 380 }}
          h={540}
          maw={380}
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <Group justify="space-between" px="sm" py="xs" style={{ flexShrink: 0 }}>
            <Group gap="xs">
              <IconMessageChatbot size={20} />
              <Text fw={600} size="sm">
                Asistente IA
              </Text>
            </Group>
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => navigate.push('/admin/chat')}
                aria-label="Ver todas las conversaciones"
                title="Ver todas las conversaciones"
              >
                <IconArrowsMaximize size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Group>
          <Divider />

          <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef} p="sm">
            <Stack gap="sm" pb="xs">
              {chat.messagesLoading ? (
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              ) : !hasContent ? (
                <Stack gap="sm">
                  <Stack gap={2} align="center">
                    <IconMessageChatbot size={28} opacity={0.3} />
                    <Text fw={600} size="sm">
                      ¿Qué necesitas de la academia?
                    </Text>
                    <Text c="dimmed" size="xs" ta="center">
                      Antes de tocar dinero o personas, te pediré confirmación.
                    </Text>
                  </Stack>
                  <ChatSuggestions onPick={chat.sendMessage} compact />
                </Stack>
              ) : (
                chat.messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    feedback={chat.feedback[m.id]}
                    onFeedback={chat.sendFeedback}
                  />
                ))
              )}

              {chat.liveUserText && <UserBubble text={chat.liveUserText} />}
              {chat.streamingText && <StreamingBubble text={chat.streamingText} />}
              {chat.activeTool && <ToolActivity label={chat.activeTool} />}
              {chat.isStreaming && !chat.streamingText && !chat.activeTool && (
                <Group px="xs">
                  <Loader size="xs" type="dots" />
                </Group>
              )}

              {chat.error && (
                <Alert
                  color="red"
                  variant="light"
                  icon={<IconAlertCircle size={16} />}
                  p="xs"
                  title={
                    <Text size="xs" fw={600}>
                      No se pudo completar la respuesta
                    </Text>
                  }
                >
                  <Text size="xs">{chat.error}</Text>
                  {!chat.canRetry && (
                    <Text size="xs" c="dimmed" mt={4}>
                      La acción pudo haberse aplicado. Verifícala antes de repetirla.
                    </Text>
                  )}
                  <Group gap={4} mt={6}>
                    {chat.canRetry && (
                      <Button
                        size="compact-xs"
                        leftSection={<IconRefresh size={12} />}
                        onClick={chat.retry}
                        disabled={chat.isStreaming}
                      >
                        Reintentar
                      </Button>
                    )}
                    <Button size="compact-xs" variant="subtle" color="gray" onClick={chat.dismissError}>
                      Descartar
                    </Button>
                  </Group>
                </Alert>
              )}

              {chat.pendingActions && chat.pendingActions.length > 0 && (
                <ConfirmationCard
                  actions={chat.pendingActions}
                  onRespond={chat.respondConfirmation}
                  disabled={chat.isStreaming}
                />
              )}
            </Stack>
          </ScrollArea>

          <Divider />
          <Group p="xs" style={{ flexShrink: 0 }}>
            <ChatInput
              onSend={chat.sendMessage}
              onStop={chat.stop}
              streaming={chat.isStreaming}
              disabled={!!chat.pendingActions}
              placeholder={chat.pendingActions ? 'Confirma o cancela la acción…' : undefined}
            />
          </Group>
        </Paper>
      ) : (
        <ActionIcon
          size={56}
          radius="xl"
          variant="filled"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente IA"
          pos="relative"
        >
          <IconMessageChatbot size={28} />
          {hasPending && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'var(--mantine-color-red-6)',
                border: '2px solid var(--mantine-color-body)',
              }}
            />
          )}
        </ActionIcon>
      )}
    </Affix>
  );
}
