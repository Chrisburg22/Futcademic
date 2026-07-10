import { supabase } from '../config/supabase';

// Cliente SSE del chat IA. EventSource no soporta POST ni el header
// Authorization, así que usamos fetch + ReadableStream y parseamos SSE a mano.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface PendingAction {
  tool_use_id: string;
  name: string;
  label: string;
  input: Record<string, unknown>;
}

export interface SSEHandlers {
  conversation?: (d: { id: string; title: string }) => void;
  text_delta?: (d: { text: string }) => void;
  tool_start?: (d: { name: string; label: string }) => void;
  tool_end?: (d: { name: string; ok: boolean }) => void;
  confirmation_required?: (d: { actions: PendingAction[] }) => void;
  done?: (d: { awaiting_confirmation?: boolean }) => void;
  error?: (d: { message: string }) => void;
}

export async function streamChat(
  path: string,
  body: object,
  handlers: SSEHandlers,
  signal?: AbortSignal
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = `Error ${res.status}`;
    try {
      const json = await res.json();
      message = json.error || message;
    } catch {
      /* cuerpo no JSON */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (raw.startsWith(':')) continue; // heartbeat

      const event = raw.match(/^event: (.*)$/m)?.[1];
      const data = raw.match(/^data: (.*)$/m)?.[1];
      if (event && data) {
        try {
          (handlers as Record<string, ((d: unknown) => void) | undefined>)[event]?.(JSON.parse(data));
        } catch (err) {
          console.error('Error procesando evento SSE', event, err);
        }
      }
    }
  }
}
