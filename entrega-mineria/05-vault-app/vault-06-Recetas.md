# Bóveda de la app Futcademic · 06-Recetas

Notas técnicas internas de la app (Obsidian). Los [[enlaces]] apuntan a otras notas de la bóveda.

---

## Nota: Actualizar la boveda

# Actualizar la boveda

## Cuándo

| Cambio | Acción |
|---|---|
| Ruta, rol o controlador | `generar` + revisar [[Middlewares y autenticacion]] |
| Tabla, columna o migración | `generar` + [[Base de datos]] / [[Deriva conocida]] |
| Pantalla, ruta web o hook | `generar` + [[Pantallas]] |
| Arquitectura o flujo | editar la nota a mano + fecha |
| Descubres una contradicción | agregarla a [[Deriva conocida]] |

## Procedimiento

```bash
# 1. Regenerar lo que sale del código
python3 scripts/vault/vault.py generar

# 2. Revisar
python3 scripts/vault/vault.py verificar

# 3. (opcional) ver el mapa que leen los agentes al iniciar
python3 scripts/vault/vault.py brief
```

En Claude Code esto está automatizado: `SessionStart` inyecta `brief`,
`SessionEnd` corre `generar` + `verificar` y `Stop` bloquea el cierre si hubo
código nuevo sin entrada en [[Bitacora de sesiones]]. Los scripts viven en
`~/.claude/hooks/futcademic-vault-*.sh`.

`verificar` reporta:

- **Errores**: enlaces rotos, nombres duplicados, fuentes inexistentes. Se corrigen antes de commitear.
- **Avisos**: nota generada obsoleta (corre `generar`) o nota escrita a mano más vieja que su fuente.

## Corregir un aviso de nota obsoleta

1. Abre la nota y el archivo fuente que cita.
2. Actualiza el contenido.
3. Cambia `actualizado:` a la fecha de hoy **solo si verificaste**.
4. Si el tema cambió de fondo, parte la nota o crea una nueva y enlaza.

## Reglas

- No editar notas `tipo: generado`: el próximo `generar` las pisa.
- No borrar una nota sin quitar los enlaces que la apuntan.
- No duplicar títulos: Obsidian resuelve por nombre.
- No meter secretos, tokens ni datos de menores.
- Cada cambio deja entrada en [[Bitacora de sesiones]] (una por conversación:
  objetivo, cambios, decisiones y pendientes). [[Bitacora]] es la tabla vieja de
  cambios de la bóveda; se conserva como histórico.

## Ver también

- [[Convenciones de la boveda]]
- [[Protocolo de busqueda]]

---

## Nota: Agregar un endpoint

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

---

## Nota: Agregar una pantalla

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

---

## Nota: Cambiar la base de datos

# Cambiar la base de datos

## 1. Migración

Crea `migrations/YYYYMMDD_descripcion.sql`. Idempotente y compatible hacia atrás:

```sql
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS talla_uniforme TEXT;

CREATE INDEX IF NOT EXISTS students_talla_idx
  ON public.students (school_id, talla_uniforme);
```

- No borres ni renombres columnas en el mismo paso que despliega el código.
- Para un campo obligatorio: agregar nullable → backfill → `SET NOT NULL` en migración posterior.
- Si creas una **tabla** nueva, cierra la puerta directa como las migraciones
  del 26-oct: `alter table ... enable row level security;` sin políticas. El
  backend entra con la service key; el navegador no.

## 2. Aplicar

En el **SQL Editor de Supabase**, en orden de nombre. No hay runner. Verifica en una base de prueba antes de producción.

## 3. Actualizar la base documental

- `schema.sql` si el cambio debe existir en instalaciones nuevas.
- `docs/technical/DATABASE-SCHEMA.md` **y** `ESQUEMA-BASE-DATOS.md` (par EN/ES).

## 4. Código

| Capa | Qué tocar |
|---|---|
| Backend | controlador que lee/escribe la columna; tipos si aplica |
| Web | `src/types/index.ts`, hook y formulario |
| Tests | caso que cubra el campo nuevo |

## 5. Verificar

```bash
cd backend && npm test && npm run build
cd ../web && npm run build
python3 scripts/vault/vault.py generar
```

## 6. Desplegar en orden

1. Migración aplicada.
2. Backend desplegado (con `dist/` actualizado).
3. Web desplegada.
4. Smoke: login + lectura/escritura del campo.

## Checklist

- [ ] Migración fechada e idempotente.
- [ ] `schema.sql` actualizado si aplica.
- [ ] Docs EN/ES actualizados.
- [ ] Tipos y hooks actualizados.
- [ ] `Tablas.md` regenerado.
- [ ] Deriva revisada: ¿la columna ya existía sin documentar?
- [ ] Tabla nueva con RLS habilitado.

Ver [[Migraciones]] y [[Deriva conocida]].

---

## Nota: Verificar cambios

# Verificar cambios

## Comandos por pieza

| Pieza | Comando | Qué debe pasar |
|---|---|---|
| Backend | `cd backend && npm test` | 26 suites verdes, Supabase mockeado |
| Backend build | `cd backend && npm run build` | `dist/` actualizado |
| Contrato | `cd backend && npm run routes:dump` | `api-contract.json` sin diff inesperado |
| Web | `cd web && npm run build` | typecheck + build |
| Web e2e | `cd web && npm run test:e2e` | flujos mockeados |
| Landing | `cd landing && npm run build` | `dist/` |
| Bóveda | `python3 scripts/vault/vault.py verificar` | 0 errores |

## Según el cambio

| Cambio | Obligatorio |
|---|---|
| Nueva ruta / rol | `npm test`, `routes:dump`, `npm run build`, regenerar bóveda |
| Controlador sin ruta nueva | `npm test`, `npm run build` |
| Migración | aplicar SQL, probar endpoint, `schema.sql`, docs EN/ES, regenerar bóveda |
| Pantalla / hook | `npm run build`; e2e si es flujo |
| Solo texto de landing | `npm run build` |
| Solo notas | `python3 scripts/vault/vault.py verificar` |

## Señales de que algo está mal

| Señal | Probable causa |
|---|---|
| `contract.test.ts` falla | falta `routes:dump` o el router cambió sin actualizar el JSON |
| 403 en una ruta que la UI muestra | `ProtectedRoute` permite más que `requireRole` |
| Datos de otra academia | falta `school_id` o `findStudentForTenant` |
| Error de columna inexistente | deriva entre SQL y código: [[Deriva conocida]] |
| Build de Next falla por hidratación | chequeo de navegador en render |
| `verificar` marca nota obsoleta | corre `generar` o actualiza la nota y su fecha |

## Antes de decir "listo"

- [ ] El comando de la tabla pasó, no "debería pasar".
- [ ] `git status` incluye lo esperado (y `dist/` si tocaste backend).
- [ ] No hay secretos nuevos en archivos versionados.
- [ ] La bóveda quedó coherente: `python3 scripts/vault/vault.py verificar`.
- [ ] [[Bitacora de sesiones]] tiene la entrada del cambio (el hook `Stop` de Claude Code bloquea el cierre si falta).

## Lo que no se corre a la ligera

- `ALLOW_PROD_SMOKE=yes npm run test:smoke`: golpea producción y **crea academias reales**.
- Migraciones en producción sin backup/ventana.
- `npm run capturas` / `npm run demo` del landing: levantan `../web` con build + start en 5174 y necesitan que `web/` compile.
