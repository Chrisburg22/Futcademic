# Arquitectura técnica

## Vista general

```
   App móvil (Expo)          Panel web (Vite + React)
          \                         /
           \   Bearer token (JWT)  /
            v                     v
        API REST  (Express + TypeScript)  ──►  Render.com
                 |
                 |  service role (acceso completo)
                 v
        Base de datos PostgreSQL + Auth + Storage  ──►  Supabase
```

Tres piezas, un repositorio: `backend/`, `web/` y `mobile/`.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| **Backend** | Node.js, Express 4, TypeScript 5. Despliegue en Render.com. |
| **Panel web** | React 19, Vite 6, TypeScript, Mantine 7 (interfaz), TanStack Query 5 (datos), axios. Despliegue en Vercel. PWA con service worker. |
| **App móvil** | Expo (React Native) con Expo Router, NativeWind (Tailwind). |
| **Datos y acceso** | Supabase: PostgreSQL, autenticación con JWT y almacenamiento de archivos. |

## Multi-inquilino: cómo se aíslan las academias

**Toda tabla de negocio lleva una columna `school_id`.** El aislamiento se impone en dos capas:

1. **En el backend**, tres middlewares encadenados en cada petición:
   - `requireAuth` valida el JWT de Supabase y deja al usuario en la petición.
   - `requireTenant` busca al usuario en la tabla `users` y fija `{ school_id, role, user_id }`.
   - `requireRole(...)` restringe cada ruta a los roles permitidos.

   Después, **cada consulta filtra por el `school_id` del inquilino**. El backend usa la clave de servicio de Supabase (acceso total), así que ese filtro es la barrera real.

2. **En la base de datos**, políticas de seguridad por fila (RLS) del tipo `school_id = (el school_id del usuario autenticado)`, que protegen el acceso directo desde los clientes que hablan con Supabase sin pasar por la API.

## Flujo de datos

- **Autenticación y sesión:** directamente contra Supabase Auth, desde la app móvil y el panel web.
- **Lecturas y escrituras de negocio:** por la API REST, con el token en la cabecera `Authorization`. Esto permite validar el tenant y el rol en cada operación.
- **Panel web:** TanStack Query pide a la API y **persiste su caché** en el navegador para funcionar sin conexión; la caché se invalida con cada versión nueva de la aplicación.

## Organización del código

```
backend/api/
  index.ts, app.ts          arranque de Express
  config/supabase.ts        cliente de Supabase con la clave de servicio
  middlewares/              auth y tenant
  controllers/              un archivo por recurso (alumnos, asistencias, pagos,
                            eventos, categorías, sedes, usuarios, permisos,
                            logros, notificaciones, dashboard, exportación,
                            carga de archivos, padres, chat)
  routes/                   un router por recurso, montados bajo /api
  services/                 correo, credenciales, permisos de acceso y chat de IA
web/src/
  pages/                    pantallas por rol (admin, dashboard, auth, settings)
  hooks/                    un hook de TanStack Query por recurso
  api/axios.ts              cliente HTTP que inyecta el token
  lib/queryClient.ts        caché persistida de la PWA
mobile/app/                 rutas por rol: admin, couch (profesor), fathers, student
migrations/                 cambios incrementales sobre schema.sql
```

## Asistente de IA

Un agente en el backend con **herramientas internas**: cada herramienta llama a la propia API con el contexto del usuario, de modo que el asistente nunca puede hacer más que el usuario que lo invoca. Las respuestas se transmiten por SSE y **toda acción que modifica datos exige confirmación**.

## Variables de entorno (solo nombres)

| Dónde | Variables |
|---|---|
| Backend | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN` (opcional) |
| Panel web | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| App móvil | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

La clave de servicio **nunca** va a los clientes: solo vive en el backend.

## Comandos

```bash
cd backend && npm run dev          # API local
cd web && npm run dev              # panel web local
cd mobile && npx expo start        # app móvil
```

## Pruebas automatizadas

| Pieza | Herramienta | Qué cubre |
|---|---|---|
| Backend | Jest (`npm test`) | 22 archivos de prueba: **aislamiento entre academias** (`tenant-isolation`), permisos por rol (`rbac`, `permission`, `ownership`), autenticación, alumnos, pagos y estado de cuenta, logros, notificaciones, exportación, carga de archivos, dashboard y el asistente de IA (agente, herramientas y base de datos del chat). |
| Panel web | Playwright (`npm run test:e2e`) | Pruebas de extremo a extremo por fases, de la instalación como PWA y de un recorrido de humo contra producción. |
| App móvil | — | Sin pruebas automatizadas; se valida a mano. |

Las pruebas de aislamiento entre academias son las más importantes del proyecto: verifican que una academia nunca pueda leer ni modificar los datos de otra.
