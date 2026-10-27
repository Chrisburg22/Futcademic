import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Drawer,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHistory, IconMessageChatbot, IconPlus } from '@tabler/icons-react';
import { useChat } from '../../hooks/useChat';
import { ChatTranscript } from '../../components/chat/ChatTranscript';
import { ChatInput } from '../../components/chat/ChatInput';
import { ConversationList } from '../../components/chat/ConversationList';
import classes from '../../components/chat/chat.module.css';

// Ocupa exactamente el alto útil del AppShell; en móvil usa dvh para que el
// teclado y la barra del navegador no escondan el composer.
const PAGE_HEIGHT =
  'calc(100dvh - var(--app-shell-header-height, 60px) - 32px - env(safe-area-inset-bottom, 0px))';

export function ChatPage() {
  const chat = useChat();
  const [historyOpen, history] = useDisclosure(false);
  const active = chat.conversations.find((c) => c.id === chat.activeId);

  const startNew = () => {
    chat.selectConversation(null);
    history.close();
  };

  return (
    <>
      <Flex gap="md" align="stretch" style={{ height: PAGE_HEIGHT, minHeight: 0 }}>
        {/* Historial: panel fijo en escritorio, drawer en móvil. */}
        <Paper
          visibleFrom="sm"
          withBorder
          radius="lg"
          w={280}
          p="sm"
          style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}
        >
          <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={startNew}
              fullWidth
              variant="light"
            >
              Nueva conversación
            </Button>
            <ConversationList
              conversations={chat.conversations}
              loading={chat.conversationsLoading}
              activeId={chat.activeId}
              onSelect={chat.selectConversation}
              onDelete={(id) => chat.deleteConversation.mutate(id)}
            />
          </Stack>
        </Paper>

        <Paper
          withBorder
          radius="lg"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Group
            justify="space-between"
            wrap="nowrap"
            gap="sm"
            px="md"
            py="sm"
            style={{ flexShrink: 0 }}
          >
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <ThemeIcon size={40} radius="md" variant="light" color="futcamedic" aria-hidden>
                <IconMessageChatbot size={22} />
              </ThemeIcon>
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Title order={4} lh={1.2}>
                  Asistente IA
                </Title>
                <Text size="xs" c="dimmed" truncate>
                  {active?.title || 'Pregunta sobre alumnos, pagos, asistencias o la agenda'}
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
              <ActionIcon
                hiddenFrom="sm"
                size={40}
                variant="subtle"
                onClick={history.open}
                aria-label="Ver conversaciones"
              >
                <IconHistory size={20} />
              </ActionIcon>
              <ActionIcon
                hiddenFrom="sm"
                size={40}
                variant="light"
                onClick={startNew}
                aria-label="Nueva conversación"
              >
                <IconPlus size={20} />
              </ActionIcon>
            </Group>
          </Group>

          <Divider />

          <ChatTranscript onPickSuggestion={chat.sendMessage} />

          <Box className={classes.composerArea} p="md">
            <Box maw={860} mx="auto" w="100%">
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
              <Text size="xs" c="dimmed" ta="center" mt={6}>
                El asistente puede equivocarse: verifica las acciones sensibles.
              </Text>
            </Box>
          </Box>
        </Paper>
      </Flex>

      <Drawer
        opened={historyOpen}
        onClose={history.close}
        title={
          <Text fw={700} size="md">
            Conversaciones
          </Text>
        }
        position="left"
        size="xs"
        padding="md"
      >
        <Stack gap="sm" h="100%">
          <Button leftSection={<IconPlus size={16} />} onClick={startNew} fullWidth variant="light">
            Nueva conversación
          </Button>
          <ConversationList
            conversations={chat.conversations}
            loading={chat.conversationsLoading}
            activeId={chat.activeId}
            onSelect={chat.selectConversation}
            onDelete={(id) => chat.deleteConversation.mutate(id)}
            onNavigate={history.close}
          />
        </Stack>
      </Drawer>
    </>
  );
}
