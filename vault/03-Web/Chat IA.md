---
tipo: manual
actualizado: 2026-10-27
tags:
  - web
  - chat
---

# Chat IA

Asistente administrativo de la academia. Ejecuta tareas en lenguaje natural
(consultar pagos, registrar cobros, invitar profesores) y **pide confirmación**
antes de tocar dinero o personas.

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Estado compartido | `web/src/contexts/ChatContext.tsx` |
| Cliente SSE | `web/src/api/chatStream.ts` |
| Página completa | `web/src/screens/admin/ChatPage.tsx` |
| Widget flotante | `web/src/components/chat/ChatWidget.tsx` |
| Mensajes y feedback | `web/src/components/chat/MessageBubble.tsx` |
| Confirmación sensible | `web/src/components/chat/ConfirmationCard.tsx` |
| Sugerencias con datos | `web/src/components/chat/ChatSuggestions.tsx` |
| Contexto de pantalla (web) | `web/src/lib/chatScreen.ts` · `web/src/contexts/ChatScreenContext.ts` |
| Contexto de pantalla (API) | `backend/api/services/chat/screen-context.ts` |
| Loop del agente | `backend/api/services/chat/agent.ts` |
| Herramientas (34) | `backend/api/services/chat/tools.ts` |
| Resúmenes humanos | `backend/api/services/chat/describe.ts` |
| Persistencia | `backend/api/services/chat/store.ts` |
| Rutas | `backend/api/routes/chat.routes.ts` |

El `ChatProvider` envuelve `AppShell`, así que el widget y `/admin/chat`
comparten conversación activa y stream en curso. Ver [[Hooks y endpoints]] y
[[Rutas web]].

## Flujo de un turno

1. `POST /chat/conversations/:id/messages` (o `new`) responde SSE. El cuerpo
   puede llevar `context` (ver abajo).
2. El agente llama herramientas seguras y emite `tool_start` / `tool_end`.
3. Si encuentra una herramienta sensible, guarda `pending_state`, emite
   `confirmation_required` y termina con `done { awaiting_confirmation: true }`.
4. `POST /chat/conversations/:id/confirm { approved }` ejecuta o cancela y
   reanuda el loop.
5. Si el cliente cierra la conexión (botón Detener), el servidor aborta el
   turno y cierra los `tool_use` huérfanos.

Solo hay 8 herramientas sensibles: borrar alumno/evento/sede, registrar pagos
(alumno y profesor) e invitar profesor/padre/admin. La lista vive en
`SENSITIVE_TOOLS` dentro de `tools.ts`.

## Contexto de pantalla

El asistente recibe dónde está el admin para resolver "este alumno", "esta
categoría" o "este mes" sin que lo repita. Cada mensaje puede llevar:

```json
{
  "message": "¿Debe algo este alumno?",
  "context": {
    "screen": "Ficha del alumno",
    "entity": { "type": "alumno", "id": "<uuid>", "name": "Carlos López" },
    "filters": [{ "label": "Mes", "value": "octubre" }]
  }
}
```

- **Web**: la ruta da un contexto genérico (`screenFromPath`); las fichas de
  alumno, profesor y categoría registran el registro en foco con
  `useRegisterChatScreen`. Finanzas registra el mes (`YYYY-MM`) y la pestaña
  activa, para no repetir el periodo. El widget muestra "Viendo: …" cuando hay
  contexto.
- **API**: `sanitizeScreenContext` impone topes, exige UUID válido y descarta
  entidades sin tipo. El bloque se añade al sistema **aparte y sin
  `cache_control`**, para no invalidar el prefijo cacheado al cambiar de
  pantalla, y se marca como datos: el modelo no debe obedecer instrucciones
  escritas dentro. Si un filtro activo responde la pregunta, se pasa tal cual a
  la herramienta.
- Los IDs vienen del cliente, pero las herramientas siguen filtrando por
  `school_id`: un ID manipulado no abre otra academia.

## Confianza y recuperación

- La tarjeta de confirmación **no muestra UUIDs**: `describe.ts` resuelve
  nombres, montos y fechas contra la base de datos con el `school_id` del
  tenant. Si la resolución falla, se usa la etiqueta de la herramienta.
- El chat se puede detener a mitad de respuesta; las herramientas ya ejecutadas
  quedan registradas y las pendientes se cierran como canceladas.
- Los errores se muestran inline con `Reintentar`. El reintento manda
  `retry: true` para no duplicar el mensaje del usuario. No se ofrece reintento
  tras una confirmación sensible porque la acción pudo haberse aplicado.

## Datos para el modelo propio

Dos tablas de instrumentación (ver [[Tablas]]) y una columna:

- `chat_feedback`: 👍/👎 por mensaje, con motivo (`datos_incorrectos`,
  `no_era_eso`, `incompleta`, `no_ejecuto`). Un voto por usuario y mensaje.
- `chat_tool_calls`: nombre, input, resultado, latencia y si fue una acción
  sensible confirmada o cancelada.
- `chat_messages.context` (jsonb): contexto de pantalla que acompañó al
  mensaje del usuario; sale como `screen_context` en el JSONL.

Exportación a JSONL (una línea por respuesta del asistente, con contexto
conversacional, contexto de pantalla, feedback y herramientas del turno):

```bash
cd backend
npx ts-node scripts/export-chat-dataset.ts --school <uuid> --out ruta.jsonl
```

⚠️ El archivo contiene datos personales de menores: no se versiona ni se envía
a terceros sin autorización.

### Volumen al 27 de octubre de 2026

| Tabla | Filas |
| --- | --- |
| `chat_conversations` | 15 |
| `chat_messages` | 122 |
| `chat_feedback` | 1 |
| `chat_tool_calls` | 5 |

El cuello de botella no es el código sino el feedback: 122 mensajes son ~61
respuestas del asistente y solo una está valorada. El fine-tuning necesita
turnos **corregidos**, no solo mensajes.

## Ruta hacia el modelo propio

**Estado:** Fase 0 (confianza) y Fase 1 (contexto + evaluación) cerradas; el
PR #11 está mergeado en `main`. Faltan fine-tuning y self-host, más ampliar la
evaluación con feedback real.

1. **Datos** (en curso): feedback + trazas + exportador listos; falta volumen
   de uso real.
2. **Evaluación** (hecha): 38 casos reales en `backend/scripts/eval/cases.json`
   que miden selección de herramienta y evitación de acciones peligrosas **sin
   ejecutar herramientas ni tocar la base de datos**. Se ejecuta con
   `npm run eval:chat` (filtros `--category`, `--limit`, `--model`), reutiliza
   el prompt y las 34 herramientas reales, y guarda el informe en
   `scripts/eval/last-run.json`. Línea base: **38/38** con
   `claude-haiku-4-5` (varianza de ±1 caso entre pasadas). Se amplía con
   feedback real hasta ~100 casos.
3. **Fine-tuning** (pendiente): con 1,000–5,000 turnos corregidos, LoRA sobre
   un modelo abierto pequeño (Qwen/Llama). Comparar contra el modelo actual
   antes de cambiar nada.
4. **Self-host** (pendiente): solo si privacidad, volumen o coste lo justifican.

Entrenar una base desde cero no es viable con los datos de una academia; el
lock-in real está en `chat_messages.content` (bloques con formato Anthropic) y
en la llamada directa al SDK, no en el modelo.

## Ver también

Endpoints, *tools* sensibles y tablas del lado servidor: [[Chat IA - backend]].
