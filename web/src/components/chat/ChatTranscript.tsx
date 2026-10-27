import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Transition,
  UnstyledButton,
} from '@mantine/core';
import { IconAlertCircle, IconArrowDown, IconRefresh, IconSparkles } from '@tabler/icons-react';
import { useChat } from '../../hooks/useChat';
import {
  MessageBubble,
  StreamingBubble,
  TypingBubble,
  UserBubble,
} from './MessageBubble';
import { ToolActivity } from './ToolActivity';
import { ConfirmationCard } from './ConfirmationCard';
import { ChatSuggestions } from './ChatSuggestions';
import classes from './chat.module.css';

function LoadingSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Stack gap="sm" py={compact ? 'sm' : 'md'}>
      <Skeleton height={16} width="45%" radius="xl" />
      <Skeleton height={compact ? 56 : 84} radius="md" />
      <Skeleton height={16} width="35%" radius="xl" ml="auto" />
      <Skeleton height={44} width="60%" radius="md" ml="auto" />
      <Skeleton height={16} width="50%" radius="xl" />
      <Skeleton height={compact ? 48 : 68} radius="md" />
    </Stack>
  );
}

function EmptyState({
  compact,
  onPick,
}: {
  compact?: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <Center py={compact ? 'md' : 'xl'}>
      <Stack align="center" gap={compact ? 'sm' : 'md'} w="100%">
        <ThemeIcon
          size={compact ? 46 : 58}
          radius="xl"
          className={classes.emptyIcon}
          aria-hidden
        >
          <IconSparkles size={compact ? 22 : 28} />
        </ThemeIcon>
        <Stack gap={4} align="center">
          <Text fw={700} size={compact ? 'sm' : 'lg'} ta="center">
            ¿Qué necesitas de la academia?
          </Text>
          <Text c="dimmed" size={compact ? 'xs' : 'sm'} ta="center" maw={460}>
            Pídeme algo sobre alumnos, pagos, asistencias o la agenda. Antes de
            tocar dinero o personas, te pediré confirmación.
          </Text>
        </Stack>
        <ChatSuggestions onPick={onPick} compact={compact} />
      </Stack>
    </Center>
  );
}

/**
 * Transcripción compartida por la página /admin/chat y el widget flotante.
 *
 * Concentra el scroll inteligente (no arrastra al usuario que está leyendo
 * hacia arriba), los estados de carga y el render de mensajes, para que ambas
 * superficies no vuelvan a divergir.
 */
export function ChatTranscript({
  compact,
  onPickSuggestion,
}: {
  /** Versión estrecha para el panel flotante. */
  compact?: boolean;
  onPickSuggestion: (text: string) => void;
}) {
  const chat = useChat();
  const viewportRef = useRef<HTMLDivElement>(null);
  // Si el usuario se desplaza hacia arriba, dejamos de perseguir el stream.
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 80;
    setShowJump(distance > 240);
  }, []);

  // Cambiar de conversación siempre empieza abajo.
  useEffect(() => {
    stickToBottom.current = true;
    setShowJump(false);
    scrollToBottom('auto');
  }, [chat.activeId, scrollToBottom]);

  // El mensaje recién enviado también: el usuario espera verlo.
  useEffect(() => {
    if (!chat.liveUserText) return;
    stickToBottom.current = true;
    scrollToBottom('smooth');
  }, [chat.liveUserText, scrollToBottom]);

  // Una confirmación pendiente no puede quedar fuera de la vista: es una
  // acción sensible esperando un sí o un no.
  useEffect(() => {
    if (!chat.pendingActions?.length) return;
    stickToBottom.current = true;
    scrollToBottom('smooth');
  }, [chat.pendingActions, scrollToBottom]);

  useEffect(() => {
    if (!stickToBottom.current) return;
    // Durante el stream, saltos instantáneos: el scroll suave se queda atrás.
    scrollToBottom(chat.isStreaming ? 'auto' : 'smooth');
  }, [
    chat.messages,
    chat.streamingText,
    chat.activeTool,
    chat.pendingActions,
    chat.error,
    chat.isStreaming,
    scrollToBottom,
  ]);

  const hasLiveContent =
    !!chat.liveUserText || !!chat.streamingText || !!chat.activeTool || chat.isStreaming;
  const showSkeleton =
    chat.messagesLoading &&
    chat.messages.length === 0 &&
    !chat.liveUserText &&
    !chat.streamingText;

  return (
    <Box className={classes.root}>
      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        viewportRef={viewportRef}
        onScrollPositionChange={handleScroll}
        type="auto"
        offsetScrollbars={!compact}
      >
        <Stack
          gap={compact ? 'sm' : 'md'}
          px={compact ? 'sm' : 'md'}
          py={compact ? 'sm' : 'md'}
          w="100%"
          maw={compact ? undefined : 860}
          mx={compact ? undefined : 'auto'}
        >
          {showSkeleton ? (
            <LoadingSkeleton compact={compact} />
          ) : chat.messages.length === 0 && !hasLiveContent ? (
            <EmptyState compact={compact} onPick={onPickSuggestion} />
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
          {chat.isStreaming && !chat.streamingText && !chat.activeTool && <TypingBubble />}

          {chat.error && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertCircle size={18} />}
              title="No se pudo completar la respuesta"
              role="alert"
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
                    size="compact-sm"
                    leftSection={<IconRefresh size={14} />}
                    onClick={chat.retry}
                    disabled={chat.isStreaming}
                  >
                    Reintentar
                  </Button>
                )}
                <Button size="compact-sm" variant="subtle" color="gray" onClick={chat.dismissError}>
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

      <Transition transition="fade" duration={150} mounted={showJump}>
        {(styles) => (
          <UnstyledButton
            style={styles}
            className={classes.jumpButton}
            onClick={() => {
              stickToBottom.current = true;
              setShowJump(false);
              scrollToBottom('smooth');
            }}
            aria-label="Ir al final de la conversación"
          >
            <IconArrowDown size={14} />
            Ir al final
          </UnstyledButton>
        )}
      </Transition>
    </Box>
  );
}
