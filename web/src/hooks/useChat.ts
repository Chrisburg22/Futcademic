// El estado del chat vive en un Context (ver ../contexts/ChatContext) para
// que el widget flotante y la página /admin/chat compartan la misma
// conversación activa y stream en curso al navegar entre rutas.
export { useChat } from '../contexts/ChatContext';
export type { ChatMessage, ContentBlock, Conversation } from '../contexts/ChatContext';
