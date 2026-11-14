# Bóveda de la app Futcademic · 03-Web

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Chat IA

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

---

## Nota: Convenciones web

# Convenciones web

## Antes de escribir código Next

`web/AGENTS.md` lo dice explícito: **esta versión de Next no es la que conoces**. Lee la guía relevante en `web/node_modules/next/dist/docs/` antes de usar una API que no tengas clara.

## Reglas del proyecto

1. **Nunca crear `src/pages/`**: Next lo trataría como Pages Router y rompería el App Router.
2. `app/**/page.tsx` es un wrapper fino: importa la pantalla y declara `ProtectedRoute roles`. La lógica va en `src/screens/`.
3. Todo es cliente: no hacer fetching de datos en server components.
4. Navegación con `next/navigation` y `next/link`. `<Redirect>` propio en vez de `<Navigate>`.
5. No reintroducir `react-router-dom`.

## Acceso a datos

```text
screen → hook (TanStack) → api (axios + JWT) → Express
```

- Los hooks viven en `src/hooks/`, uno por dominio.
- `src/api/axios.ts` inyecta el `access_token` de Supabase en cada request.
- Supabase directo **solo** para auth y perfil (`AuthContext`, pantallas de auth). No agregar consultas directas en hooks.

## Caché

- `src/lib/queryClient.ts` usa storage no-op en servidor para que la hidratación sea idéntica.
- `Providers` persiste solo queries exitosas y permitidas (`shouldPersistQueryKey`).
- `NEXT_PUBLIC_BUILD_ID` cambia en cada build y actúa como `buster`: evita rehidratar datos con forma vieja.

## Hidratación

Cualquier chequeo que dependa del navegador (PWA, iOS, `window`) debe correr **después de montar** (`useEffect`), no durante el render. Si no, hay mismatch y se puede perder lo escrito en formularios.

## PWA y uso sin conexión

- `app/manifest.ts` sirve `/manifest.webmanifest`; Next inyecta el `<link rel="manifest">`.
- `public/sw.js` es un service worker a mano (sin Workbox ni Serwist) con dos
  cachés: `futcademic-assets` cache-first para `/_next/static` y estáticos
  (inmutables por hash, no se purgan entre despliegues) y `futcademic-docs`
  network-first para HTML y payloads RSC, con clave sin query string para no
  guardar tokens. `/offline` es el fallback de navegación. `/api/**` y los otros
  orígenes nunca se cachean.
- `src/components/pwa/ServiceWorkerRegistration.tsx` lo registra **solo en
  producción** (en desarrollo lo desinstala: un SW con chunks viejos rompe el
  HMR) y le pasa por `postMessage` los recursos de la primera carga.
- `src/lib/offlineAuth.ts` es lo que hace que la app abra sin red:
  `supabase.auth.getSession()` devuelve `null` cuando el refresh del token no
  tiene conexión, así que `AuthContext` cae a la sesión escrita en localStorage
  y al último perfil descargado, y `onAuthStateChange` ignora una sesión nula
  salvo en `SIGNED_OUT`. Todo se borra al cerrar sesión.
- Verificación: `npm run test:pwa` (build de producción + `e2e/pwa.spec.ts`).

## Escribir sin conexión

No hay cola propia: es la de TanStack Query. Con `networkMode: 'online'` una
mutación sin red queda **pausada**, el persister la guarda y `onlineManager` la
reanuda al volver la conexión.

- `src/lib/offlineMutations.ts` registra con `setMutationDefaults` la
  `mutationFn`, el optimista y los `invalidateQueries` de lo que entra en cola
  (pase de lista, completar entrenamiento, cobro de alumno, pago a profesor).
  Tienen que estar en los defaults: al rehidratar solo sobrevive la
  `mutationKey`, no la función ni los callbacks del hook.
- La caché optimista del pase de lista tiene que tener la forma de un
  `Attendance` real (`type`, `date`, `training_id`): `marcasDeRegistros`
  descarta las filas incompletas y las marcas no volverían tras recargar.
- Los hooks solo declaran `mutationKey`. Las pantallas **no** pueden
  `await mutateAsync` (la promesa de una mutación pausada no resuelve hasta que
  vuelva la red): usan `mutate` con callbacks y `willQueueOffline()` para
  redactar el aviso.
- `OfflineQueueBadge` muestra «N por enviar»; cerrar sesión con cola pendiente
  pide confirmación porque `clearPersistedCache` la borra.
- `queryClient.ts` sincroniza `onlineManager` con `navigator.onLine` al
  arrancar: sin eso, una app abierta ya sin red se cree conectada (los eventos
  `online`/`offline` nunca llegaron) y gasta la cola contra el vacío.

## Fechas

`src/lib/dates.ts` extiende dayjs con `customParseFormat` y fija el locale en
español; `Providers` monta un `DatesProvider` con `locale: 'es'` y la semana
empezando en lunes (Mantine no lee el locale global de dayjs). Sin eso,
`format('ddd DD MMM')` salía en inglés ("Tue 27 Oct").

## Estilos

Mantine es la base (tema en `src/lib/theme.ts`); Tailwind se usa para utilidades. `postcss-preset-mantine` está configurado. Evitar CSS global nuevo sin necesidad.

## Pruebas

- `npm run build` incluye typecheck: es la verificación mínima.
- `npm run test:e2e` usa backend mockeado y levanta el dev server.
- `npm run test:smoke` golpea producción y crea academias reales: solo con `ALLOW_PROD_SMOKE=yes` y conciencia del daño.

Ver [[Comandos y verificacion]] y [[Rutas web]].

---

## Nota: Hooks y endpoints

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Hooks y endpoints

Qué hook de TanStack Query llama a qué endpoint. Se lee de `web/src/hooks/*.ts`.

- **17 de 19 hooks** con llamadas literales, **90 llamadas**.
- Los hooks con URL construida en una variable aparecen abajo.
- No incluye `web/src/contexts/`: el chat (SSE) vive en `ChatContext.tsx`; ver [[Chat IA]].

## useAchievements.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/achievements` | useAchievements.ts:8 |
| `POST` | `/achievements/check` | useAchievements.ts:17 |

## useAttendances.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/attendances/student/${studentId}` | useAttendances.ts:19 |
| `PATCH` | `/attendances/trainings/${trainingId}/complete` | useAttendances.ts:27 |
| `POST` | `/attendances` | useAttendances.ts:41 |

## useCategories.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/categories/mine` | useCategories.ts:33 |
| `GET` | `/categories` | useCategories.ts:44 |
| `GET` | `/categories?${params.toString()}` | useCategories.ts:64 |
| `GET` | `/categories/${id}` | useCategories.ts:76 |
| `POST` | `/categories` | useCategories.ts:87 |
| `PATCH` | `/categories/${id}` | useCategories.ts:96 |
| `POST` | `/categories/full` | useCategories.ts:117 |
| `PATCH` | `/categories/${payload.id}/status` | useCategories.ts:130 |
| `POST` | `/categories/${payload.categoryId}/teachers` | useCategories.ts:144 |
| `DELETE` | `/categories/${payload.categoryId}/teachers/${payload.teacherId}` | useCategories.ts:159 |

## useDashboard.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/dashboard/admin` | useDashboard.ts:8 |
| `GET` | `/dashboard/profesor` | useDashboard.ts:15 |
| `GET` | `/dashboard/padre` | useDashboard.ts:22 |
| `GET` | `/dashboard/alumno` | useDashboard.ts:29 |

## useEnrollment.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `POST` | `/enrollment/invitations` | useEnrollment.ts:85 |
| `GET` | `/enrollment/invitations` | useEnrollment.ts:93 |
| `DELETE` | `/enrollment/invitations/${id}` | useEnrollment.ts:99 |
| `GET` | `/enrollment/applications${qs ? ` | useEnrollment.ts:116 |
| `GET` | `/enrollment/applications/${id}` | useEnrollment.ts:123 |
| `POST` | `/enrollment/applications/${payload.id}/approve` | useEnrollment.ts:136 |
| `POST` | `/enrollment/applications/${payload.id}/reject` | useEnrollment.ts:152 |
| `POST` | `/enrollment/applications/${id}/reopen` | useEnrollment.ts:161 |
| `PATCH` | `/enrollment/applications/${payload.application_id}/documents/${payload.document_id}` | useEnrollment.ts:176 |
| `GET` | `/enrollment/consent-template` | useEnrollment.ts:191 |

## useEvents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/events/${eventId}` | useEvents.ts:28 |
| `GET` | `/events/${eventId}/trainings` | useEvents.ts:37 |
| `POST` | `/events` | useEvents.ts:54 |
| `PUT` | `/events/${id}` | useEvents.ts:73 |
| `POST` | `/events/cancel` | useEvents.ts:88 |
| `DELETE` | `/events/${id}` | useEvents.ts:100 |

## useExpediente.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/students/${studentId}/expediente` | useExpediente.ts:8 |
| `POST` | `/students/${studentId}/consent` | useExpediente.ts:27 |
| `POST` | `/students/${payload.studentId}/documents` | useExpediente.ts:52 |
| `PATCH` | `/students/${studentId}/documents/${documentId}` | useExpediente.ts:75 |
| `DELETE` | `/students/${payload.studentId}/documents/${payload.documentId}` | useExpediente.ts:88 |
| `POST` | `/students/${studentId}/documents/reuse-tutor` | useExpediente.ts:100 |
| `GET` | `/students/${studentId}/tutor-documents/availability` | useExpediente.ts:111 |
| `GET` | `/students/${studentId}/consent.pdf` | useExpediente.ts:122 |
| `GET` | `/students/${studentId}/expediente/package` | useExpediente.ts:129 |

## useMe.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `PATCH` | `/users/me/profile` | useMe.ts:16 |
| `POST` | `/users/me/complete-onboarding` | useMe.ts:21 |

## useNotifications.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/notifications` | useNotifications.ts:8 |
| `PATCH` | `/notifications/${id}/read` | useNotifications.ts:16 |
| `PATCH` | `/notifications/read-all` | useNotifications.ts:24 |

## useParents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/parents/me/children` | useParents.ts:7 |
| `POST` | `/parents/link-child` | useParents.ts:17 |
| `DELETE` | `/parents/children/${id}` | useParents.ts:29 |

## usePayments.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/payments?${params.toString()}` | usePayments.ts:20 |
| `GET` | `/payments/summary?year=${year}` | usePayments.ts:31 |
| `GET` | `/payments/pending?month=${month}&year=${year}` | usePayments.ts:45 |
| `GET` | `/payments/student/${studentId}` | usePayments.ts:53 |
| `GET` | `/payments/account-statement/${studentId}` | usePayments.ts:61 |
| `POST` | `/payments/students` | usePayments.ts:74 |
| `POST` | `/payments/teachers` | usePayments.ts:87 |

## usePermissions.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/permissions/mine` | usePermissions.ts:9 |
| `GET` | `/permissions/${teacherId}` | usePermissions.ts:17 |
| `PUT` | `/permissions/${id}` | usePermissions.ts:28 |

## useSettings.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `PUT` | `/schools/${id}` | useSettings.ts:8 |

## useStudents.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/students?parent_id=me` | useStudents.ts:7 |
| `POST` | `/students` | useStudents.ts:35 |
| `GET` | `/students/${studentId}` | useStudents.ts:43 |
| `PUT` | `/students/${id}` | useStudents.ts:67 |
| `PATCH` | `/students/${payload.id}/uniform` | useStudents.ts:80 |
| `PATCH` | `/students/${payload.id}/status` | useStudents.ts:94 |
| `PATCH` | `/students/${id}/status` | useStudents.ts:114 |
| `PATCH` | `/students/${id}/uniform` | useStudents.ts:116 |
| `PUT` | `/students/${id}` | useStudents.ts:118 |
| `DELETE` | `/students/${id}` | useStudents.ts:132 |
| `GET` | `/students/${studentId}/stats` | useStudents.ts:141 |
| `GET` | `/students/${studentId}/team` | useStudents.ts:148 |
| `GET` | `/students/deleted` | useStudents.ts:155 |

## useUpload.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `POST` | `/upload/avatar` | useUpload.ts:11 |
| `POST` | `/upload/logo` | useUpload.ts:24 |

## useUsers.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/users` | useUsers.ts:8 |
| `GET` | `/users?role=profesor` | useUsers.ts:14 |
| `GET` | `/users/teachers/${teacherId}` | useUsers.ts:22 |
| `PUT` | `/users/${id}` | useUsers.ts:31 |
| `PATCH` | `/users/me/password-changed` | useUsers.ts:47 |
| `POST` | `/auth/invite-parent` | useUsers.ts:55 |
| `POST` | `/auth/invite-teacher` | useUsers.ts:69 |
| `POST` | `/auth/invite-admin` | useUsers.ts:78 |

## useVenues.ts

| Método | Endpoint | Línea |
| --- | --- | --- |
| `GET` | `/venues` | useVenues.ts:8 |
| `POST` | `/venues` | useVenues.ts:16 |
| `PATCH` | `/venues/${id}` | useVenues.ts:25 |
| `DELETE` | `/venues/${id}` | useVenues.ts:34 |

## Llamadas con URL dinámica

El generador no puede resolver estas URLs; se mantienen a mano.

| Hook | Endpoints |
| --- | --- |
| `useEvents.ts` | `GET /events`, `GET /events/trainings` |
| `useAttendances.ts` | `GET /attendances/category/:id` |
| `usePayments.ts` | `GET /payments` |
| `useDashboard.ts` | `GET /dashboard/admin\|profesor\|padre\|alumno` |
| `useStudents.ts` | `GET /students` |

---

## Nota: Mapa web

# Mapa web

## Stack

Next.js 16 (App Router) · React 19 · Mantine 7 · TanStack Query 5 · axios · Supabase JS · Tailwind (utilidades).

## Estructura

```text
web/
├── app/
│   ├── layout.tsx            único server component: metadata + Providers
│   ├── (auth)/               área pública: login, register, invite…
│   └── (app)/                área autenticada: ProtectedRoute → AuthGate → AppShell
├── src/
│   ├── screens/              implementación real de cada pantalla
│   ├── hooks/                TanStack Query + axios
│   ├── api/axios.ts          baseURL + interceptor JWT
│   ├── contexts/AuthContext  sesión, perfil, signOut
│   ├── components/           layout, auth, chat, attendance, finances, common
│   ├── lib/queryClient.ts    caché persistida y buster por build
│   └── types/index.ts        tipos del dominio
├── e2e/                      Playwright con backend mockeado
└── next.config.ts            inyecta NEXT_PUBLIC_BUILD_ID
```

## Árbol de providers

```text
app/layout.tsx (server)
└── Providers (client)
    ├── MantineProvider
    ├── Notifications + ModalsProvider
    └── PersistQueryClientProvider
        └── AuthProvider
            └── children
```

`app/(app)/layout.tsx` añade `ProtectedRoute` (sesión) → `AuthGate` (contraseña/onboarding) → `AppShell`.

## Auth y sesión

- `supabase` se crea en `src/config/supabase.ts` con `localStorage` y `autoRefreshToken`.
- `AuthContext` escucha `onAuthStateChange`, carga el perfil de `users` y el extra de `profile_information`.
- `AuthGate` fuerza:
  - `/change-password` si `must_change_password`;
  - `/onboarding` si rol `profesor|padre|alumno` y no tiene `onboarded_at`.
- `ProtectedRoute` solo decide qué mostrar; **la seguridad real está en la API**.

## Datos

- Hooks → `api` (axios) → Express. Ver [[Hooks y endpoints]].
- Excepción deliberada: auth/perfil usan Supabase directo.
- La caché se persiste en localStorage (no en SSR) y se invalida al cambiar `NEXT_PUBLIC_BUILD_ID`.
- No hay `src/pages/`: sería el Pages Router y rompería la app.

## Navegación

- `useRouter`, `useParams`, `usePathname` de `next/navigation`; `Link` de `next/link`.
- `<Redirect>` propio reemplaza a `<Navigate>` de React Router. No reintroducir `react-router-dom`.

Ver [[Convenciones web]] y [[Rutas web]].

---

## Nota: Modulo Alumnos

# Módulo Alumnos

El listado y la ficha de alumnos del admin y del profesor. Se rediseñaron el
27-oct para que el listado responda "a quién falta atender" y la ficha reúna
todo lo de un alumno en pestañas; ese mismo día se ampliaron los filtros, la
tabla pasó a ser configurable y el estado del listado se movió a la URL.

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Listado: KPIs, filtros, orden, paginación, acciones masivas | `web/src/screens/admin/StudentsPage.tsx` |
| Indicadores clicables | `web/src/screens/admin/components/StudentsSummary.tsx` |
| Búsqueda y filtros | `web/src/screens/admin/components/StudentsToolbar.tsx` |
| Tabla (escritorio) y tarjetas (móvil) | `web/src/screens/admin/components/StudentsTable.tsx` |
| Formulario de edición compartido | `web/src/screens/admin/components/StudentEditForm.tsx` |
| Ficha con pestañas | `web/src/screens/admin/StudentDetailPage.tsx` |
| Pestaña Pagos | `StudentPaymentsPanel.tsx` (misma carpeta `components/`) |
| Pestaña Asistencia y tarjeta del resumen | `components/attendance/StudentAttendanceHistory.tsx` · `StudentAttendanceCard.tsx` (ver [[Modulo Asistencias\|Módulo Asistencias]]) |
| Filtros, orden, estado en la URL, pendientes, CSV | `web/src/lib/students.ts` |
| Preferencias de tabla (columnas, densidad, por página) | `web/src/hooks/useLocalPref.ts` |
| Recordatorio al tutor | `web/src/screens/admin/components/TutorReminderModal.tsx` |
| Acción masiva | `useBulkUpdateStudents` en `web/src/hooks/useStudents.ts` |
| E2E | `web/e2e/alumnos.spec.ts` |
| E2E de Inicio | `web/e2e/inicio.spec.ts` |

Ver [[Alumnos y acceso]], [[Hooks y endpoints]] y [[Pantallas]].

## Decisiones

- **Filtrado, orden y paginación en el cliente.** `GET /students` solo filtra por
  categoría y no pagina. Producción tiene ~350 alumnos, así que se trae la
  lista una vez y se trabaja en memoria (25 por página). Si pasa de unos miles,
  habrá que mover búsqueda y paginación al backend.
- **Indicadores = filtros.** Cada tarjeta (activos, pendientes de pago, con
  adeudo, expediente incompleto, sin tutor, inactivos) aplica el filtro que
  cuenta.
- **Once filtros, en dos niveles.** A la vista: búsqueda, categoría, estado y
  expediente. Detrás de «Más filtros»: pago del mes, uniforme, tutor, contacto
  de emergencia, notas médicas, año de nacimiento y fecha de alta. Encima de la
  tabla, el atajo «Por atender» deja solo a quien tiene algo urgente
  (`requiereAtencion`). Cada filtro activo se pinta como etiqueta que se quita
  por separado (`chipsDeFiltros`).
- **El adeudo no viene en `GET /students`.** Se cruza con `GET /payments/pending`
  (solo admin, por eso `useGetPendingPayments` acepta `enabled`) y se pasa a
  `filtrarAlumnos` / `ordenarAlumnos` / `resumirAlumnos` como `ContextoAlumnos`.
  Un enlace directo a `?adeudo=con` muestra el esqueleto hasta que llega la
  cobranza, en vez de «ningún alumno coincide».
- **Filtros, orden y página viven en la query** (`leerEstadoDeUrl` /
  `escribirEstadoEnUrl`): se comparte una vista, el botón atrás no la pierde e
  Inicio enlaza a «los 4 sin tutor» con `enlaceAlListado`. Se lee con
  `useSearchParams` —en una navegación suave `window.location.search` todavía
  no está puesto al primer render—, de ahí el `<Suspense>` en
  `app/(app)/admin/students/page.tsx`. Se escribe con `history.replaceState`
  para no llenar el historial.
- **La tabla la configura quien la usa**: columnas visibles, densidad y filas
  por página se guardan en `localStorage` (`useLocalPref`). Por omisión se
  muestran las columnas que caben sin scroll horizontal; edad, contacto,
  alta y «por atender» se encienden a mano.
- **Un solo formulario de edición** (`StudentEditForm`): en el panel lateral
  del listado y en la pestaña Datos de la ficha. Avisa de cambios sin guardar,
  resume los errores arriba con enlace al campo y deja la barra de guardado
  pegada al pie (apartada del dock móvil y del botón del chat). Desde el
  27-oct también mide la ficha ("completa al 57%") con enlace a cada dato que
  falta, copia nombre y teléfono del tutor al contacto de emergencia y guarda
  con ⌘/Ctrl + S.
- **El nombre se manda dos veces.** `PUT /students/:id` lee `fullName`; mandar
  solo `full_name` devolvía 200 sin guardar nada. Ver [[Deriva conocida]].
- **De una ficha a la siguiente.** La ficha trae «anterior / siguiente» sobre
  la lista ordenada por nombre, con la posición («3 de 30»), porque revisar
  expedientes o cobros se hace de uno en uno. Las pestañas avisan de lo que
  falta (documentos pendientes, deuda) y la cabecera lleva a llamar o escribir
  por WhatsApp al tutor.
- **Acciones masivas sin endpoint masivo**: una petición por alumno con
  `Promise.allSettled`; si alguna falla, quedan seleccionados solo los fallidos.
- **El profesor** no ve estado, baja, pagos ni equipo (el backend los limita a
  admin): la UI los oculta en vez de dejar que den 403.
- **Cambio de temporada**: se filtra por categoría, se seleccionan *todos los
  filtrados* (no solo los de la página) y se usa "Mover de categoría".
- **Recordar al tutor**: desde "Por atender" en la ficha, arma un mensaje con los
  documentos que faltan (`student_expediente_status.missing_documents`) y/o la
  deuda, y abre `wa.me` con la lada 52 si el teléfono tiene 10 dígitos. No envía
  nada desde el servidor.
- El expediente tiene cuatro estados: `completo`, `en_revision`, `incompleto`
  y `sin_tutor`. "Expediente incompleto" cuenta solo `incompleto` con tutor.
- La pestaña de la ficha vive en el hash (`#datos`, `#pagos`…).
- **Asistencia en la ficha**: el resumen trae una tarjeta con el porcentaje de
  los últimos 90 días, la última asistencia y las faltas seguidas, y la
  pestaña avisa con un badge naranja cuando el alumno está en riesgo. El
  historial completo (periodo, tipo, meses, sesiones y CSV) es el mismo
  componente que usa el padre en `/attendance`.

## Estados del alumno

La UI y el controlador usan `activo`, `pendiente_pago`, `becado`, `inactivo`.
`schema.sql` declaraba un CHECK con `beca` y `pendiente`; la base de producción
nunca lo tuvo (el 27-oct solo había `activo` e `inactivo`). Se alineó
`schema.sql` y se añadió `migrations/20261027_students_status_values.sql`, que
normaliza los valores antiguos y crea el CHECK nuevo; **hay que aplicarla a
producción a mano**, después de desplegar el backend. `normalizarEstado` acepta
ambos juegos mientras tanto.

`getPendingPayments` ignoraba `pendiente_pago` (un alumno marcado así
desaparecía de pendientes de pago). Corregido en el repo del backend, rama
`fix/pending-payments-pendiente-pago`.

## Otros hallazgos

- `GET /students/:id/team` y `GET /payments/account-statement/:id` son solo
  admin (y alumno / padre): la ficha del profesor no los pide.
- `PUT /students/:id` y `PATCH /students/:id/uniform` no pasan por
  `requireTeacherPermission('can_manage_students')`, a diferencia del resto de
  rutas de expediente.
- El estado de cuenta calcula el mes en curso con la fecha de vencimiento
  `2026-MM-10` escrita a mano.

---

## Nota: Modulo Asistencias

# Módulo Asistencias

La pantalla `/attendance` y el historial de asistencia de un alumno. Se
rehízo el 27-oct: el pase de lista pasó a ser una herramienta de cancha
(sesión del día, tri-estado, filtros, tabla configurable) y el histórico pasó
a responder "quién está dejando de venir", no solo "qué pasó cada día".

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Pantalla y estado (categoría, fecha, tipo, marcas) | `web/src/screens/AttendancePage.tsx` |
| Contexto de la sesión: categoría, fecha, tipo, sesión agendada | `web/src/components/attendance/AttendanceSessionBar.tsx` |
| Lista con filtros, orden, columnas y marcas | `web/src/components/attendance/RollCallList.tsx` |
| Cifras del pase y barra de guardado | `web/src/components/attendance/RollCallStatus.tsx` |
| Histórico de la categoría (por alumno y por sesión) | `web/src/components/attendance/CategoryAttendanceHistory.tsx` |
| Historial de un alumno (ficha y vista del padre) | `web/src/components/attendance/StudentAttendanceHistory.tsx` |
| Tarjeta de asistencia del resumen de la ficha | `web/src/components/attendance/StudentAttendanceCard.tsx` |
| Dominio: marcas, estadísticas, riesgo, periodos, CSV, URL | `web/src/lib/attendance.ts` |
| Hooks | `web/src/hooks/useAttendances.ts` |
| E2E | `web/e2e/asistencias.spec.ts` |

Ver [[Asistencias]] (backend), [[Hooks y endpoints]] y [[Pantallas]].

## Decisiones

- **«Sin marcar» existe en la pantalla, no en la base.** `attendances.present`
  es un booleano, así que cada alumno se marca con dos botones (presente /
  ausente) y el segundo clic quita la marca. Al guardar, si queda alguien sin
  marcar se pide confirmación diciendo que se guardará como **ausente**: antes
  el interruptor daba por ausente a todo el que nadie tocara, en silencio.
- **Los inactivos no entran al pase de lista** salvo que alguien los marque a
  mano. El backend borra y reinserta por alumno (`saveAttendances`), así que
  mandarlos sin marca los registraría como faltas.
- **La sesión del calendario se elige sola.** `GET /events/trainings?date=`
  da las sesiones del día; la elegida viaja como `training_id` y es lo que
  hace que el backend marque el entrenamiento como completado. Si no hay
  ninguna, se dice y se puede pasar lista igual (queda sin sesión ligada).
- **Lo ya guardado se precarga, pero nunca pisa lo que el profesor marcó**
  (`sucio`): mismo criterio que el formulario de la ficha. Cambiar de
  categoría, fecha o tipo con marcas sin guardar pide confirmación, y
  `beforeunload` avisa al cerrar la pestaña.
- **El historial previo va junto a la marca**: porcentaje, faltas seguidas,
  última asistencia, notas médicas y teléfono del tutor son columnas
  elegibles (`useLocalPref`, igual que en alumnos). Ordenar por "peor
  asistencia" o "sin marcar primero" es lo que hace rápido pasar lista en una
  categoría grande.
- **Riesgo de deserción**: menos de `PORCENTAJE_RIESGO` (60%) con al menos 4
  sesiones, o `FALTAS_SEGUIDAS_RIESGO` (3) faltas seguidas. Es el único
  número que el admin pide de verdad al histórico, así que aparece como filtro
  ("En riesgo"), como aviso y como columna.
- **Dos vistas del histórico**: por alumno (tabla ordenable con porcentaje,
  faltas seguidas, última asistencia y tendencia de las últimas 8 sesiones) y
  por sesión (acordeón con quién asistió y quién faltó, con atajo para abrir
  el pase de lista de ese día). Ambas exportan CSV.
- **El estado viaja en la query** (`vista`, `categoria`, `fecha`, `tipo`,
  `periodo`, `detalle`): se comparte "el histórico de la Sub-12 a 90 días" y
  el botón atrás no lo pierde. Por eso `app/(app)/attendance/page.tsx` monta
  la pantalla dentro de `<Suspense>`.
- **Cada rol ve lo suyo**: el padre elige hijo (o entra directo si solo tiene
  uno) y el alumno ve su propio historial. Antes ambos caían en el pase de
  lista, que para un alumno es un 403 (`findStudentForTenant`).
- **Referencias estables**: `data = []` en los hooks crea un array nuevo en
  cada render; con un `useEffect` que precarga marcas eso es un bucle infinito.
  Los arrays vacíos son constantes de módulo y las marcas se comparan por
  contenido (`mismasMarcas`).

## Lo que no se puede hacer sin backend

- **Justificar una falta o marcar retardo**: `attendances` solo tiene
  `present` booleano. La UI no inventa un estado que no se puede guardar.
- **Avisar al tutor desde el servidor**: el recordatorio sigue siendo abrir
  WhatsApp desde el navegador ([[Modulo Alumnos]]).
- **Rachas**: nadie escribe `current_streak` (ver [[Asistencias]]); el
  porcentaje y las faltas seguidas de esta pantalla se calculan en el cliente
  a partir de las marcas.

---

## Nota: Modulo Categorias

# Módulo Categorías

Una categoría es el **equipo por generación**: agrupa jugadores de uno o dos
años de nacimiento, tiene entrenadores, horario, mensualidad y aforo. Es el eje
del modelo: `students`, `events`, `trainings` y `attendances` cuelgan de ella,
y la deuda de cada alumno se calcula con su `monthly_fee`.

## Dónde vive

| Capa | Archivo |
| --- | --- |
| Lista, filtros y edición | `web/src/screens/admin/CategoriesPage.tsx` |
| Detalle con métricas y pestañas | `web/src/screens/admin/CategoryDetailPage.tsx` |
| Campos y validación compartidos | `web/src/screens/admin/components/CategoryFormFields.tsx` |
| Asistente de creación (3 pasos) | `web/src/screens/admin/components/CategoryWizard.tsx` |
| Plantel y cuerpo técnico | `web/src/screens/admin/components/CategoryMembersPanel.tsx` |
| Ficha de solo lectura | `web/src/components/categories/CategorySummary.tsx` |
| Formato y estados | `web/src/lib/categories.ts` |
| Hooks | `web/src/hooks/useCategories.ts` |
| Histórico de asistencias | `web/src/components/attendance/CategoryAttendanceHistory.tsx` |
| Controlador | `backend/api/controllers/category.controller.ts` |
| Rutas | `backend/api/routes/category.routes.ts` |
| Permiso de profesor | `backend/api/middlewares/permission.middleware.ts` |
| Recorte por rol | `backend/api/services/access.ts` |
| E2E | `web/e2e/categorias.spec.ts` · fixtures en `web/e2e/helpers.ts` |
| Tests de API | `backend/api/__tests__/category.test.ts` |

Ver [[API - rutas]], [[Hooks y endpoints]], [[Rutas web]] y [[Tablas]].

## La generación (`birth_year`)

`categories.birth_year` es **`text`, no un entero**, y guarda la etiqueta de la
generación tal como la escribe la academia:

- un año suelto: `2015`
- un rango: `2014-2015`, `2012-2013-2014`
- un grupo sin año: `Porteros`, `2014-2015 Femenil`

En la base de producción, 16 de 27 categorías usan algo que no es un año
suelto, así que el `MultiSelect` del panel antiguo no era un bug: era la forma
en que se agrupan generaciones. El campo del formulario es un `Autocomplete`
que sugiere años pero acepta cualquier texto, y `formatearGeneracion` muestra
la etiqueta sin tocarla.

El backend la valida como texto de 1 a 40 caracteres y la recorta; el filtro
compara como texto, porque con `Number()` no encontraría `2014-2015`.

**No hay columna de año final.** `birth_year_end` llegó a existir un día,
pensada para un `birth_year` entero, y se quita en
`migrations/20261027_categories_drop_birth_year_end.sql`.

`categories_school_id_birth_year_key` es un UNIQUE sobre `(school_id,
birth_year)` que ya venía de antes: repetir una generación en la misma escuela
da 23505, que el controlador traduce a 409. Ver [[Deriva conocida]].

## Ciclo de vida

| Estado | Qué significa |
| --- | --- |
| `activa` | Aparece en el listado y en los selectores de alumnos, agenda y asistencias. |
| `inactiva` | Pausada: se conserva todo, pero deja de ofrecerse como opción nueva. |
| `archivada` | Fuera del listado por defecto. Sella `archived_at`; restaurar lo limpia. |

**No hay borrado duro.** `students`, `events`, `trainings` y `attendances`
apuntan a la categoría sin `ON DELETE`, así que borrarla rompería el historial.
`PATCH /api/categories/:id/status` es el único camino, y el diálogo de archivar
avisa de los jugadores que seguirán generando mensualidad.

El índice único `categories_school_name_uniq` impide dos categorías vivas con
el mismo nombre en una escuela, y deja libre el nombre en cuanto se archiva
(para reusarlo en una temporada nueva). **En producción no llegó a crearse**:
`Alcones Rayados` tiene `Sub14` y `SUB14`, que solo se diferencian en las
mayúsculas. Mientras sigan ahí, esa unicidad la cubre solo el controlador.

## Permisos por rol

| Rol | Qué puede hacer |
| --- | --- |
| `super_admin`, `admin` | Todo: crear, editar, archivar, restaurar, asignar plantel y cuerpo técnico. |
| `profesor` con `can_manage_categories` | Crear, y editar o asignar **solo en sus propias categorías** (`category_teachers`). |
| `profesor` sin el permiso | Solo lectura de sus categorías (`GET /categories/mine`). Sin botón de crear ni de editar. |
| `padre` | Lectura de las categorías de sus hijos, desde "Mis hijos". |
| `alumno` | Lectura de la suya, desde "Mi equipo". |

`teacher_permissions.can_manage_categories` existía en la base y en los toggles
de `TeacherDetailPage` sin que ninguna ruta lo consultara: ahora lo aplica
`requireTeacherPermission('can_manage_categories')`, que **no expone `.roles`**
a propósito, porque `api/scripts/dump-routes.ts` toma el primer handler con
`roles` para el contrato y ese debe seguir siendo el `requireRole` de la ruta.

`GET /api/categories` y `GET /api/categories/:id` se quedan sin `requireRole`
porque sirven a los cinco roles; el recorte lo hace `categoryIdsForTenant` /
`findCategoryForTenant` por dato, y están declaradas en el
`SIN_ROLES_JUSTIFICADO` de `rbac.test.ts`.

## Vista de las familias

Padre y alumno **no entran al módulo de gestión**. Los dos ven la misma ficha,
`CategorySummary` (color, años, compañeros, entrenadores y horario), alimentada
por `GET /api/students/:id/team`:

- alumno → "Mi equipo" (`web/src/screens/TeamPage.tsx`)
- padre → "Mis hijos", desplegable por hijo (`web/src/screens/ChildrenPage.tsx`)

Ese endpoint devuelve los entrenadores como `{ id, name, avatar, phone }` y los
horarios como `{ name, time, venue }`. No son `full_name`, `day` ni
`start_time`: leerlos con esos nombres deja la pantalla vacía. El 27-oct se
corrigieron las fixtures de `e2e/fase4.spec.ts` y `e2e/demo-manual.spec.ts`,
que seguían con la forma vieja y hacían fallar "Mi equipo" aunque la pantalla
estaba bien.

## Lista y paginación

`GET /api/categories` sigue devolviendo un **array plano** (lo consumen los
selectores de alumnos, agenda, asistencias y export) y publica el total en la
cabecera `X-Total-Count`, expuesta en el CORS de `api/app.ts`. Acepta `search`,
`status`, `birth_year`, `teacher_id`, `sort` (lista blanca), `order`, `page` y
`per_page`.

- `useGetCategories()` → array, para los selectores.
- `useGetCategoriesPaged(filtros)` → `{ items, total }`, solo para el módulo.
- `useGetCategory(id)` → detalle con métricas; antes el detalle pedía **todas**
  las categorías y filtraba en cliente.

## Horario

`POST /api/categories/full` crea la categoría y genera los entrenamientos.
`days` acepta **números 0-6** (0 = domingo) o nombres en inglés
(`monday`…`sunday`), que es lo que mandan las tools del chat; antes los nombres
producían `NaN` y fechas inválidas. Sin `days` no se genera nada y la categoría
se crea igual. Ver [[Chat IA]].

---

## Nota: Pantallas

# Pantallas

`web/app/**/page.tsx` es un envoltorio; la implementación vive en `web/src/screens/`.

## Públicas y de sesión

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/login` | `auth/LoginPage` | login de staff (email) |
| `/student-login` | `auth/StudentLoginPage` | login de alumno por username |
| `/register` | `auth/RegisterPage` | crear academia + admin |
| `/accept-invite` | `auth/AcceptInvitePage` | aceptar invitación con `token_hash` |
| `/change-password` | `auth/ChangePasswordPage` | cambio obligatorio de contraseña |
| `/forgot-password` | `auth/ForgotPasswordPage` | pedir correo de recuperación |
| `/reset-password` | `auth/ResetPasswordPage` | fijar contraseña nueva desde el correo |
| `/onboarding` | `OnboardingPage` | completar perfil de profesor/padre/alumno |
| `/profile` | `ProfilePage` | perfil propio |

## Panel

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/` | `DashboardPage` | elige `AdminDashboard`, `TeacherDashboard`, `ParentDashboard` o `StudentDashboard`; el de admin es el tablero de la jornada |
| `/achievements` | `AchievementsPage` | logros y progreso |
| `/attendance` | `AttendancePage` | pase de lista e histórico; el padre y el alumno ven historial |
| `/finances` | `FinancesPage` | bandeja de cobranza, pagos, nómina y salud del mes; el padre ve el estado de cuenta de sus hijos |
| `/children` | `ChildrenPage` | hijos del padre; vincular/desvincular |
| `/stats` | `StatsPage` | estadísticas del alumno |
| `/team` | `TeamPage` | compañeros de categoría |

## Administración

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/admin/students` | `admin/StudentsPage` | listado con KPIs, filtros, orden, acciones masivas y exportación; alta y baja |
| `/admin/students/[id]` | `admin/StudentDetailPage` | ficha en pestañas: resumen, datos, expediente, pagos, asistencia |
| `/admin/categories` | `admin/CategoriesPage` | categorías y cuotas |
| `/admin/categories/[id]` | `admin/CategoryDetailPage` | alumnos y profesores de la categoría |
| `/admin/teachers` | `admin/TeachersPage` | listado de profesores |
| `/admin/teachers/[id]` | `admin/TeacherDetailPage` | ficha y permisos |
| `/admin/events` | `admin/EventsPage` | calendario, recurrencia, cancelaciones |
| `/admin/venues` | `admin/VenuesPage` | sedes |
| `/admin/enrollments` | `admin/EnrollmentApplicationsPage` | solicitudes de inscripción e invitaciones por link |
| `/admin/enrollments/[id]` | `admin/EnrollmentApplicationDetailPage` | revisar una solicitud: datos, documentos, aprobar o rechazar |
| `/admin/chat` | `admin/ChatPage` | asistente IA con confirmación de acciones |

`/attendance` se rehízo el 27-oct, ver [[Modulo Asistencias|Módulo Asistencias]]:
pase de lista con sesión del día, tri-estado y filtros, e histórico por alumno
o por sesión. Su estado también viaja en la query (`?categoria=…&vista=historico`),
de ahí el `<Suspense>` en `app/(app)/attendance/page.tsx`.

Ambas se rediseñaron el 27-oct, ver [[Modulo Alumnos|Módulo Alumnos]]. El listado
abre `InviteStudentModal` para mandar un link de inscripción y la ficha monta
`StudentExpediente` (expediente, documentos y consentimiento). Los filtros del
listado viajan en la query (`?tutor=sin`, `?adeudo=con`), que es como Inicio
enlaza a cada aviso.

## Inicio del administrador

`screens/dashboard/AdminDashboard` responde "qué hay que hacer hoy", no
"cuántos alumnos tengo":

| Bloque | Componente | De dónde sale |
|---|---|---|
| Indicadores con contexto | `dashboard/components/MetricCard` | `GET /dashboard/admin` + `GET /payments/pending` |
| Por atender | `dashboard/components/WorkQueueCard` | `GET /students` cruzado con la cobranza; cada línea enlaza al listado filtrado |
| Próximos 7 días | `dashboard/components/AgendaCard` | `upcomingEvents` de `GET /dashboard/admin` |
| Altas recientes | `dashboard/components/RecentStudentsCard` | `GET /students`, últimos 30 días |

`upcomingEvents` y `pendingPayments` ya venían en el endpoint y la pantalla
anterior no los usaba.

## Inscripción pública

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/inscripcion/[token]` | `enrollment/PublicEnrollmentPage` | el tutor llena el expediente desde el link, sin cuenta |

Vive **fuera** del shell autenticado: no pasa por `AppShell` ni por
`ProtectedRoute`, y su `layout.tsx` fuerza `robots: noindex, nofollow, nocache`
y `referrer: no-referrer` porque la URL lleva el token. La única credencial es
ese token; ver [[Roles y permisos#Rutas públicas por token]].

## Ajustes

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/settings/edit-academy` | `settings/EditAcademyPage` | nombre y logo de la academia |
| `/settings/edit-profile` | `settings/EditProfilePage` | datos personales |
| `/settings/security` | `settings/SecurityPage` | contraseña y seguridad |
| `/settings/notifications` | `settings/NotificationsPage` | preferencias de aviso |
| `/settings/export` | `settings/ExportPage` | descarga CSV |
| `/settings/support` | `settings/SupportPage` | soporte |
| `/settings/terms` | `settings/TermsPage` | términos |

## Componentes clave

| Componente | Rol |
|---|---|
| `components/layout/AppShell` | shell autenticado (sidebar + header) |
| `components/layout/Sidebar` | navegación por rol |
| `components/layout/NotificationBell` | avisos |
| `components/layout/ProtectedRoute` | guard de sesión/rol en cliente |
| `components/auth/AuthGate` | redirecciones de contraseña/onboarding |
| `components/chat/*` | conversación SSE y confirmaciones |
| `components/attendance/*` | lista y marcado |
| `screens/admin/components/StudentWizard` | alta de alumno por pasos |
| `screens/admin/components/StudentExpediente` | expediente, documentos y consentimiento en la ficha |
| `screens/admin/components/InviteStudentModal` | genera y comparte el link de inscripción |
| `screens/enrollment/ConsentCaptureForm` | firma del consentimiento |
| `screens/enrollment/labels` | etiquetas del formulario público |

> [!warning] `/settings/export` no declara roles
> La pantalla es visible para cualquier autenticado, pero `GET /export/payments` y `/export/attendance` son solo admin. Un profesor o padre que pulse esos botones recibe error. Ver [[Deriva conocida]].

---

## Nota: Rutas web

<!-- No editar a mano: python3 scripts/vault/vault.py generar -->

# Rutas web

Páginas de `web/app/**/page.tsx`: ruta, roles del `ProtectedRoute` y pantalla real que montan.

- **35 rutas**.
- `cualquier autenticado` = la página no declara `roles` pero vive en `app/(app)` y pasa por el layout protegido.
- La implementación está en `web/src/screens/`; la página solo envuelve.

| Ruta | Acceso | Pantalla | Archivo |
| --- | --- | --- | --- |
| `/` | cualquier autenticado | `DashboardPage` | `app/(app)/page.tsx` |
| `/accept-invite` | público | `auth/AcceptInvitePage` | `app/(auth)/accept-invite/page.tsx` |
| `/achievements` | alumno, super_admin, admin | `AchievementsPage` | `app/(app)/achievements/page.tsx` |
| `/admin/categories` | super_admin, admin, profesor | `admin/CategoriesPage` | `app/(app)/admin/categories/page.tsx` |
| `/admin/categories/[id]` | super_admin, admin, profesor | `admin/CategoryDetailPage` | `app/(app)/admin/categories/[id]/page.tsx` |
| `/admin/chat` | super_admin, admin | `admin/ChatPage` | `app/(app)/admin/chat/page.tsx` |
| `/admin/enrollments` | super_admin, admin, profesor | `admin/EnrollmentApplicationsPage` | `app/(app)/admin/enrollments/page.tsx` |
| `/admin/enrollments/[id]` | super_admin, admin, profesor | `admin/EnrollmentApplicationDetailPage` | `app/(app)/admin/enrollments/[id]/page.tsx` |
| `/admin/events` | super_admin, admin | `admin/EventsPage` | `app/(app)/admin/events/page.tsx` |
| `/admin/students` | super_admin, admin, profesor | `admin/StudentsPage` | `app/(app)/admin/students/page.tsx` |
| `/admin/students/[id]` | super_admin, admin, profesor | `admin/StudentDetailPage` | `app/(app)/admin/students/[id]/page.tsx` |
| `/admin/teachers` | super_admin, admin | `admin/TeachersPage` | `app/(app)/admin/teachers/page.tsx` |
| `/admin/teachers/[id]` | super_admin, admin | `admin/TeacherDetailPage` | `app/(app)/admin/teachers/[id]/page.tsx` |
| `/admin/venues` | super_admin, admin | `admin/VenuesPage` | `app/(app)/admin/venues/page.tsx` |
| `/attendance` | cualquier autenticado | `AttendancePage` | `app/(app)/attendance/page.tsx` |
| `/change-password` | con sesión | `auth/ChangePasswordPage` | `app/(auth)/change-password/page.tsx` |
| `/children` | padre | `ChildrenPage` | `app/(app)/children/page.tsx` |
| `/finances` | super_admin, admin, padre | `FinancesPage` | `app/(app)/finances/page.tsx` |
| `/forgot-password` | público | `auth/ForgotPasswordPage` | `app/(auth)/forgot-password/page.tsx` |
| `/inscripcion/[token]` | cualquier autenticado | `enrollment/PublicEnrollmentPage` | `app/inscripcion/[token]/page.tsx` |
| `/login` | público | `auth/LoginPage` | `app/(auth)/login/page.tsx` |
| `/onboarding` | cualquier autenticado | `OnboardingPage` | `app/(app)/onboarding/page.tsx` |
| `/profile` | cualquier autenticado | `ProfilePage` | `app/(app)/profile/page.tsx` |
| `/register` | público | `auth/RegisterPage` | `app/(auth)/register/page.tsx` |
| `/reset-password` | público | `auth/ResetPasswordPage` | `app/(auth)/reset-password/page.tsx` |
| `/settings/edit-academy` | super_admin, admin | `settings/EditAcademyPage` | `app/(app)/settings/edit-academy/page.tsx` |
| `/settings/edit-profile` | cualquier autenticado | `settings/EditProfilePage` | `app/(app)/settings/edit-profile/page.tsx` |
| `/settings/export` | cualquier autenticado | `settings/ExportPage` | `app/(app)/settings/export/page.tsx` |
| `/settings/notifications` | cualquier autenticado | `settings/NotificationsPage` | `app/(app)/settings/notifications/page.tsx` |
| `/settings/security` | cualquier autenticado | `settings/SecurityPage` | `app/(app)/settings/security/page.tsx` |
| `/settings/support` | cualquier autenticado | `settings/SupportPage` | `app/(app)/settings/support/page.tsx` |
| `/settings/terms` | cualquier autenticado | `settings/TermsPage` | `app/(app)/settings/terms/page.tsx` |
| `/stats` | alumno | `StatsPage` | `app/(app)/stats/page.tsx` |
| `/student-login` | público | `auth/StudentLoginPage` | `app/(auth)/student-login/page.tsx` |
| `/team` | alumno | `TeamPage` | `app/(app)/team/page.tsx` |
