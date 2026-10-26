import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { api } from '../api/axios';
import { streamChat, type PendingAction, type SSEHandlers } from '../api/chatStream';

export interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type FeedbackRating = 'up' | 'down';

interface MessagesResponse {
  conversation: {
    id: string;
    title: string | null;
    status: string;
    pending_state: { pending: PendingAction[] } | null;
  };
  messages: ChatMessage[];
  /** Voto ya emitido por este usuario, por id de mensaje. */
  feedback?: Record<string, FeedbackRating>;
}

interface ChatContextValue {
  conversations: Conversation[];
  conversationsLoading: boolean;
  activeId: string | null;
  selectConversation: (id: string | null) => void;
  messages: ChatMessage[];
  messagesLoading: boolean;
  isStreaming: boolean;
  liveUserText: string | null;
  streamingText: string;
  activeTool: string | null;
  pendingActions: PendingAction[] | null;
  /** Último error del turno; se pinta inline con opción de reintentar. */
  error: string | null;
  /** false cuando reintentar podría duplicar una acción sensible ya aplicada. */
  canRetry: boolean;
  dismissError: () => void;
  retry: () => void;
  stop: () => void;
  feedback: Record<string, FeedbackRating>;
  sendFeedback: (messageId: string, rating: FeedbackRating, reason?: string) => void;
  sendMessage: (text: string) => void;
  respondConfirmation: (approved: boolean) => void;
  deleteConversation: ReturnType<typeof useMutation<unknown, Error, string>>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface LastRequest {
  path: string;
  body: Record<string, unknown>;
  /** Conversación creada por el turno (para no crear otra al reintentar). */
  conversationId: string | null;
}

/**
 * Vive por encima de AppShell (una sola instancia) para que el estado del
 * chat (conversación activa, streaming en curso) sobreviva la navegación
 * entre rutas — el widget flotante y la página /admin/chat comparten el
 * mismo estado en vez de tener cada uno su propia conexión SSE.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveUserText, setLiveUserText] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, FeedbackRating>>({});
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<LastRequest | null>(null);

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: ['chat-conversations'],
    queryFn: async () => (await api.get('/chat/conversations')).data,
  });

  const messagesQuery = useQuery<MessagesResponse>({
    queryKey: ['chat-messages', activeId],
    queryFn: async () => (await api.get(`/chat/conversations/${activeId}/messages`)).data,
    enabled: !!activeId,
  });

  // Sincronizar la confirmación pendiente desde el servidor (recargas, cambio
  // de conversación). Durante un stream mandan los eventos SSE; por eso este
  // efecto solo reacciona a datos nuevos y no al flag isStreaming (que
  // pintaría datos viejos al terminar cada turno).
  useEffect(() => {
    const conv = messagesQuery.data?.conversation;
    if (!conv) {
      setPendingActions(null);
      return;
    }
    setPendingActions(
      conv.status === 'awaiting_confirmation' ? conv.pending_state?.pending ?? null : null
    );
  }, [messagesQuery.data]);

  // El servidor es la fuente de verdad del feedback ya emitido.
  useEffect(() => {
    setFeedback(messagesQuery.data?.feedback ?? {});
  }, [messagesQuery.data]);

  const resetLive = useCallback(() => {
    setLiveUserText(null);
    setStreamingText('');
    setActiveTool(null);
  }, []);

  const selectConversation = useCallback(
    (id: string | null) => {
      abortRef.current?.abort();
      abortRef.current = null;
      setIsStreaming(false);
      resetLive();
      setPendingActions(null);
      setError(null);
      setFeedback({});
      setActiveId(id);
    },
    [resetLive]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const runStream = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setStreamingText('');
      setActiveTool(null);
      setError(null);

      let conversationId = activeId;
      lastRequestRef.current = { path, body, conversationId };

      const handlers: SSEHandlers = {
        conversation: (d) => {
          conversationId = d.id;
          if (lastRequestRef.current) lastRequestRef.current.conversationId = d.id;
          setActiveId((prev) => prev ?? d.id);
        },
        text_delta: (d) => setStreamingText((prev) => prev + d.text),
        tool_start: (d) => setActiveTool(d.label || d.name),
        tool_end: () => setActiveTool(null),
        confirmation_required: (d) => setPendingActions(d.actions),
        error: (d) => {
          setCanRetry(!path.includes('/confirm'));
          setError(d.message);
        },
      };

      try {
        await streamChat(path, body, handlers, controller.signal);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setCanRetry(!path.includes('/confirm'));
          setError(err instanceof Error ? err.message : 'Error de conexión con el asistente.');
        }
      } finally {
        // Si ya hay otro turno en curso (el usuario detuvo y reenvió), no se
        // toca su estado: solo se refrescan los datos.
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsStreaming(false);
          resetLive();
        }
        await qc.invalidateQueries({ queryKey: ['chat-conversations'] });
        if (conversationId) {
          await qc.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        }
      }
    },
    [activeId, qc, resetLive]
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setLiveUserText(trimmed);
      setPendingActions(null);
      void runStream(`/chat/conversations/${activeId ?? 'new'}/messages`, { message: trimmed });
    },
    [activeId, isStreaming, runStream]
  );

  const respondConfirmation = useCallback(
    (approved: boolean) => {
      if (!activeId || isStreaming) return;
      setPendingActions(null);
      void runStream(`/chat/conversations/${activeId}/confirm`, { approved });
    },
    [activeId, isStreaming, runStream]
  );

  /** Corta el turno en curso: el servidor deja de ejecutar herramientas. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    resetLive();
  }, [resetLive]);

  const dismissError = useCallback(() => setError(null), []);

  /**
   * Repite el último turno. `retry: true` le dice al servidor que el mensaje
   * del usuario ya está guardado y no debe duplicarse.
   */
  const retry = useCallback(() => {
    const last = lastRequestRef.current;
    if (!last || isStreaming) return;
    const path =
      last.conversationId && last.path.includes('/conversations/new/')
        ? last.path.replace('/conversations/new/', `/conversations/${last.conversationId}/`)
        : last.path;
    void runStream(path, { ...last.body, retry: true });
  }, [isStreaming, runStream]);

  /**
   * Señal humana sobre una respuesta. Se guarda de inmediato (aunque el
   * usuario no elija motivo) porque es también el dataset del modelo propio.
   */
  const sendFeedback = useCallback(
    (messageId: string, rating: FeedbackRating, reason?: string) => {
      setFeedback((prev) => ({ ...prev, [messageId]: rating }));
      api
        .post(`/chat/messages/${messageId}/feedback`, {
          rating,
          reason: rating === 'down' ? reason ?? null : null,
        })
        .catch(() => {
          setFeedback((prev) => {
            const next = { ...prev };
            delete next[messageId];
            return next;
          });
          notifications.show({
            color: 'red',
            title: 'Asistente IA',
            message: 'No se pudo guardar tu valoración.',
          });
        });
    },
    []
  );

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/chat/conversations/${id}`)).data,
    onSuccess: (_, id) => {
      if (id === activeId) selectConversation(null);
      qc.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });

  const value: ChatContextValue = {
    conversations: conversationsQuery.data ?? [],
    conversationsLoading: conversationsQuery.isLoading,
    activeId,
    selectConversation,
    messages: messagesQuery.data?.messages ?? [],
    messagesLoading: !!activeId && messagesQuery.isLoading,
    isStreaming,
    liveUserText,
    streamingText,
    activeTool,
    pendingActions,
    error,
    canRetry,
    dismissError,
    retry,
    stop,
    feedback,
    sendFeedback,
    sendMessage,
    respondConfirmation,
    deleteConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat debe usarse dentro de <ChatProvider>');
  return ctx;
}
