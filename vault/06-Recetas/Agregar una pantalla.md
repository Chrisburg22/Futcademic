---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
fuentes:
  - web/app/(app)/layout.tsx
  - web/src/screens
  - web/src/hooks
  - web/src/components/layout/Sidebar.tsx
  - web/src/api/axios.ts
  - AGENTS.md
tags:
  - recetas
  - web
---

# Agregar una pantalla

## 1. Pantalla real

`web/src/screens/MiPantalla.tsx` (o `src/screens/admin/` si es administración).

- Componente cliente (`'use client'` solo si usa hooks/eventos; en la práctica todas lo son).
- Usa Mantine para UI y `PageHeader` para el encabezado.
- No hagas fetch directo con axios: crea un hook.

## 2. Hook

`web/src/hooks/useMiRecurso.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useMiRecurso = () =>
  useQuery({
    queryKey: ['mi-recurso'],
    queryFn: async () => (await api.get('/mi-recurso')).data,
  });
```

- `queryKey` estable y específico.
- Invalidar queries relacionadas en mutaciones (`queryClient.invalidateQueries`).
- El JWT lo pone el interceptor; no lo manejes a mano.

## 3. Página envoltorio

`web/app/(app)/mi-ruta/page.tsx`

```tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { MiPantalla } from '@/screens/MiPantalla';

export default function Page() {
  return (
    <ProtectedRoute roles={['super_admin', 'admin']}>
      <MiPantalla />
    </ProtectedRoute>
  );
}
```

- `roles` debe coincidir con lo que la API permite.
- Si la pantalla es para cualquier autenticado, omite `roles` (el layout ya exige sesión).
- **Nunca** crees `src/pages/`.

## 4. Navegación

Si debe aparecer en el menú, agrega la entrada en `web/src/components/layout/Sidebar.tsx` con el rol correspondiente.

## 5. Verificar

```bash
cd web
npm run build
npm run test:e2e        # si es flujo de usuario
```

## 6. Bóveda

```bash
python3 scripts/vault/vault.py generar
```

Eso actualiza [[Rutas web]] y [[Hooks y endpoints]]. Añade la pantalla a [[Pantallas]] a mano y anota en [[Bitacora de sesiones]].

## Errores comunes

| Síntoma | Causa |
|---|---|
| Hydration mismatch | cálculo de `window`/PWA en render; muévelo a `useEffect` |
| 401 en la API | el hook no usa `api` o el token no está en localStorage |
| Datos viejos tras mutar | falta invalidar la query |
| La página no aparece en el menú | falta `Sidebar` |
| 403 aunque la UI deje entrar | `roles` de la página no coincide con `requireRole` |
