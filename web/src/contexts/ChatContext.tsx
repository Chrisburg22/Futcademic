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

interface MessagesResponse {
  conversation: {
    id: string;
    title: string | null;
    status: string;
    pending_state: { pending: PendingAction[] } | null;
  };
  messages: ChatMessage[];
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
  sendMessage: (text: string) => void;
  respondConfirmation: (approved: boolean) => void;
  deleteConversation: ReturnType<typeof useMutation<unknown, Error, string>>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

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
  const abortRef = useRef<AbortController | null>(null);

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
  // de conversación). Durante un stream mandan los eventos SSE.
  useEffect(() => {
    if (isStreaming) return;
    const conv = messagesQuery.data?.conversation;
    if (!conv) {
      setPendingActions(null);
      return;
    }
    setPendingActions(
      conv.status === 'awaiting_confirmation' ? conv.pending_state?.pending ?? null : null
    );
  }, [messagesQuery.data, isStreaming]);

  const resetLive = useCallback(() => {
    setLiveUserText(null);
    setStreamingText('');
    setActiveTool(null);
  }, []);

  const selectConversation = useCallback(
    (id: string | null) => {
      abortRef.current?.abort();
      setIsStreaming(false);
      resetLive();
      setPendingActions(null);
      setActiveId(id);
    },
    [resetLive]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const runStream = useCallback(
    async (path: string, body: object) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setStreamingText('');
      setActiveTool(null);

      let conversationId = activeId;
      const handlers: SSEHandlers = {
        conversation: (d) => {
          conversationId = d.id;
          setActiveId((prev) => prev ?? d.id);
        },
        text_delta: (d) => setStreamingText((prev) => prev + d.text),
        tool_start: (d) => setActiveTool(d.label || d.name),
        tool_end: () => setActiveTool(null),
        confirmation_required: (d) => setPendingActions(d.actions),
        error: (d) =>
          notifications.show({ color: 'red', title: 'Asistente IA', message: d.message }),
      };

      try {
        await streamChat(path, body, handlers, controller.signal);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          const message = err instanceof Error ? err.message : 'Error de conexión con el asistente.';
          notifications.show({ color: 'red', title: 'Asistente IA', message });
        }
      } finally {
        setIsStreaming(false);
        resetLive();
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
