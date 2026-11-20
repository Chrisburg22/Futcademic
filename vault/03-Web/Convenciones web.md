---
tipo: nota
area: web
estado: verificado
actualizado: 2026-11-12
fuentes:
  - web/AGENTS.md
  - web/next.config.ts
  - web/src/lib/queryClient.ts
  - web/src/api/axios.ts
  - web/src/components/providers/Providers.tsx
tags:
  - web
---

# Convenciones web

## Dónde están las reglas de UI móvil

En el **`AGENTS.md` del repo raíz**, sección «Mobile UI rules», no en
`web/AGENTS.md`: ese lo regenera `next dev` y cualquier cosa escrita ahí se
pierde. La sección de abajo, «Capa móvil», es la versión larga con los porqués.

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

## Capa móvil (teléfono, < 48em)

Añadida el 12-nov junto al rediseño de las vistas de alumno y padre.

- **Suelo táctil de 44 px por CSS, no por `defaultProps`.** `theme.ts` inyecta
  `classNames: { root: 'touch-target' }` en `Button` y `ActionIcon` (y
  `touch-row` en `Checkbox`/`Radio`/`Switch`); las reglas viven en
  `globals.css` bajo `@media (max-width: 48em)`. Hace falta porque
  `defaultProps` **no** gana contra una prop explícita: un
  `Button size="compact-sm"` escrito en el código seguiría midiendo ~26 px.
- **Escala de texto en móvil**: `globals.css` sobrescribe
  `--mantine-font-size-{xs,sm,md}` en `html:root` bajo 48em (13/15/16 px).
  Mantine v7 lee los tamaños de esas variables, así que sube de golpe todo el
  `size="xs"` sin tocar llamadas. `html:root` gana en especificidad a las
  variables que inyecta `MantineProvider`.
- **Navegación**: `src/components/layout/navItems.ts` es la **fuente única** de
  destinos (antes estaban duplicados en `Sidebar.tsx` y en los `SHORTCUTS` de
  `AdminDashboard.tsx`). `MobileNav.tsx` —que sustituyó a
  `QuickActionsDock.tsx`— pinta cuatro destinos por rol más «Más», que abre el
  mismo `useDisclosure` que el Burger. Se monta una sola vez en `AppShell`.
  `labelFor`/`shortLabelFor` permiten que una pantalla se llame distinto según
  el rol (`/finances` es «Finanzas» para el admin y «Pagos» para el padre).
  `esActivo` no usa coincidencia por prefijo en `to: '/'`: `startsWith('/')`
  marcaría Inicio en toda la app.
- **Capas (`z-index`)**: contenido < barra de navegación **150** < `ActionBar`
  fija **160** < overlays de Mantine (modales, drawers, hojas) **200** < botón
  del chat **190**. La barra estaba en 250 y el botón del chat en 300: los dos
  se dibujaban **encima** de las hojas inferiores y de los modales, tapando sus
  campos y su botón principal. El test no lo veía porque el control existía y
  Playwright lo daba por visible. Cualquier elemento fijo nuevo va por debajo
  de 200. El botón del chat además descuenta `--action-bar-height`, igual que
  ya descontaba `--quick-dock-height`.
- **Alturas de barras, en un solo sitio**: `MobileNav` publica
  `--quick-dock-height` (60 px) y `ActionBar` publica `--action-bar-height`
  (72 px) por atributo en el `body`; `.mantine-AppShell-main` suma las dos más
  `env(safe-area-inset-bottom)`. Cambiar una altura es cambiar la constante del
  componente y la variable del CSS, nada más.
- **Detectar móvil**: `visibleFrom`/`hiddenFrom` o media queries en CSS Modules
  para maquetación; `src/hooks/useEsMovil.ts` (con
  `getInitialValueInEffect: false`) **solo** para contenido que aparece tras una
  interacción. `useMediaQuery` sin opciones devuelve `undefined` en el primer
  render y pinta la rama de escritorio.
- **Hojas inferiores sobre `Drawer` de Mantine** (`common/BottomSheet.tsx`). Se
  descartó `vaul`: ~12-15 kB más `@radix-ui/react-dialog`, o sea un segundo
  gestor de foco junto al `ModalsProvider` que ya está montado, y su ventaja
  (arrastre con anclaje) no la descubre el público objetivo.
- **Primitivas compartidas** en `src/components/common/`: `ActionBar`,
  `BottomSheet`, `TouchRow`, `KpiCarousel`, `FilterChip`, `FilterSheet`,
  `InfoPopover` (sustituye a los `Tooltip` que eran el único sitio donde vivía
  un dato: en táctil no se abren), `ErrorState`, `SkeletonPage`, `SearchInput`,
  `BirthDateInput`. Más `attendance/AttendanceStrip`.
- **Etiquetas de estado**: nunca pintar el valor de la base con
  `tt="capitalize"` («Pendiente_pago»). `ESTADOS_ALUMNO` + `normalizarEstado` de
  `lib/students.ts` dan etiqueta y color.
- **Hojas inferiores sin asa**: el `Drawer` de Mantine pinta su cabecera
  primero, así que una barrita bajo el título se lee como separador. El botón de
  cerrar va a `size="lg"`.
- **Regla de las dos ramas**: cuando una pantalla pinta tabla en escritorio y
  filas en móvil, se montan las dos y elige el CSS. `getByRole` de Playwright no
  ve lo oculto, pero `getByText` sí: no duplicar títulos ni encabezados (por eso
  `PageHeader` renderiza el título una sola vez y solo cambia `fz`/`mb`).

## Pruebas

- `npm run build` incluye typecheck: es la verificación mínima. **En un
  worktree hace falta pasarle las variables**, porque `web/.env` está
  gitignorado y no se copia:
  `NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run build`.
  Y nunca `npm run build | tail`: el código de salida sería el del `tail`.
- **`compact-*` se permite**: el suelo CSS lo sube a 44 px en teléfono y
  `e2e/touch-targets.spec.ts` lo comprueba. Lo que no vale es construir con
  `compact-*` o con un `Badge` un control que solo exista en el teléfono.
- **`getByText` es subcadena**, así que dos textos que se solapan rompen por
  *strict mode*. Pasó dos veces: una descripción de pantalla que repetía la
  etiqueta de una tarjeta («Tu próximo entrenamiento…») —ahí el arreglo era la
  redacción, no el test— y el encabezado «Compañeros» contra el badge
  «3 compañeros» de `CategorySummary`, donde sí toca `{ exact: true }`.
- `getByRole` **no** ve lo oculto por CSS, pero el cajón lateral de móvil sigue
  en el árbol de accesibilidad aunque esté fuera del viewport: al buscar un
  enlace de la pantalla hay que acotar por su etiqueta exacta o por el `main`.
- `npm run test:e2e` usa backend mockeado y levanta el dev server.
- `npm run test:smoke` golpea producción y crea academias reales: solo con `ALLOW_PROD_SMOKE=yes` y conciencia del daño.

Ver [[Comandos y verificacion]] y [[Rutas web]].
