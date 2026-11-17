# Futcademic Web

Panel de administración en **Next.js 16 (App Router)** + React 19. Consume el backend Express + Supabase.

## Stack

- Next.js 16 (App Router, todo client-side: no hay SSR de datos)
- React 19 + TypeScript
- Mantine v7 (UI) + Tailwind v3 (utilitarias)
- TanStack Query v5 (con caché persistida en localStorage)
- Supabase JS v2 (sesión en el navegador)
- Axios
- Playwright (e2e con backend mockeado)

## Setup

```bash
cd web
cp .env.example .env   # rellena NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:5173
```

Backend en paralelo:

```bash
cd ../backend && npm run dev   # http://localhost:3000
```

## Scripts

- `npm run dev` — Next en modo dev, puerto 5173
- `npm run build` — build de producción (typecheck incluido)
- `npm run start` — sirve el build en 5173
- `npm run test:e2e` — Playwright con Supabase/API mockeados; arranca el dev server solo
- `npm run test:smoke` — ⚠️ golpea producción y crea academias reales (`ALLOW_PROD_SMOKE=yes`)
- `npm run e2e:video` — graba el recorrido demo

## Estructura

- `app/` — rutas del App Router. Cada `page.tsx` es un wrapper fino que monta la pantalla y aplica `ProtectedRoute` con los roles permitidos.
- `src/screens/` — implementación de las pantallas (antes `src/pages/`; no reintroduzcas `src/pages/` porque Next lo trataría como Pages Router).
- `src/components/layout/` — `AppShell`, `Sidebar`, `ProtectedRoute`.
- `src/contexts/AuthContext.tsx` — sesión Supabase + perfil con join a `schools`.
- `src/api/axios.ts` — base URL + interceptor JWT.
- `src/hooks/` — TanStack Query hooks contra la API.
- `src/lib/queryClient.ts` — caché persistida (24 h, buster por build).

## Roles

`super_admin`, `admin`, `profesor`, `padre`, `alumno` — el sidebar y los wrappers de ruta filtran por rol.

## PWA y uso sin conexión

- `app/manifest.ts` → `/manifest.webmanifest` (Next inyecta el `<link rel="manifest">`).
- `public/sw.js` → service worker escrito a mano, sin Workbox ni Serwist:
  - `futcademic-assets`: cache-first para `/_next/static` y archivos estáticos
    (llevan hash, son inmutables). No se purgan entre despliegues: son lo que
    mantiene viva la versión instalada cuando no hay red.
  - `futcademic-docs`: network-first para documentos HTML y payloads RSC, con
    clave sin query string (para no guardar tokens de invitación).
  - `/offline` como último recurso al navegar a una pantalla nunca abierta.
  - `/api/**` y los otros orígenes (Supabase, backend de Render) nunca se
    cachean: de los datos se encarga la caché persistida de TanStack Query.
- `src/components/pwa/ServiceWorkerRegistration.tsx` lo registra **solo en
  producción** (en desarrollo desinstala el que hubiera: un SW sirviendo chunks
  viejos rompe el HMR) y le pasa los recursos de la primera carga, para que la
  app abra sin red ya tras la primera visita.
- `src/lib/offlineAuth.ts` es lo que permite arrancar sin conexión:
  `getSession()` devuelve `null` cuando el refresh del token no tiene red, así
  que se cae a la sesión escrita en localStorage por supabase-js y al último
  perfil descargado. Ambas cosas se borran al cerrar sesión.
- `InstallButton` cubre la instalación (prompt nativo, pasos de iOS y de
  escritorio sin evento).

### Escribir sin conexión

No hay cola propia: TanStack Query ya trae una. Con `networkMode: 'online'` una
mutación lanzada sin red no falla, queda **pausada**; el persister la guarda
junto a la caché y `onlineManager` la reanuda al volver la conexión.

- `src/lib/offlineMutations.ts` registra con `setMutationDefaults` la
  `mutationFn`, el optimista y los `invalidateQueries` de lo que entra en cola
  (pase de lista, completar entrenamiento, cobro de alumno y pago a profesor).
  **Tienen que vivir en los defaults**: una mutación rehidratada tras recargar
  solo conserva su `mutationKey`, no la función ni los callbacks del hook.
- Los hooks (`useSaveAttendances`, `useRegisterStudentPayment`…) solo declaran
  `mutationKey`.
- Las pantallas no pueden `await mutateAsync`: sin red esa promesa no resuelve
  hasta que vuelva la conexión. Usan `mutate` con callbacks y consultan
  `willQueueOffline()` antes de lanzar para avisar de que el dato sigue en el
  dispositivo.
- `OfflineQueueBadge` muestra «N por enviar» en la cabecera y avisa cuando la
  cola se vacía; cerrar sesión con cola pendiente pide confirmación, porque
  `clearPersistedCache` también la borra.
- `queryClient.ts` sincroniza `onlineManager` con `navigator.onLine` al
  arrancar. Sin eso, una app abierta **ya sin red** se cree conectada (los
  eventos `online`/`offline` nunca llegaron) y ejecuta la cola contra el vacío,
  perdiéndola.

Lo que sigue sin funcionar sin conexión: iniciar sesión (lo valida Supabase) y
cualquier escritura que no esté en `offlineMutations.ts`.

Verificación: `npm run test:pwa` (build de producción en el puerto 4173 +
`e2e/pwa.spec.ts`: manifest, service worker, corte de red real, cola de
escrituras con recarga incluida y borrado de caché al cerrar sesión).
`playwright.config.ts` lo sigue ignorando porque esa suite necesita un build, no
`next dev`.

Los iconos se regeneran desde `public/icon.svg`:

```bash
npx sharp-cli -i public/icon.svg -o public/pwa-512.png resize 512 512
# idem 192, apple-touch-icon 180 y favicon-32 32; maskable-512 sale de una
# variante sin borde redondeado y con el glifo al ~60% del lienzo.
```
