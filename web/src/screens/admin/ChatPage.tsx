import { useEffect, useRef } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Loader,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconMessageChatbot,
  IconPlus,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { useChat } from '../../hooks/useChat';
import { MessageBubble, StreamingBubble, UserBubble } from '../../components/chat/MessageBubble';
import { ToolActivity } from '../../components/chat/ToolActivity';
import { ConfirmationCard } from '../../components/chat/ConfirmationCard';
import { ChatInput } from '../../components/chat/ChatInput';
import { ChatSuggestions } from '../../components/chat/ChatSuggestions';

export function ChatPage() {
  const chat = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo cuando llegan mensajes o texto en streaming
  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [
    chat.messages,
    chat.streamingText,
    chat.activeTool,
    chat.pendingActions,
    chat.liveUserText,
    chat.error,
  ]);

  return (
    <Flex gap="md" h="calc(100vh - 120px)">
      {/* Lista de conversaciones */}
      <Paper withBorder radius="md" w={260} p="sm" visibleFrom="sm">
        <Stack gap="xs" h="100%">
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => chat.selectConversation(null)}
            fullWidth
          >
            Nueva conversación
          </Button>
          <Divider />
          <ScrollArea style={{ flex: 1 }}>
            {chat.conversationsLoading ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : (
              chat.conversations.map((c) => (
                <NavLink
                  key={c.id}
                  label={
                    <Text size="sm" truncate>
                      {c.title || 'Sin título'}
                    </Text>
                  }
                  active={c.id === chat.activeId}
                  onClick={() => chat.selectConversation(c.id)}
                  rightSection={
                    <ActionIcon
                      component="span"
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        chat.deleteConversation.mutate(c.id);
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  }
                />
              ))
            )}
          </ScrollArea>
        </Stack>
      </Paper>

      {/* Área de chat */}
      <Paper withBorder radius="md" p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Group gap="xs" mb="sm">
          <IconMessageChatbot size={22} />
          <Title order={4}>Asistente IA</Title>
        </Group>
        <Divider mb="sm" />

        <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef} offsetScrollbars>
          <Stack gap="sm" pb="sm">
            {chat.messagesLoading ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : chat.messages.length === 0 && !chat.liveUserText ? (
              <Center py="xl">
                <Stack align="center" gap="md" w="100%">
                  <IconMessageChatbot size={40} opacity={0.3} />
                  <Stack gap={4} align="center">
                    <Text fw={600}>¿Qué necesitas de la academia?</Text>
                    <Text c="dimmed" size="sm" ta="center">
                      Pregunta o da una orden en tus palabras. Antes de tocar dinero o
                      personas, el asistente te pedirá confirmación.
                    </Text>
                  </Stack>
                  <ChatSuggestions onPick={chat.sendMessage} />
                </Stack>
              </Center>
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
              <Group px="sm">
                <Loader size="xs" type="dots" />
              </Group>
            )}

            {chat.error && (
              <Alert
                color="red"
                variant="light"
                icon={<IconAlertCircle size={18} />}
                title="El asistente no pudo completar la respuesta"
              >
                <Text size="sm">{chat.error}</Text>
                {!chat.canRetry && (
                  <Text size="xs" c="dimmed" mt={4}>
                    La acción pudo haberse aplicado. Verifícala antes de repetirla.
                  </Text>
                )}
                <Group gap="xs" mt="sm">
                  {chat.canRetry && (
                    <Button
                      size="compact-xs"
                      leftSection={<IconRefresh size={14} />}
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

        <Divider my="sm" />
        <ChatInput
          onSend={chat.sendMessage}
          onStop={chat.stop}
          streaming={chat.isStreaming}
          disabled={!!chat.pendingActions}
          placeholder={
            chat.pendingActions
              ? 'Confirma o cancela la acción pendiente…'
              : chat.isStreaming
                ? 'El asistente está respondiendo…'
                : undefined
          }
        />
      </Paper>
    </Flex>
  );
}
