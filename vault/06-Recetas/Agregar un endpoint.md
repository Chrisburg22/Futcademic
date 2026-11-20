---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-26
fuentes:
  - backend/api/routes/index.ts
  - backend/api/middlewares/tenant.middleware.ts
  - backend/api/scripts/dump-routes.ts
  - backend/api/__tests__/contract.test.ts
  - AGENTS.md
tags:
  - recetas
  - backend
---

# Agregar un endpoint

## 1. Controlador

`backend/api/controllers/<recurso>.controller.ts`

```ts
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export const getAlgo = async (req: Request, res: Response) => {
  const { school_id } = req.tenant!;           // nunca del body
  const { data, error } = await supabaseAdmin
    .from('tabla')
    .select('*')
    .eq('school_id', school_id);

  if (error) return res.status(500).json({ error: 'Error al consultar.' });
  res.status(200).json(data);
};
```

- Errores JSON en español.
- Si recibe `studentId`: `findStudentForTenant(req.tenant!, id)` antes de leer.
- No devuelvas `error.message` crudo al cliente salvo que el patrón existente ya lo haga.

## 2. Ruta

`backend/api/routes/<recurso>.routes.ts`

```ts
router.get('/', requireRole('super_admin', 'admin'), getAlgo);
```

- El router ya suele tener `router.use(requireAuth, requireTenant)`.
- Usa `requireRole` con los roles mínimos.
- Si es pública, agrega `rateLimit({ max, windowMs })`.

## 3. Montaje (solo recurso nuevo)

`backend/api/routes/index.ts`

```ts
router.use('/algo', algoRoutes);
```

## 4. Pruebas

- Añade un caso en `api/__tests__/` (usa `helpers.ts`, Supabase mockeado).
- Si toca permisos, cubre RBAC y aislamiento de tenant.

## 5. Contrato y build

```bash
cd backend
npm test
npm run routes:dump     # obligatorio
npm run build           # genera dist/
```

`contract.test.ts` falla si `api-contract.json` no refleja el router real. `dist/` se commitea.

## 6. Bóveda

```bash
python3 scripts/vault/vault.py generar
```

Actualiza a mano [[Middlewares y autenticacion]] si cambió el patrón de acceso y anota en [[Bitacora]].

## Checklist

- [ ] `school_id` desde `req.tenant`.
- [ ] `requireRole` correcto.
- [ ] `findStudentForTenant` si hay alumno.
- [ ] Test de RBAC/tenant.
- [ ] `routes:dump`.
- [ ] `npm run build` + commit de `dist/`.
- [ ] Bóveda regenerada.
